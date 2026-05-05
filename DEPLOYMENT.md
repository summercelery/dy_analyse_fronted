# dyAnalyse 生产环境部署指南

## 前置条件

- 服务器已安装 Docker（≥ 20.10）和 Docker Compose（≥ 2.0）
- 后端 API 服务已部署且可访问（假设地址为 `http://192.168.1.100:8080`）

---

## 快速部署（推荐）

### 1. 上传代码到服务器

```bash
# 在本地打包（排除 node_modules 和 dist）
git archive --format=tar.gz -o dyanalyse.tar.gz HEAD

# 上传到服务器
scp dyanalyse.tar.gz user@your-server:/opt/

# 在服务器上解压
ssh user@your-server
cd /opt && mkdir dyanalyse && cd dyanalyse
tar xzf ../dyanalyse.tar.gz
```

### 2. 配置后端地址

创建 `.env` 文件：

```bash
cd /opt/dyanalyse
cat > .env << 'EOF'
# 后端 API 地址（根据实际情况修改）
BACKEND_URL=http://你的后端IP:8080

# 前端暴露端口（默认 80）
FRONTEND_PORT=80
EOF
```

### 3. 构建并启动

```bash
docker-compose up -d --build
```

### 4. 验证

```bash
# 检查容器状态
docker-compose ps
docker-compose logs -f

# 本地验证
curl -I http://localhost
```

浏览器访问 `http://服务器IP` 即可。

---

## 后端地址说明

根据后端部署方式选择：

| 场景 | BACKEND_URL 值 |
|---|---|
| 后端在宿主机（Linux） | `http://192.168.1.100:8080` |
| 后端在宿主机（Docker Desktop） | `http://host.docker.internal:8080` |
| 后端也是 Docker 容器（同机） | `http://backend:8080` |
| 后端在其他服务器 | `http://10.0.0.5:8080` |

如果后端也是 Docker 容器，在 `docker-compose.yml` 中取消 backend 服务注释，并将两个服务放入同一网络。

---

## 常用操作

```bash
# 查看日志
docker-compose logs -f --tail=100

# 重启服务
docker-compose restart

# 更新代码后重新部署
git pull
docker-compose up -d --build

# 完全干净重建（清除缓存）
docker-compose build --no-cache && docker-compose up -d

# 停止服务
docker-compose down
```

---

## 防火墙

```bash
# firewalld
sudo firewall-cmd --permanent --add-port=80/tcp && sudo firewall-cmd --reload

# ufw
sudo ufw allow 80/tcp
```

---

## 故障排查

### 页面刷新 404

确认 `nginx.docker.conf` 中包含 `try_files $uri $uri/ /index.html;`（已默认配置）。

### API 请求失败（502/504）

检查 BACKEND_URL 是否正确，网络是否可达：

```bash
docker exec dyanalyse-frontend wget -qO- http://你的后端IP:8080/
```

### 容器启动失败

```bash
# 查看详细日志
docker-compose logs frontend

# 进入容器调试
docker exec -it dyanalyse-frontend sh
```
