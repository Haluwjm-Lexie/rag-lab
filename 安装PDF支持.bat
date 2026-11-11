@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo RAG Lab 1.1 已内置 PDF 解析组件，无需单独安装 pypdf。
echo 本脚本检查电脑的 Python 是否可用于 PDF 解析。
where py >nul 2>nul
if not errorlevel 1 (
  py -3 -X utf8 lib\pdf_extract.py --check
) else (
  python -X utf8 lib\pdf_extract.py --check
)
echo 如果提示找不到 Python，请安装 Python 3.9 或以上版本。
echo 安装后可在网页导入窗口点击“检测PDF支持”。
pause
