# 使用Node.js作为基础镜像，用于构建代理服务器
FROM node:18-alpine as proxy-builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制代理服务器代码
COPY proxy.js ./

# 使用Nginx作为前端服务器
FROM nginx:alpine

# 设置工作目录
WORKDIR /usr/share/nginx/html

# 复制前端文件
COPY index.html ./
COPY script.js ./
COPY styles.css ./
COPY README.md ./

# 复制Nginx配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制代理服务器文件
COPY --from=proxy-builder /app /app

# 暴露端口
EXPOSE 80

# 启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 启动服务
CMD ["/start.sh"]