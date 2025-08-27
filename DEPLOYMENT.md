# 生产环境部署指南

本文档介绍如何将抖音分析系统前端部署到生产服务器的80端口。

## 部署方案

### 方案1：使用Docker（推荐）

Docker部署是最简单、最一致的部署方式。

#### 快速部署

1. **构建并运行**
   ```bash
   # 使用docker-compose（推荐）
   docker-compose up -d
   
   # 或手动构建
   docker build -t dyanalyse-frontend .
   docker run -d -p 80:80 dyanalyse-frontend
   ```

2. **配置后端API地址**
   编辑 `nginx.docker.conf` 文件中的后端地址：
   ```nginx
   location /api {
       proxy_pass http://your-backend-ip:port;  # 改为实际后端地址
   }
   ```

3. **更新应用**
   ```bash
   # 重新构建并部署
   docker-compose down
   docker-compose up -d --build
   
   # 或使用无缓存构建
   docker-compose build --no-cache
   docker-compose up -d
   ```

#### Docker配置说明

- **Dockerfile**: 使用多阶段构建，先构建项目再打包到nginx镜像
- **nginx.docker.conf**: Docker环境专用的nginx配置
- **docker-compose.yml**: 容器编排配置

#### 后端服务连接

如果后端在宿主机上：
```nginx
proxy_pass http://host.docker.internal:8080;
```

如果后端也是Docker容器：
```nginx
proxy_pass http://backend:8080;  # backend是容器名称
```

### 方案2：使用Nginx

1. **安装Nginx**
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install nginx
   
   # CentOS/RHEL
   sudo yum install nginx
   ```

2. **配置Nginx**
   - 复制 `nginx.conf` 到 `/etc/nginx/sites-available/dyanalyse`
   - 修改配置文件中的以下参数：
     ```nginx
     server_name your-domain.com;  # 改为你的域名
     root /var/www/dyanalyse/dist;  # 改为dist目录的绝对路径
     proxy_pass http://your-backend-server:port;  # 改为后端服务器地址
     ```

3. **部署静态文件**
   ```bash
   # 将dist目录复制到服务器
   sudo cp -r dist /var/www/dyanalyse/
   sudo chown -R www-data:www-data /var/www/dyanalyse/
   ```

4. **启用站点**
   ```bash
   sudo ln -s /etc/nginx/sites-available/dyanalyse /etc/nginx/sites-enabled/
   sudo nginx -t  # 测试配置
   sudo systemctl restart nginx
   ```

### 方案3：使用Node.js服务器

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置后端服务器地址**
   编辑 `server.js` 文件，修改：
   ```javascript
   const BACKEND_URL = 'http://your-backend-server:port';
   ```

3. **构建并启动**
   ```bash
   npm run prod  # 构建并启动生产服务器
   
   # 或者分步执行
   npm run build  # 构建
   npm start      # 启动服务器
   ```

4. **后台运行（推荐使用PM2）**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "dyanalyse-frontend"
   pm2 save
   pm2 startup
   ```

## API代理配置

### 后端服务器地址配置

前端需要将 `/api` 开头的请求代理到后端服务器。请根据你的后端部署情况修改相应配置：

**Nginx方案：**
```nginx
location /api {
    proxy_pass http://你的后端IP:端口;
    # 例如：proxy_pass http://192.168.1.100:8080;
}
```

**Node.js方案：**
```javascript
const BACKEND_URL = 'http://你的后端IP:端口';
// 例如：const BACKEND_URL = 'http://192.168.1.100:8080';
```

### 防火墙配置

确保服务器防火墙允许80端口访问：
```bash
# Ubuntu/Debian
sudo ufw allow 80

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

## 验证部署

1. 访问 `http://your-server-ip` 检查前端页面是否正常加载
2. 检查浏览器开发者工具，确认API请求正常代理到后端
3. 测试各项功能是否正常工作

## 常见问题

**Q: 页面刷新后出现404错误**
A: 这是SPA路由问题，确保Nginx配置了 `try_files $uri $uri/ /index.html;` 或Node.js服务器正确处理路由。

**Q: API请求失败**
A: 检查后端服务器地址是否正确，确保后端服务正常运行且网络可达。

**Q: 静态资源加载失败**
A: 检查文件权限和路径配置是否正确。