#!/bin/zsh
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "没有检测到 Node.js/npm。请先安装 Node.js 22 或更高版本。"
  read "REPLY?按回车键关闭窗口..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "首次运行，正在安装项目依赖..."
  npm install
fi

echo ""
echo "系统启动后，请打开终端显示的本地网址。"
echo "关闭本窗口或按 Control+C 即可停止服务。"
echo ""
npm run dev
