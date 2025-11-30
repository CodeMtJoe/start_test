#!/bin/sh

# 启动代理服务器
node /app/proxy.js &

# 启动Nginx
nginx -g "daemon off;"