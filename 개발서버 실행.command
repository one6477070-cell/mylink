#!/bin/bash
# 더블클릭하면 터미널이 열리고 개발 서버가 켜져요. 끄려면 이 창에서 Control+C.
cd "$(dirname "$0")" || exit 1
exec > >(tee "dev-server.log") 2>&1
echo "=== 연결 지도 개발 서버 ==="
echo "node: $(which node) $(node -v 2>&1)"
echo "npm:  $(which npm) $(npm -v 2>&1)"
echo "cwd:  $(pwd)"
echo
if ! command -v npm >/dev/null 2>&1; then
  echo "npm을 찾지 못했어요. https://nodejs.org 에서 LTS를 설치한 뒤 다시 더블클릭해 주세요."
  read -n 1 -s -r -p "아무 키나 누르면 창이 닫힙니다."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "처음 실행이라 필요한 파일을 내려받아요. 1~2분 걸려요."
  if ! npm install; then
    echo "설치에 실패했어요. 이 창의 메시지(또는 dev-server.log)를 Claude에게 보여 주세요."
    read -n 1 -s -r -p "아무 키나 누르면 창이 닫힙니다."
    exit 1
  fi
  echo
fi
(sleep 4; open "http://localhost:3000") &
npm run dev
echo "=== 서버가 종료되었습니다 (종료코드 $?) ==="
read -n 1 -s -r -p "아무 키나 누르면 창이 닫힙니다."
