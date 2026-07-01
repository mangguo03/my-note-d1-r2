// 监听安装事件
self.addEventListener('install', (e) => {
    console.log('[Service Worker] 安装成功');
});

// 监听激活事件
self.addEventListener('activate', (e) => {
    console.log('[Service Worker] 激活成功');
});

// 核心要求：必须有 fetch 监听器，浏览器才会弹出安装按钮
self.addEventListener('fetch', (e) => {
    // 暂不拦截任何网络请求，直接放行
});
