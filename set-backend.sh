#!/bin/sh
# docker-entrypoint.d 钩子 — nginx:alpine 入口脚本在处理完模板后自动调用
if [ -n "$BACKEND_URL" ]; then
    echo "==> 设置后端地址: $BACKEND_URL"
    sed -i "s|__BACKEND_URL__|$BACKEND_URL|g" /etc/nginx/conf.d/default.conf
else
    echo "==> 警告: BACKEND_URL 未设置，API 代理将不可用"
fi
