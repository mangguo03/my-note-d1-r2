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
        // 3. 基础页面或 404 处理
        // ==========================================
        return new Response("芒果记云端 API 服务已启动", { headers: corsHeaders });
    }
};
