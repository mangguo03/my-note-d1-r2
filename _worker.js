export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // ==========================================
        // 0. 全局跨域处理 (CORS) - 确保前端能顺利调用后台
        // ==========================================
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*", // 正式上线后建议改成你的实际前端域名
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        // 处理浏览器的预检请求
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        // ==========================================
        // 1. R2 功能：处理图片上传 (/api/upload-image)
        // 使用绑定的变量: env.BUCKET 
        // 实际指向你的存储桶: myonote-images
        // ==========================================
        if (url.pathname === '/api/upload-image' && request.method === 'POST') {
            try {
                // 验证用户身份 (这里简单校验，实际根据你的逻辑来)
                const authHeader = request.headers.get('Authorization');
                if (!authHeader) return new Response("未授权", { status: 401, headers: corsHeaders });

                // 解析前端传来的 FormData 图片数据
                const formData = await request.formData();
                const file = formData.get('file');
                if (!file) return Response.json({ success: false, message: '未找到文件' }, { headers: corsHeaders });

                // 给图片生成一个独一无二的随机文件名
                const uniqueFilename = `images/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;

                // 🚀 核心魔法：将文件流写入 R2 存储桶！
                await env.BUCKET.put(uniqueFilename, file.stream(), {
                    httpMetadata: { contentType: file.type }
                });

                // 🚀 从 Cloudflare 环境变量中读取你在后台配置的域名
                // 如果后台没配置，就给个默认的回退提示，防止报错
                const domain = env.R2_PUBLIC_DOMAIN || "https://未配置环境变量"; 
                const publicUrl = `${domain}/${uniqueFilename}`;
                
                return Response.json({ success: true, url: publicUrl }, { headers: corsHeaders });
            } catch (err) {
                return Response.json({ success: false, message: err.message }, { headers: corsHeaders });
            }
        }

        // ==========================================
        // 2. D1 功能：处理日记数据同步 (/api/sync)
        // 使用绑定的变量: env.DB 
        // 实际指向你的数据库: my-onote
        // ==========================================
        if (url.pathname === '/api/sync' && request.method === 'POST') {
            try {
                const authHeader = request.headers.get('Authorization');
                if (!authHeader) return new Response("未授权", { status: 401, headers: corsHeaders });
                
                // 从 Authorization 中解析出账号 (基础的 Basic Auth 解析)
                const base64Credentials = authHeader.split(' ')[1];
                const [username, password] = atob(base64Credentials).split(':');

                const data = await request.json();
                
                // 🚀 核心魔法：使用 SQL 语句将数据写入 D1 数据库！
                const stmt = env.DB.prepare(`
                    INSERT INTO user_data (username, notes_json, categories_json, trash_json) 
                    VALUES (?, ?, ?, ?) 
                    ON CONFLICT(username) DO UPDATE SET 
                    notes_json = excluded.notes_json,
                    categories_json = excluded.categories_json,
                    trash_json = excluded.trash_json,
                    updated_at = CURRENT_TIMESTAMP
                `).bind(
                    username, 
                    JSON.stringify(data.notes || []), 
                    JSON.stringify(data.categories || []), 
                    JSON.stringify(data.trashBin || [])
                );
                
                await stmt.run();
                return Response.json({ success: true, message: "同步成功" }, { headers: corsHeaders });
            } catch (err) {
                return Response.json({ success: false, message: err.message }, { headers: corsHeaders });
            }
        }

        // ==========================================
        // 4. D1 功能：账号注册 (/api/register)
        // ==========================================
        if (url.pathname === '/api/register' && request.method === 'POST') {
            try {
                const { username, password } = await request.json();
                if (!username || !password) return Response.json({ success: false, message: "账号或密码不能为空" }, { headers: corsHeaders });

                // 检查数据库里有没有这个账号
                const existUser = await env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
                if (existUser) {
                    return Response.json({ success: false, message: "账号已存在，请直接登入" }, { headers: corsHeaders });
                }

                // 写入新账号到 users 表
                await env.DB.prepare("INSERT INTO users (username, password) VALUES (?, ?)").bind(username, password).run();
                
                return Response.json({ success: true, message: "注册成功" }, { headers: corsHeaders });
            } catch (err) {
                return Response.json({ success: false, message: err.message }, { headers: corsHeaders });
            }
        }

        // ==========================================
        // 5. D1 功能：账号登录 (/api/login)
        // ==========================================
        if (url.pathname === '/api/login' && request.method === 'POST') {
            try {
                const { username, password } = await request.json();
                
                // 去数据库比对账号密码
                const user = await env.DB.prepare("SELECT * FROM users WHERE username = ? AND password = ?").bind(username, password).first();
                
                if (user) {
                    return Response.json({ success: true, message: "登入成功" }, { headers: corsHeaders });
                } else {
                    return Response.json({ success: false, message: "账号或密码错误" }, { headers: corsHeaders });
                }
            } catch (err) {
                return Response.json({ success: false, message: err.message }, { headers: corsHeaders });
            }
        }

        // ==========================================
        // 6. D1 功能：读取云端日记数据 (/api/sync GET)
        // ==========================================
        if (url.pathname === '/api/sync' && request.method === 'GET') {
            try {
                const authHeader = request.headers.get('Authorization');
                if (!authHeader) return new Response("未授权", { status: 401, headers: corsHeaders });
                
                const base64Credentials = authHeader.split(' ')[1];
                const [username, password] = atob(base64Credentials).split(':');

                // 验证身份
                const user = await env.DB.prepare("SELECT * FROM users WHERE username = ? AND password = ?").bind(username, password).first();
                if (!user) return new Response("未授权", { status: 401, headers: corsHeaders });

                // 从数据库拉取属于这个账号的数据
                const dataRow = await env.DB.prepare("SELECT * FROM user_data WHERE username = ?").bind(username).first();
                
                let responseData = { notes: [], categories: [], trashBin: [] };
                
                if (dataRow) {
                    responseData.notes = JSON.parse(dataRow.notes_json || '[]');
                    responseData.categories = JSON.parse(dataRow.categories_json || '[]');
                    responseData.trashBin = JSON.parse(dataRow.trash_json || '[]');
                }
                
                return Response.json(responseData, { headers: corsHeaders });
            } catch (err) {
                return Response.json({ success: false, message: err.message }, { headers: corsHeaders });
            }
        }

        // ==========================================
        // 7. D1 功能：注销删除账号 (/api/delete-account)
        // ==========================================
        if (url.pathname === '/api/delete-account' && request.method === 'POST') {
            try {
                const authHeader = request.headers.get('Authorization');
                if (!authHeader) return new Response("未授权", { status: 401, headers: corsHeaders });
                const base64Credentials = authHeader.split(' ')[1];
                const [username] = atob(base64Credentials).split(':');

                // 将账号和日记数据双双从数据库物理删除
                await env.DB.prepare("DELETE FROM users WHERE username = ?").bind(username).run();
                await env.DB.prepare("DELETE FROM user_data WHERE username = ?").bind(username).run();
                
                return Response.json({ success: true, message: "账号已彻底注销" }, { headers: corsHeaders });
            } catch (err) {
                return Response.json({ success: false, message: err.message }, { headers: corsHeaders });
            }
        }
        
        // ==========================================
        // 3. 把剩下的工作交还给前端 (加载你的 HTML 界面)
        // ==========================================
        // 如果请求的不是 /api 接口，就自动去加载你的 index.html 网页文件
        try {
            return await env.ASSETS.fetch(request);
        } catch (e) {
            return new Response("前端网页加载失败，请确保你的代码仓库里有 index.html 文件。", { status: 404 });
        }
    }
};
