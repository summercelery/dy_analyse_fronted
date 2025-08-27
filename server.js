const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();

// 配置你的后端服务器地址
const BACKEND_URL = 'http://your-backend-server:port'; // 替换为实际后端地址

// API代理中间件
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api' // 保持API路径不变
  }
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// SPA路由处理 - 所有非API请求返回index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`前端服务运行在端口 ${PORT}`);
  console.log(`API代理到: ${BACKEND_URL}`);
});