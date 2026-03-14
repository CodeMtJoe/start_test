@echo off
chcp 65001

echo 星币管理系统一键启动脚本
 echo ===============================

:: 检查是否安装了Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未安装Node.js，请先安装Node.js
    pause
    exit /b 1
)

:: 检查是否安装了Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未安装Python，请先安装Python
    pause
    exit /b 1
)

echo 启动代理服务器...
start /b cmd /c "npm start"
echo 启动前端服务器...
start /b cmd /c "python -m http.server 8000"
echo 服务启动中，请稍候...
timeout /t 5 >nul
echo 打开浏览器访问系统...
start http://localhost:8000

echo ===============================
echo 启动完成！
echo 按任意键退出...
pause >nul