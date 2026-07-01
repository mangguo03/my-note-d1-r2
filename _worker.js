export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);
            const path = url.pathname;
            const jsonHeaders = { "Content-Type": "application/json" };

            // 鉴权辅助函数
            async function verifyAuth() {
                const authHeader = request.headers.get('Authorization');
                if (!authHeader || !authHeader.startsWith('Basic ')) return null;
                const base64str = authHeader.substring(6);
                const decoded = atob(base64str);
                const [username, password] = decoded.split(':');
                if (!username || !password) return null;
                
                const stored = await env.NOTE_KV.get(`user:${username}`, { type: "json" });
                if (stored && stored.password === password) return username;
                return null;
            }

            // ==========================
            // 1. API: 注册账号 (带数量限制)
            // ==========================
            if (path === '/api/register' && request.method === 'POST') {
                if (!env.NOTE_KV) throw new Error("严重错误：后台尚未绑定 NOTE_KV 存储！");
                
                const bodyText = await request.text();
                const body = JSON.parse(bodyText);
                const username = body.username;
                const password = body.password;

                if (!username || !password) {
                    return new Response(JSON.stringify({ success: false, message: "账号或密码为空" }), { status: 400, headers: jsonHeaders });
                }

                // 限制注册人数
                const maxUsers = env.MAX_USERS ? parseInt(env.MAX_USERS, 10) : 1; 
                const userList = await env.NOTE_KV.list({ prefix: 'user:' });
                
                if (userList.keys.length >= maxUsers) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        message: `私有云限制：当前系统最多仅允许注册 ${maxUsers} 个账号` 
                    }), { status: 403, headers: jsonHeaders });
                }

                const existing = await env.NOTE_KV.get(`user:${username}`);
                if (existing) {
                    return new Response(JSON.stringify({ success: false, message: "该账号已被注册" }), { status: 400, headers: jsonHeaders });
                }

                await env.NOTE_KV.put(`user:${username}`, JSON.stringify({ password }));
                await env.NOTE_KV.put(`data:${username}`, JSON.stringify({}));
                
                return new Response(JSON.stringify({ success: true, message: "注册成功" }), { status: 200, headers: jsonHeaders });
            }

            // ==========================
            // 2. API: 登入账号
            // ==========================
            if (path === '/api/login' && request.method === 'POST') {
                if (!env.NOTE_KV) throw new Error("严重错误：后台尚未绑定 NOTE_KV 存储！");
                const bodyText = await request.text();
                const body = JSON.parse(bodyText);
                
                const stored = await env.NOTE_KV.get(`user:${body.username}`, { type: "json" });
                if (!stored || stored.password !== body.password) {
                    return new Response(JSON.stringify({ success: false, message: "账号或密码错误" }), { status: 401, headers: jsonHeaders });
                }
                return new Response(JSON.stringify({ success: true, message: "登入成功" }), { status: 200, headers: jsonHeaders });
            }

            // ==========================
            // 3. API: 云端数据同步
            // ==========================
            if (path === '/api/sync') {
                if (!env.NOTE_KV) throw new Error("严重错误：后台尚未绑定 NOTE_KV 存储！");
                const username = await verifyAuth();
                if (!username) return new Response(JSON.stringify({ message: "未授权" }), { status: 401, headers: jsonHeaders });

                if (request.method === 'GET') {
                    // 1. 先从 KV 数据库读取原本的笔记和分类文本
                    let dataText = await env.NOTE_KV.get(`data:${username}`);
                    let dataObj = {};
                    
                    try {
                        // 2. 如果数据库有数据，把它解析成 JSON 对象
                        if (dataText) dataObj = JSON.parse(dataText);
                    } catch(e) {
                        dataObj = {};
                    }
                    
                    // 💡 3. 核心新增：向打包大礼包里注入你在 Cloudflare 环境变量里配置的自定义名称
                    dataObj.appName = env.APP_NAME || "云笔记";
                    
                    // 4. 将塞入了名字的新大礼包重新转成文本，返回给前端
                    return new Response(JSON.stringify(dataObj), { status: 200, headers: jsonHeaders });
                }
                
                if (request.method === 'POST') {
                    const data = await request.text();
                    await env.NOTE_KV.put(`data:${username}`, data);
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
                }
            }

            // ==========================
            // 4. API: 账号注销 (彻底清空数据)
            // ==========================
            if (path === '/api/delete-account' && request.method === 'POST') {
                if (!env.NOTE_KV) throw new Error("严重错误：后台尚未绑定 NOTE_KV 存储！");
                const username = await verifyAuth();
                if (!username) return new Response(JSON.stringify({ success: false, message: "未授权" }), { status: 401, headers: jsonHeaders });

                // 删除对应账号的所有数据，包括登录凭证和笔记
                await env.NOTE_KV.delete(`data:${username}`);
                await env.NOTE_KV.delete(`user:${username}`);

                return new Response(JSON.stringify({ success: true, message: "账号及数据已彻底销毁" }), { status: 200, headers: jsonHeaders });
            }

            // ==========================
            // 5. 静态网页托管
            // ==========================
            if (!env.ASSETS) {
                throw new Error("云端组件丢失：ASSETS 对象不存在，无法渲染 index.html。");
            }
            
            const assetResponse = await env.ASSETS.fetch(request);
            if (assetResponse.status === 404 && path === '/') {
                throw new Error("404 错误：系统找不到 index.html。请检查 index.html 和 _worker.js 是否都在代码仓库的最外层根目录！");
            }
            return assetResponse;

        } catch (err) {
            return new Response(`🚨 网页崩溃日志 🚨\n\n错误信息: ${err.message}\n\n堆栈跟踪:\n${err.stack}`, { 
                status: 500, 
                headers: { "Content-Type": "text/plain;charset=UTF-8" } 
            });
        }
    }
};
