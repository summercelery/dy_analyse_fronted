# 多阶段构建
# 第一阶段：构建
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖清单（利用 Docker 层缓存）
COPY package*.json ./

# 使用 npm ci 确保依赖版本一致（构建阶段需要 devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 第二阶段：生产环境
FROM nginx:alpine

# 健康检查需要 wget
RUN apk add --no-cache wget

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx 配置（含占位符 __BACKEND_URL__）
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf

# 钩子脚本：在 nginx 启动前用 sed 替换占位符（nginx:alpine 入口脚本会自动调用 docker-entrypoint.d/*.sh）
COPY set-backend.sh /docker-entrypoint.d/40-set-backend.sh
RUN chmod +x /docker-entrypoint.d/40-set-backend.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1
