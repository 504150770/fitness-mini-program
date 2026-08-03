@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   健身小程序 - 启动后端服务器
echo ========================================
cd /d "%~dp0server"
echo.
echo 正在启动服务器...
echo 地址: http://localhost:3000
echo 健康检查: http://localhost:3000/api/v1/health
echo.
echo 按 Ctrl+C 停止服务器
echo.
npx.cmd tsx src/app.ts
pause