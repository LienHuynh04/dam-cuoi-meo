#!/bin/bash
# Đua Xe Kart Live - chay tren macOS (ban Mac cua BAT-LIVE.bat)
# Cach dung: mo Terminal tai thu muc nay roi go:  bash run.sh
cd "$(dirname "$0")" || exit 1

if [ ! -d node_modules ]; then
  echo "Lan dau chay: dang cai thu vien, doi 1-2 phut..."
  npm install || { echo "Loi cai thu vien. Kiem tra Node.js: node -v"; exit 1; }
fi

# Che do live: trang stage khong tu tai lai khi sua code
export LIVE_MODE=1
# Cong rieng cua Đua Xe Kart Live (Lop Hoc 3007, Phong Tarot 3008, Tinh Toan IQ 3009, Bug Nghe Loi 3010, Yoga 3011, Ho Ca 3012, Oan Tu Xi 3013, Dai Chien Boss 3014, Dua Thu 3015, Dau Truong 3016, Meo Thu Vuon 3017, Nien Thu 3018)
export PORT=3023

echo "Dang bat Đua Xe Kart Live... Dong cua so Terminal nay la tat."
echo "Link cho TikTok LIVE Studio: http://lvh.me:3019/?view=stage  (1080 x 1920)"

( sleep 8; open "http://localhost:3019" ) &

# Treo live ca ngay: server bi tat thi tu bat lai sau 5 giay
while true; do
  npm run dev
  echo ""
  echo "[$(date '+%H:%M:%S')] Server bi tat, tu bat lai sau 5 giay... (dong Terminal de tat han)"
  sleep 5
done
