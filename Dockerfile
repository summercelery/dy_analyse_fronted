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

# nginx:alpine 原生模板机制：/etc/nginx/templates/*.template 会被 envsubst 自动处理
COPY nginx.docker.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1
