// Kiểm tra engine "Đi Vòng Quanh Thế Giới" — chạy: npm run check
// Chốt luật: FIFO theo lượt gợi ý; điểm chỉ cộng khi ĐẾN NƠI (10 + 1/500km);
// quà KHÔNG đổi thứ tự hàng chờ, không cho điểm; tim chỉ tạo gió thuận khi đang bay;
// phòng vắng → MC tự gợi ý; khoảng cách haversine đúng số đã biết.
import { TravelRoom, haversineKm } from './travel';
import { HOME, type PlaceData } from './config';

let fails = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) { fails++; console.error('FAIL:', msg); } else console.log('ok:', msg); };

const PARIS: PlaceData = { name: 'Paris', city: 'Paris', country: 'Pháp', cc: 'FR', lat: 48.8566, lng: 2.3522, fact: 'fact', image: '' };
const TOKYO: PlaceData = { name: 'Tokyo', city: 'Tokyo', country: 'Nhật Bản', cc: 'JP', lat: 35.6762, lng: 139.6503, fact: 'fact', image: '' };
const DANANG: PlaceData = { name: 'Đà Nẵng', city: 'Đà Nẵng', country: 'Việt Nam', cc: 'VN', lat: 16.0544, lng: 108.2022, fact: '', image: '' };

// haversine: SGN→Paris ≈ 10.120 km (khoảng cách đường chim bay thực tế)
const kmSP = haversineKm(HOME, PARIS);
ok(kmSP > 10000 && kmSP < 10250, `haversine SGN→Paris ≈ 10.120km (được ${Math.round(kmSP)})`);

// --- chuyến bay đầy đủ: gợi ý → bay → đến nơi → điểm + nhật ký ---
{
  let seed = 42; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const room = new TravelRoom(1_000_000, rnd);
  room.newSession(1_000_000);
  const lines = room.requestTrip({ username: 'u1', name: 'An' }, PARIS, 1_001_000);
  ok(lines.some((l) => !l.main), 'gợi ý Paris → câu xếp hàng');
  let t = 1_001_000; let v = room.view(t);
  ok(v.queue.length === 1 && v.phase === 'idle', 'Paris nằm trong hàng chờ');
  room.tick(t + 100);
  v = room.view(t + 100);
  ok(v.phase === 'flying' && v.travel?.to.name === 'Paris', 'tick → cất cánh đi Paris');
  const arriveAt = t + 100 + (v.travel?.durMs ?? 0);
  room.tick(arriveAt - 10);
  ok(room.view(arriveAt - 10).phase === 'flying', 'chưa tới giờ thì vẫn đang bay');
  const arriveLines = room.tick(arriveAt + 10);
  v = room.view(arriveAt + 10);
  ok(v.phase === 'arrived' && v.current.name === 'Paris', 'đến nơi: đang ở Paris');
  ok(arriveLines.some((l) => l.main && l.text.includes('Paris')), 'MC đọc câu đến nơi (câu chính)');
  const expectPts = 10 + Math.floor(Math.round(kmSP) / 500);
  ok(v.top.find((x) => x.key === 'u1')?.points === expectPts, `điểm = 10 + km/500 = ${expectPts} (được ${v.top[0]?.points})`);
  ok(v.log.length === 1 && v.log[0].name === 'Paris' && v.totalTrips === 1 && v.countries === 1, 'nhật ký + tổng số cập nhật');
  ok(v.totalKm === Math.round(kmSP), 'tổng km đúng');
  // hết thời gian dừng → idle
  room.tick(arriveAt + 10 + 16_000 + 100);
  ok(room.view(arriveAt + 10 + 16_000 + 100).phase === 'idle', 'hết giờ dừng → về idle');
}

// --- FIFO + quà KHÔNG đổi thứ tự, không cho điểm ---
{
  const room = new TravelRoom(2_000_000, () => 0.1);
  room.newSession(2_000_000);
  room.requestTrip({ username: 'a', name: 'A' }, TOKYO, 2_001_000);
  room.requestTrip({ username: 'b', name: 'B' }, DANANG, 2_002_000);
  room.gift({ username: 'b', name: 'B' }, 500, 2_003_000); // B tặng quà to
  const v = room.view(2_003_500);
  ok(v.queue[0]?.name === 'Tokyo' && v.queue[1]?.name === 'Đà Nẵng', 'quà 500 xu KHÔNG đổi thứ tự: Tokyo vẫn trước');
  ok(v.top.find((x) => x.key === 'b')?.points === 0, 'quà không cho điểm');
  ok(v.supporters[0]?.name === 'B' && v.supporters[0]?.hearts === 500, 'quà chỉ vào bảng ủng hộ (vinh danh)');
  room.tick(2_004_000);
  ok(room.view(2_004_000).travel?.to.name === 'Tokyo', 'bay chuyến Tokyo của A trước');
}

// --- gió thuận: 100 tim khi đang bay cắt thời gian; không bay thì không tác dụng ---
{
  const room = new TravelRoom(3_000_000, () => 0.2);
  room.newSession(3_000_000);
  room.like(500, 3_000_500); // tim lúc chưa bay: chỉ tích lũy
  room.requestTrip({ username: 'u', name: 'U' }, TOKYO, 3_001_000);
  room.tick(3_001_100);
  const v0 = room.view(3_001_100);
  const dur0 = v0.travel?.durMs ?? 0;
  room.like(100, 3_002_000); // thêm 100 tim trong lúc bay → vượt mốc mới
  room.tick(3_002_100);
  const v1 = room.view(3_002_100);
  ok((v1.travel?.durMs ?? Infinity) < dur0, `gió thuận cắt thời gian bay (${dur0} → ${v1.travel?.durMs})`);
  ok(v1.likes === 600, 'tổng tim tích lũy đúng');
}

// --- phòng vắng: MC tự gợi ý chuyến ---
{
  const room = new TravelRoom(4_000_000, () => 0.3);
  room.newSession(4_000_000);
  const lines = room.tick(4_000_000 + 80_001);
  ok(lines.some((l) => l.main && l.text.includes('tự gợi ý')), 'quá 80 giây vắng → MC báo chuyến tự gợi ý');
  room.tick(4_000_000 + 80_200);
  const v = room.view(4_000_000 + 80_200);
  ok(v.phase === 'flying' && v.travel?.byName === 'MC gợi ý', 'MC tự bay tới địa điểm nổi tiếng');
}

// --- cooldown + trùng nơi đang ở + hàng chờ đầy ---
{
  const room = new TravelRoom(5_000_000, () => 0.4);
  room.newSession(5_000_000);
  room.requestTrip({ username: 'u', name: 'U' }, PARIS, 5_001_000);
  const again = room.requestTrip({ username: 'u', name: 'U' }, TOKYO, 5_002_000);
  ok(again.some((l) => l.text.includes('chờ mình một chút')), 'gợi ý liên tục → dính cooldown 15 giây');
  ok(room.view(5_002_000).queue.length === 1, 'cooldown không thêm vào hàng chờ');
  const same = room.requestTrip({ username: 'v', name: 'V' }, { ...HOME }, 5_030_000);
  ok(same.some((l) => l.text.includes('đang ở')), 'gợi ý đúng nơi đang đứng → MC nhắc chọn nơi khác');
}

if (fails > 0) { console.error(`\n${fails} FAIL`); process.exit(1); }
console.log('\nALL PASS');
