#!/bin/bash
# Đám Cưới Mèo — chạy trên Mac/Linux: bash run.sh
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  echo "Lần đầu chạy: đang cài thư viện, đợi 1-2 phút..."
  npm install
fi
echo "Đang bật game Đám Cưới Mèo... Đóng cửa sổ này là tắt game."
echo "Game dùng cổng riêng 3020 (cổng bận thì tự đổi sang 3021, 3022...)."
export LIVE_MODE=1
npm run dev
