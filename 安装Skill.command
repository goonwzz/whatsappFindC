#!/bin/zsh
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_SOURCE="$PROJECT_DIR/skills/find-target-buyers"
CODEX_SKILLS_DIR="${CODEX_HOME:-$HOME/.codex}/skills"

mkdir -p "$CODEX_SKILLS_DIR"
rm -rf "$CODEX_SKILLS_DIR/find-target-buyers"
cp -R "$SKILL_SOURCE" "$CODEX_SKILLS_DIR/find-target-buyers"

echo ""
echo "find-target-buyers Skill 已安装。"
echo "请重新打开 Codex 或新建任务，然后输入："
echo '$find-target-buyers'
echo ""
read "REPLY?按回车键关闭窗口..."
