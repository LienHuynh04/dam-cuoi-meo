// =====================================================
//  CẤU HÌNH "ĐI VÒNG QUANH THẾ GIỚI" — game du lịch LIVE.
//  Người xem bình luận TÊN ĐỊA ĐIỂM (Paris, Đà Nẵng, Tháp Eiffel...) →
//  hệ thống tra tọa độ THẬT (OpenStreetMap), quả địa cầu 3D xoay tới nơi,
//  máy bay bay theo đường cong, đến nơi đọc thông tin + ảnh (Wikipedia).
//  Câu đọc: "F:" giọng nữ (nữ du khách kiêm MC). "|" tách đoạn, "^" hô to hơn.
//  LUẬT: quà CHỈ vinh danh (bảng ủng hộ + cảm ơn), KHÔNG đổi thứ tự hàng chờ,
//  không mua điểm/tốc độ. Tim chỉ tạo GIÓ THUẬN chung khi đang bay.
// =====================================================

export interface PlaceData {
  name: string;        // tên hiển thị của địa điểm
  city: string;
  country: string;
  cc: string;          // mã quốc gia ISO 2 ký tự (để lấy cờ)
  lat: number;
  lng: number;
  fact: string;        // mô tả/sự thật thú vị (Wikipedia hoặc viết sẵn)
  image: string;       // URL ảnh đại diện (Wikipedia), '' nếu không có
}

export const HOME: PlaceData = {
  name: 'TP. Hồ Chí Minh', city: 'TP. Hồ Chí Minh', country: 'Việt Nam', cc: 'VN',
  lat: 10.8231, lng: 106.6297,
  fact: 'Điểm xuất phát của mọi chuyến bay trong phòng live này.', image: '',
};

// Địa điểm nổi tiếng viết sẵn: gợi ý trên sân khấu + MC tự bay khi phòng vắng.
export const FAMOUS: PlaceData[] = [
  { name: 'Paris', city: 'Paris', country: 'Pháp', cc: 'FR', lat: 48.8566, lng: 2.3522, fact: 'Tháp Eiffel cao 330 mét, hoàn thành năm 1889 cho Hội chợ Thế giới, từng bị nhiều người Paris chê là xấu.', image: '' },
  { name: 'Tokyo', city: 'Tokyo', country: 'Nhật Bản', cc: 'JP', lat: 35.6762, lng: 139.6503, fact: 'Ngã tư Shibuya ở Tokyo là ngã tư đông người qua lại nhất thế giới, giờ cao điểm có thể tới 3.000 người cùng lúc.', image: '' },
  { name: 'New York', city: 'New York', country: 'Hoa Kỳ', cc: 'US', lat: 40.7128, lng: -74.006, fact: 'Tượng Nữ thần Tự do là món quà nước Pháp tặng Hoa Kỳ năm 1886, được đóng thành hàng trăm mảnh chở tàu sang.', image: '' },
  { name: 'London', city: 'London', country: 'Anh', cc: 'GB', lat: 51.5074, lng: -0.1278, fact: 'Big Ben thực ra là tên của quả chuông lớn bên trong tháp, cả ngọn tháp tên chính thức là Tháp Elizabeth.', image: '' },
  { name: 'Sydney', city: 'Sydney', country: 'Úc', cc: 'AU', lat: -33.8688, lng: 151.2093, fact: 'Nhà hát Opera Sydney có mái hình vỏ sò nổi tiếng, mất tới 14 năm xây dựng và đội vốn hơn 14 lần.', image: '' },
  { name: 'Kim tự tháp Giza', city: 'Giza', country: 'Ai Cập', cc: 'EG', lat: 29.9792, lng: 31.1342, fact: 'Kim tự tháp Khufu gần 4.500 năm tuổi, là công trình cao nhất thế giới suốt hơn 3.800 năm.', image: '' },
  { name: 'Rio de Janeiro', city: 'Rio de Janeiro', country: 'Brazil', cc: 'BR', lat: -22.9068, lng: -43.1729, fact: 'Tượng Chúa Cứu Thế trên đỉnh núi Corcovado cao 30 mét, giang tay ôm cả thành phố Rio bên dưới.', image: '' },
  { name: 'Vạn Lý Trường Thành', city: 'Bắc Kinh', country: 'Trung Quốc', cc: 'CN', lat: 40.4319, lng: 116.5704, fact: 'Tổng chiều dài mọi đoạn trường thành cộng lại hơn 21.000 km, xây qua nhiều triều đại suốt 2.000 năm.', image: '' },
  { name: 'Rome', city: 'Rome', country: 'Ý', cc: 'IT', lat: 41.9028, lng: 12.4964, fact: 'Đấu trường La Mã Colosseum gần 2.000 năm tuổi, từng chứa được khoảng 50.000 khán giả.', image: '' },
  { name: 'Seoul', city: 'Seoul', country: 'Hàn Quốc', cc: 'KR', lat: 37.5665, lng: 126.978, fact: 'Seoul có hệ thống tàu điện ngầm được dân tình chấm điểm thuộc hàng tiện nhất thế giới, phủ kín cả thành phố.', image: '' },
  { name: 'Bangkok', city: 'Bangkok', country: 'Thái Lan', cc: 'TH', lat: 13.7563, lng: 100.5018, fact: 'Tên nghi lễ đầy đủ của Bangkok dài tới 168 ký tự, được sách kỷ lục công nhận là tên địa danh dài nhất thế giới.', image: '' },
  { name: 'Dubai', city: 'Dubai', country: 'UAE', cc: 'AE', lat: 25.2048, lng: 55.2708, fact: 'Tháp Burj Khalifa cao 828 mét với 163 tầng, là tòa nhà cao nhất thế giới hiện nay.', image: '' },
  { name: 'Đà Nẵng', city: 'Đà Nẵng', country: 'Việt Nam', cc: 'VN', lat: 16.0544, lng: 108.2022, fact: 'Cầu Rồng ở Đà Nẵng phun lửa và phun nước vào cuối tuần, là điểm hẹn quen thuộc mỗi tối thứ bảy.', image: '' },
  { name: 'Vịnh Hạ Long', city: 'Quảng Ninh', country: 'Việt Nam', cc: 'VN', lat: 20.9101, lng: 107.1839, fact: 'Vịnh Hạ Long có gần 2.000 đảo đá vôi lớn nhỏ, hai lần được UNESCO công nhận là di sản thiên nhiên thế giới.', image: '' },
  { name: 'Hà Nội', city: 'Hà Nội', country: 'Việt Nam', cc: 'VN', lat: 21.0278, lng: 105.8342, fact: 'Phố cổ Hà Nội nổi tiếng với 36 phố phường, mỗi phố xưa kia chuyên bán một mặt hàng riêng.', image: '' },
  { name: 'Santorini', city: 'Santorini', country: 'Hy Lạp', cc: 'GR', lat: 36.3932, lng: 25.4615, fact: 'Đảo Santorini là miệng một ngọn núi lửa cổ đã sụp xuống biển, nên có những ngôi nhà trắng cheo leo trên vách đá.', image: '' },
];

export const GAME = {
  title: 'Đi Vòng Quanh Thế Giới',
  defaultChannelName: 'Du khách',

  queueMax: 6,             // hàng chờ chuyến bay tối đa
  requestCooldownMs: 15_000, // mỗi người 15 giây mới gợi ý tiếp được
  arrivedMs: 16_000,       // dừng ở điểm đến bao lâu (đọc thông tin) rồi bay tiếp
  autoTripAfterMs: 80_000, // phòng vắng (không hàng chờ, không bay) quá lâu → MC tự gợi ý bay
  likesPerTailwind: 100,   // đủ 100 tim khi đang bay → gió thuận, bay nhanh hơn
  tailwindCutMs: 1_800,    // gió thuận cắt bớt thời gian bay
  pointsBase: 10,          // điểm cho người gợi ý khi đến nơi
  pointsPer500Km: 1,       // +1 điểm mỗi 500 km bay

  flyMinMs: 6_000,
  flyMaxMs: 16_000,
  flyMsPerKm: 1.1,         // thời gian bay theo khoảng cách

  giftThanksCooldownMs: 30_000, // cảm ơn quà: cùng 1 người tối thiểu 30 giây mới cảm ơn lại
  bigGiftCoins: 99,             // quà từ 99 xu: cảm ơn ngay, không chờ cooldown
  giftLineMaxWaitMs: 45_000,    // câu cảm ơn quà chờ tối đa 45 giây rồi bỏ
  chatterMaxWaitMs: 20_000,     // câu phụ (chào/cảm ơn follow) chờ tối đa 20 giây rồi bỏ

  welcome: [
    `F: Xin chào cả nhà! | Mình là hướng dẫn viên của chuyến đi vòng quanh thế giới hôm nay. | Cả nhà muốn đi đâu, cứ bình luận tên địa điểm, mình bay tới liền nha!`,
    `F: Chào mừng cả nhà đến với chuyến bay vòng quanh thế giới! | Gõ tên một nơi bạn muốn tới, ví dụ Paris, Tokyo hay Đà Nẵng, là mình khởi hành ngay.`,
  ],
  depart: [
    (by: string, to: string, km: number) => `F: Cất cánh thôi cả nhà ơi! | Chuyến bay do ${by} gợi ý, mình đang bay tới ${to}, quãng đường khoảng ${km} ki lô mét.`,
    (by: string, to: string, km: number) => `F: Máy bay lăn bánh rồi! | Điểm đến là ${to} theo gợi ý của ${by}, cách mình khoảng ${km} ki lô mét.`,
    (by: string, to: string, km: number) => `F: Mình bay tới ${to} đây cả nhà! | Cảm ơn ${by} đã gợi ý điểm đến này, hành trình dài khoảng ${km} ki lô mét.`,
  ],
  arrived: [
    (name: string, country: string) => `F: Đã tới nơi rồi cả nhà ơi! | Chào mừng đến với ${name}, ${country}!`,
    (name: string, country: string) => `F: Hạ cánh an toàn! | Mình đang ở ${name}, thuộc ${country}.`,
    (name: string, country: string) => `F: ^Tới rồi! | ${name}, ${country} xin chào cả nhà!`,
  ],
  factIntro: [
    `F: Nghe mình giới thiệu một chút về nơi này nha.`,
    `F: Một điều thú vị về nơi này nè cả nhà.`,
    `F: Để mình kể cả nhà nghe về điểm đến này.`,
  ],
  pointsLine: (by: string, pts: number) => `F: ${by} nhận được ${pts} điểm hành trình cho gợi ý này.`,
  queued: [
    (by: string, name: string, pos: number) => `F: Đã ghi ${name} vào hành trình của ${by}! | Mình xếp thứ ${pos} trong hàng chờ nha.`,
    (by: string, name: string, pos: number) => `F: Có điểm đến mới rồi: ${name}, gợi ý của ${by}. | Chuyến này xếp thứ ${pos}.`,
  ],
  queueFull: `F: Hàng chờ đang đầy rồi cả nhà ơi. | Chờ mình bay xong vài chuyến rồi gợi ý tiếp nha.`,
  alreadyThere: (name: string) => `F: Mình đang ở ${name} rồi nè! | Cả nhà chọn một nơi khác xa hơn đi.`,
  notFound: [
    (q: string) => `F: Mình chưa tìm thấy địa điểm ${q} trên bản đồ. | Cả nhà thử gõ tên thành phố hoặc địa danh nổi tiếng khác nha.`,
    (q: string) => `F: Chỗ ${q} nghe lạ quá, bản đồ chưa có. | Thử một địa điểm cụ thể hơn giùm mình nha.`,
  ],
  tooSoon: (by: string) => `F: ${by} chờ mình một chút rồi gợi ý tiếp nha.`,
  tailwind: [
    `F: Gió thuận rồi cả nhà ơi! | Nhờ trăm tim của mọi người, máy bay bay nhanh hơn hẳn.`,
    `F: Cảm ơn cả nhà đã tiếp gió! | Chuyến bay được rút ngắn rồi đó.`,
  ],
  autoTease: (name: string) => `F: Phòng đang vắng, mình tự gợi ý một chuyến nha. | Mười giây nữa mình bay tới ${name}, ai muốn đi cùng thì ở lại xem nè!`,
  howTo: [
    `F: Cách chơi nè cả nhà: cứ bình luận tên một địa điểm, thành phố hoặc đất nước, là mình bay tới đó liền. | Đi càng xa, điểm càng nhiều!`,
    `F: Cả nhà muốn khám phá nơi nào thì bình luận tên nơi đó nha. | Ví dụ tháp Eiffel, New York, hay Vịnh Hạ Long đều được.`,
    `F: Mỗi chuyến bay tới nơi là người gợi ý được cộng điểm hành trình. | Ai nhiều điểm nhất sẽ đứng đầu bảng nhà thám hiểm đó.`,
    `F: Đang bay mà cả nhà thả đủ một trăm tim là có gió thuận, máy bay bay nhanh hơn đó.`,
  ],
  giftThanks: [
    (n: string) => `F: Cảm ơn ${n} đã tặng quà cho chuyến đi! | Quà của bạn được vinh danh ở bảng ủng hộ bên phải nha.`,
    (n: string) => `F: ${n} vừa tặng quà nè cả nhà! | Cảm ơn bạn đã đồng hành cùng chuyến bay vòng quanh thế giới.`,
  ],
  thankFollow: (n: string) => `F: Cảm ơn ${n} đã theo dõi kênh! | Từ nay mình cùng nhau đi vòng quanh thế giới nha.`,
};
