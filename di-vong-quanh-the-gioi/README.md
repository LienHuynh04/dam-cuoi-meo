# ✈️ ĐI VÒNG QUANH THẾ GIỚI — Game du lịch tương tác cho TikTok LIVE

Người xem **bình luận tên bất kỳ một địa điểm** (thành phố, quốc gia, địa danh nổi tiếng)
→ hệ thống tra **tọa độ địa lý thật** trên OpenStreetMap, quả địa cầu 3D **xoay tới đúng
vị trí đó**, máy bay bay theo đường cong qua bầu trời, hạ cánh thì hiện **ảnh + cờ + tọa độ
+ thông tin thú vị** của điểm đến (Wikipedia) và MC đọc cho cả phòng nghe.

Game nằm trong repo `dam-cuoi-meo`, thư mục `di-vong-quanh-the-gioi/`, mượn hiệu ứng sân
khấu của Đám Cưới Mèo: ACES tone mapping, phủ hạt phim + tối góc, pháo giấy khi đến nơi,
MC tự dẫn chương trình khi phòng vắng.

## Cách chơi

- **Bình luận tên địa điểm** là gợi ý một chuyến bay: `Paris`, `đi Tokyo`, `Đà Nẵng`,
  `Tháp Eiffel`, `bay tới New York`… Cụm ngắn ≤ 5 từ hoặc bắt đầu bằng đi/bay/đến/du lịch
  đều được nhận. Không tìm thấy trên bản đồ → MC nhắc thử tên khác, không mất gì.
- Hàng chờ **FIFO theo lượt gợi ý** (tối đa 6). Bay tới nơi, người gợi ý nhận
  **điểm hành trình = 10 + 1 điểm mỗi 500 km** — đi càng xa điểm càng cao.
- **Đang bay, phòng thả đủ 100 tim → GIÓ THUẬN**: máy bay bay nhanh hơn (hiệu ứng chung
  cả phòng, ai thả cũng như nhau).
- **Quà chỉ để vinh danh** ở bảng Ủng Hộ + MC cảm ơn. Quà **không** mua điểm, **không**
  đổi thứ tự bay — đúng luật kênh.
- Phòng vắng quá 80 giây, MC tự gợi ý một địa điểm nổi tiếng và bay để sân khấu luôn có
  chuyện (không tính điểm cho ai).
- Nhật ký hành trình giữ 12 điểm đến gần nhất; các điểm đã tới được đánh dấu chấm trắng
  ngay trên quả địa cầu. Điểm xuất phát: **TP. Hồ Chí Minh**.

## Sân khấu 3D

- Quả địa cầu kết cấu bản đồ Trái Đất thật (ảnh Blue Marble của NASA — public domain,
  tải lúc chạy từ CDN); mất mạng thì tự dùng kết cấu dự phòng vẽ bằng canvas.
- Địa danh mini bằng khối 3D đặt đúng tọa độ thật: tháp Eiffel, Tokyo Skytree, tượng Nữ
  thần Tự do, Kim tự tháp Giza.
- Cô gái du khách (vali, ba lô, máy ảnh) đứng trên mây: vẫy tay khi chờ, chỉ lên địa cầu
  khi đang bay, nhảy ăn mừng khi hạ cánh.
- Nhạc nền **tự sáng tác** bằng Web Audio (100 BPM, marimba ngũ cung), tự nhỏ xuống khi
  MC đọc. Giọng MC nữ (F:) qua Edge TTS.

## Dữ liệu thật, không cần API key

| Nhu cầu | Nguồn | Ghi chú |
|---|---|---|
| Tọa độ, quốc gia, gợi ý autocomplete | OpenStreetMap Nominatim | Miễn phí, có cache + gọi nối tiếp tôn trọng giới hạn |
| Ảnh + mô tả điểm đến | Wikipedia REST summary (vi → en) | Miễn phí |
| Quốc kỳ | Suy từ mã quốc gia ISO (emoji cờ) | Không cần API |
| Bản đồ địa cầu | NASA Blue Marble qua jsdelivr | Public domain |

*Vì sao không lấy ảnh từ Google?* Google không có API ảnh miễn phí cho mục đích này
(Custom Search API đã đóng với người dùng mới và có giới hạn rất nhỏ; tự cào Google
Images là trái điều khoản và hay bị chặn). Wikipedia cho ảnh đúng địa danh, miễn phí,
ổn định — đó là nguồn game đang dùng.

## Chạy game

```bash
bash run.sh        # cổng 3023
```

- Trang điều khiển: `http://localhost:3023/` — kết nối kênh, ô nhập địa điểm có
  autocomplete để chủ kênh tự khởi hành, nút chuyến bay mẫu, giả lập bình luận gợi ý.
- Trang sân khấu cho LIVE Studio: `http://lvh.me:3023/?view=stage` (1080×1920).
  **Nhớ bấm 1 lần vào sân khấu (Interact) lúc mới mở** để trình duyệt cho phát nhạc +
  giọng MC — đây là luật của trình duyệt, game nào cũng vậy.

## Kiểm tra

```bash
npm run check   # kiểm luật engine: FIFO, điểm khi đến nơi, quà không đổi lượt, gió thuận, MC tự bay
npm run lint    # tsc --noEmit
npm run build   # vite build
```
