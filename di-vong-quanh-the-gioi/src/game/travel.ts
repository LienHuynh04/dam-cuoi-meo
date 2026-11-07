// =====================================================
//  ENGINE "ĐI VÒNG QUANH THẾ GIỚI" — thuần logic, test được.
//  Trạng thái: idle (đang ở một nơi) → flying (đang bay) → arrived (đọc thông tin) → idle...
//  Người xem gợi ý địa điểm (đã tra tọa độ thật ở hook) → hàng chờ FIFO → bay lần lượt.
//  Điểm: người gợi ý nhận điểm khi ĐẾN NƠI: 10 + 1 điểm/500km.
//  Tim: đủ mốc 100 khi đang bay → gió thuận (cắt thời gian bay) — hiệu ứng CHUNG cả phòng.
//  Quà: CHỈ vinh danh ở bảng ủng hộ, KHÔNG đổi thứ tự/không điểm (luật kênh).
//  Phòng vắng quá lâu: MC tự gợi ý một địa điểm nổi tiếng và bay (giữ sân khấu luôn sống).
//  Đồng hồ hiệu dụng (eff): hook gọi hold(ms) trong lúc MC đọc câu chính → giờ game đứng lại.
// =====================================================

import { GAME, FAMOUS, HOME, type PlaceData } from './config';

export interface Say { text: string; main: boolean; priority?: boolean }
export interface Person { username: string; name: string }

export interface Traveler { key: string; name: string; points: number; trips: number }
export interface LogEntry extends PlaceData { by: string; at: number; km: number }
export interface QueueItem { place: PlaceData; by: string; byName: string }

export interface TravelView {
  at: number;
  phase: 'idle' | 'flying' | 'arrived';
  current: PlaceData;
  queue: { name: string; country: string; byName: string }[];
  travel: null | {
    from: PlaceData; to: PlaceData; byName: string;
    startAt: number; durMs: number; km: number; progress: number;
  };
  lastArrival: null | { place: PlaceData; byName: string; points: number; km: number; at: number };
  log: LogEntry[];
  top: Traveler[];
  totalKm: number;
  totalTrips: number;
  countries: number;
  likes: number;
  likesToTailwind: number;
  confettiAt: number;
  heartsAt: number;
  announce: { title: string; sub: string; until: number } | null;
  supporters: { name: string; hearts: number }[];
}

export const EMPTY_VIEW: TravelView = {
  at: 0, phase: 'idle', current: HOME, queue: [], travel: null, lastArrival: null,
  log: [], top: [], totalKm: 0, totalTrips: 0, countries: 0, likes: 0, likesToTailwind: 0,
  confettiAt: 0, heartsAt: 0, announce: null, supporters: [],
};

const EARTH_R = 6371;
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(s));
}

function pick<T>(arr: readonly T[], rnd: () => number): T { return arr[Math.floor(rnd() * arr.length) % arr.length]; }

export class TravelRoom {
  musicOn = true;
  musicVolume = 0.35;
  private sayBuf: Say[] = [];
  private phase: 'idle' | 'flying' | 'arrived' = 'idle';
  private current: PlaceData = HOME;
  private queue: QueueItem[] = [];
  private travellers = new Map<string, Traveler>();
  private supportersMap = new Map<string, { name: string; hearts: number }>();
  private log: LogEntry[] = [];
  private totalKm = 0;
  private totalTrips = 0;
  private likes = 0;
  private likesMark = 0;
  private flight: { from: PlaceData; to: PlaceData; by: string; byName: string; startEff: number; arriveEff: number; km: number } | null = null;
  private arrivedUntil = 0;
  private lastArrival: TravelView['lastArrival'] = null;
  private confettiAt = 0;
  private heartsAt = 0;
  private heartsMark = 0;
  private lastActiveEff = 0;
  private lastRequestAt = new Map<string, number>();
  private announce: TravelView['announce'] = null;
  private autoIdx = 0;
  private holdTotal = 0;

  constructor(startNow: number, private rnd: () => number = Math.random) {
    this.lastActiveEff = startNow;
  }

  hold(ms: number) { if (ms > 0) this.holdTotal += ms; }
  private eff(now: number) { return now - this.holdTotal; }
  private emit(text: string, main = false, priority = false) { this.sayBuf.push({ text, main, priority }); }
  private take(): Say[] { return this.sayBuf.splice(0); }

  private trav(key: string, name: string): Traveler {
    let t = this.travellers.get(key);
    if (!t) { t = { key, name, points: 0, trips: 0 }; this.travellers.set(key, t); }
    t.name = name;
    return t;
  }

  newSession(now: number): Say[] {
    this.phase = 'idle'; this.current = HOME; this.queue = []; this.flight = null;
    this.travellers.clear(); this.supportersMap.clear(); this.log = [];
    this.totalKm = 0; this.totalTrips = 0; this.likes = 0; this.likesMark = 0;
    this.lastArrival = null; this.lastActiveEff = this.eff(now);
    this.emit(pick(GAME.welcome, this.rnd), true);
    return this.take();
  }

  // ---------- sự kiện từ người xem ----------
  requestTrip(p: Person, place: PlaceData, now: number): Say[] {
    const eff = this.eff(now);
    const last = this.lastRequestAt.get(p.username) ?? -Infinity;
    if (eff - last < GAME.requestCooldownMs) { this.emit(GAME.tooSoon(p.name)); return this.take(); }
    const samePlace = (x: PlaceData) => Math.abs(x.lat - place.lat) < 0.01 && Math.abs(x.lng - place.lng) < 0.01;
    if (samePlace(this.current) && this.phase !== 'flying') { this.emit(GAME.alreadyThere(place.name)); return this.take(); }
    if (this.queue.length >= GAME.queueMax) { this.emit(GAME.queueFull); return this.take(); }
    this.lastRequestAt.set(p.username, eff);
    this.queue.push({ place, by: p.username, byName: p.name });
    this.trav(p.username, p.name);
    this.lastActiveEff = eff;
    this.emit(pick(GAME.queued, this.rnd)(p.name, place.name, this.queue.length));
    return this.take();
  }

  notFound(query: string): Say[] { this.emit(pick(GAME.notFound, this.rnd)(query)); return this.take(); }

  like(count: number, now: number): Say[] {
    this.likes += Math.max(1, count);
    const mark = Math.floor(this.likes / 25);
    if (mark > this.heartsMark) { this.heartsMark = mark; this.heartsAt = this.eff(now); }
    return this.take();
  }

  gift(p: Person, coins: number, _now: number): Say[] {
    const s = this.supportersMap.get(p.username) ?? { name: p.name, hearts: 0 };
    s.name = p.name; s.hearts += coins;
    this.supportersMap.set(p.username, s);
    this.emit(pick(GAME.giftThanks, this.rnd)(p.name), false, true);
    return this.take();
  }

  follow(p: Person): Say[] { this.emit(GAME.thankFollow(p.name)); return this.take(); }
  greet(p: Person): Say[] { this.emit(`F: Chào ${p.name} vừa vào phòng! | Bình luận tên một địa điểm là mình bay tới đó liền nha.`); return this.take(); }
  share(p: Person): Say[] { this.emit(`F: Cảm ơn ${p.name} đã chia sẻ live!`); return this.take(); }

  chatterWindow(_now: number): boolean { return this.phase !== 'flying'; }

  // ---------- vòng đời ----------
  tick(now: number): Say[] {
    const eff = this.eff(now);

    if (this.phase === 'flying' && this.flight) {
      const marks = Math.floor(this.likes / GAME.likesPerTailwind);
      if (marks > this.likesMark) {
        this.likesMark = marks;
        if (this.flight.arriveEff - eff > 2_500) {
          this.flight.arriveEff -= GAME.tailwindCutMs;
          this.emit(pick(GAME.tailwind, this.rnd), true);
        }
      }
      if (eff >= this.flight.arriveEff) this.arrive(eff);
    } else if (this.phase === 'arrived') {
      if (eff >= this.arrivedUntil) { this.phase = 'idle'; this.lastActiveEff = eff; }
    }

    if (this.phase === 'idle') {
      const next = this.queue.shift();
      if (next) this.depart(next, eff);
      else if (eff - this.lastActiveEff > GAME.autoTripAfterMs) {
        const place = FAMOUS[this.autoIdx % FAMOUS.length];
        this.autoIdx++;
        this.lastActiveEff = eff;
        if (Math.abs(place.lat - this.current.lat) > 0.01 || Math.abs(place.lng - this.current.lng) > 0.01) {
          this.announce = { title: `Sắp bay tới ${place.name}`, sub: 'Chuyến gợi ý của MC — phòng đang vắng', until: eff + 10_000 };
          this.emit(GAME.autoTease(place.name), true);
          this.queue.push({ place, by: '__mc__', byName: 'MC gợi ý' });
        }
      }
    }
    return this.take();
  }

  private depart(item: QueueItem, eff: number) {
    const km = Math.round(haversineKm(this.current, item.place));
    const durMs = Math.min(GAME.flyMaxMs, Math.max(GAME.flyMinMs, km * GAME.flyMsPerKm));
    this.flight = { from: this.current, to: item.place, by: item.by, byName: item.byName, startEff: eff, arriveEff: eff + durMs, km };
    this.phase = 'flying';
    this.likesMark = Math.floor(this.likes / GAME.likesPerTailwind);
    this.emit(pick(GAME.depart, this.rnd)(item.byName, `${item.place.name}, ${item.place.country}`, km), true);
  }

  private arrive(eff: number) {
    const f = this.flight!;
    this.flight = null;
    this.current = f.to;
    this.phase = 'arrived';
    this.arrivedUntil = eff + GAME.arrivedMs;
    this.totalKm += f.km;
    this.totalTrips++;
    const pts = f.by === '__mc__' ? 0 : GAME.pointsBase + Math.floor(f.km / 500) * GAME.pointsPer500Km;
    if (f.by !== '__mc__') { const t = this.trav(f.by, f.byName); t.points += pts; t.trips++; }
    this.lastArrival = { place: f.to, byName: f.byName, points: pts, km: f.km, at: eff };
    this.log.unshift({ ...f.to, by: f.byName, at: eff, km: f.km });
    if (this.log.length > 12) this.log.length = 12;
    this.confettiAt = eff;
    this.emit(pick(GAME.arrived, this.rnd)(f.to.name, f.to.country), true);
    if (f.to.fact) this.emit(`${pick(GAME.factIntro, this.rnd)} | ${f.to.fact}`, true);
    if (pts > 0) this.emit(GAME.pointsLine(f.byName, pts));
  }

  view(now: number): TravelView {
    const eff = this.eff(now);
    let travel: TravelView['travel'] = null;
    if (this.phase === 'flying' && this.flight) {
      const dur = this.flight.arriveEff - this.flight.startEff;
      travel = {
        from: this.flight.from, to: this.flight.to, byName: this.flight.byName,
        startAt: this.flight.startEff, durMs: dur, km: this.flight.km,
        progress: Math.max(0, Math.min(1, (eff - this.flight.startEff) / dur)),
      };
    }
    return {
      at: eff,
      phase: this.phase,
      current: this.current,
      queue: this.queue.map((q) => ({ name: q.place.name, country: q.place.country, byName: q.byName })),
      travel,
      lastArrival: this.lastArrival,
      log: this.log.slice(0, 6),
      top: [...this.travellers.values()].sort((a, b) => b.points - a.points).slice(0, 8),
      totalKm: this.totalKm,
      totalTrips: this.totalTrips,
      countries: new Set(this.log.map((l) => l.cc)).size,
      likes: this.likes,
      likesToTailwind: this.phase === 'flying' ? GAME.likesPerTailwind - (this.likes % GAME.likesPerTailwind) : 0,
      confettiAt: this.confettiAt,
      heartsAt: this.heartsAt,
      announce: this.announce && this.announce.until > eff ? this.announce : null,
      supporters: [...this.supportersMap.values()].sort((a, b) => b.hearts - a.hearts).slice(0, 5),
    };
  }
}
