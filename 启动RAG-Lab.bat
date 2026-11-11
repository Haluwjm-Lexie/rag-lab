@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Lexie RAG Lab
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 20 或以上版本，再重新双击此文件。
  echo 下载地址：https://nodejs.org/
  pause
  exit /b 1
)
echo 正在启动 Lexie RAG Lab...
echo 浏览器地址：http://127.0.0.1:3220
echo 请保留本窗口。关闭窗口会停止服务，历史数据仍保存在 data 文件夹。
node server.mjs --open
pause
