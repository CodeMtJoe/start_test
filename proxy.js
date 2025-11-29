// 星币管理系统代理服务器
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

// 配置CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    
    next();
});

// 配置API代理
const apiProxy = createProxyMiddleware({
    target: 'https://steam.fun',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/java-api/points/sch' // 将/api前缀替换为实际API路径
    },
    onProxyReq: (proxyReq, req, res) => {
        // 保留原请求的查询参数
        if (req.body) {
            // 处理POST请求的body
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        // 可以在这里修改响应头或响应体
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`);
    }
});

// 使用API代理
app.use('/api', apiProxy);

// 处理POST请求的body
app.use(express.json());

// 启动服务器
app.listen(PORT, () => {
    console.log(`代理服务器已启动，监听端口 ${PORT}`);
    console.log(`前端API请求地址：http://localhost:${PORT}/api`);
    console.log(`使用说明：`);
    console.log(`1. 将前端代码中的API地址改为：http://localhost:${PORT}/api`);
    console.log(`2. 例如：查询学生ID API：http://localhost:${PORT}/api/stuStar/queryList`);
    console.log(`3. 例如：增加星币 API：http://localhost:${PORT}/api/starGrant/activeGrant`);
    console.log(`4. 启动前端服务器：python -m http.server 8000`);
    console.log(`5. 在浏览器中访问：http://localhost:8000`);
});