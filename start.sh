#!/usr/bin/env bash
# 墨摘 WeChat Digest · 本地一键启动
# 用法: ./start.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║     墨摘 WeChat Digest · 本地启动    ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# Check Deno
if ! command -v deno &>/dev/null; then
  echo -e "${RED}✗ 未检测到 Deno，请先安装：${NC}"
  echo "  curl -fsSL https://deno.land/install.sh | sh"
  echo "  或访问 https://docs.deno.com/runtime/getting_started/installation/"
  exit 1
fi
echo -e "${GREEN}✓ Deno $(deno --version | head -1 | awk '{print $2}')${NC}"

PORT_BACKEND=8000
PORT_FRONTEND=3000

# Start backend
echo -e "\n${CYAN}▸ 启动后端 (端口 $PORT_BACKEND)…${NC}"
deno run --allow-net --allow-env --unstable-kv backend/main.ts &
PID_BACKEND=$!

# Wait for backend
sleep 1
if ! kill -0 $PID_BACKEND 2>/dev/null; then
  echo -e "${RED}✗ 后端启动失败${NC}"
  exit 1
fi
echo -e "${GREEN}✓ 后端已启动: http://localhost:$PORT_BACKEND${NC}"

# Start frontend static server
echo -e "${CYAN}▸ 启动前端 (端口 $PORT_FRONTEND)…${NC}"

# Try deno serve, npx serve, or python http.server
if command -v npx &>/dev/null; then
  npx -y serve -s . -l $PORT_FRONTEND --no-clipboard &>/dev/null &
  PID_FRONTEND=$!
elif command -v python3 &>/dev/null; then
  python3 -m http.server $PORT_FRONTEND &>/dev/null &
  PID_FRONTEND=$!
else
  echo -e "${RED}✗ 需要 Node.js (npx) 或 Python3 来启动前端静态服务${NC}"
  kill $PID_BACKEND 2>/dev/null
  exit 1
fi
echo -e "${GREEN}✓ 前端已启动: http://localhost:$PORT_FRONTEND${NC}"

echo -e "\n${BOLD}══════════════════════════════════════════════${NC}"
echo -e "${BOLD}  打开浏览器访问: ${GREEN}http://localhost:$PORT_FRONTEND${NC}"
echo -e "${BOLD}  设置 → 后端 API 地址填: ${GREEN}http://localhost:$PORT_BACKEND${NC}"
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo -e "\n  按 ${BOLD}Ctrl+C${NC} 停止所有服务\n"

cleanup() {
  echo -e "\n${CYAN}正在停止服务…${NC}"
  kill $PID_BACKEND 2>/dev/null
  kill $PID_FRONTEND 2>/dev/null
  echo -e "${GREEN}已停止${NC}"
  exit 0
}
trap cleanup INT TERM

wait
