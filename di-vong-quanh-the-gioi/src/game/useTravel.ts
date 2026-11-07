import { useEffect, useRef, useState } from 'react';
import { useLiveEvents } from '../live/useLiveEvents';
import type { GiftEvent, LiveStatus } from '../live/types';
import { voice, speakableName } from '../live/voice';
import { music } from '../live/music';
import { containsBanned } from '../live/bannedWords';
import { GiftThanker, OncePerPerson } from '../live/chatter';
import { IS_STAGE } from '../live/page';
import { GAME, FAMOUS, type PlaceData } from './config';
import { TravelRoom, type Say, type TravelView, type Person } from './travel';
import { geocode, enrich } from './geo';

// ?view=stage&mute=1: xem thử trang stage không phát tiếng
const MUTED = new URLSearchParams(window.location.search).get('mute') === '1';

export type StageView = TravelView;

const DEMO_NAMES = ['Minh Anh', 'Tuấn Anh', 'Ngọc Trâm', 'Hoàng Nam', 'Linh Chi', 'Quốc Bảo', 'Thảo Vy', 'Đức Huy'];

// Bình luận được coi là GỢI Ý ĐỊA ĐIỂM khi: bắt đầu bằng động từ đi lại (đi / bay tới /
// đến / du lịch / khám phá...) HOẶC là cụm ngắn ≤ 5 từ (tên nơi thường ngắn: "Paris",
// "Đà Nẵng", "tháp Eiffel"). Câu chat thường tra không ra địa danh thật thì bỏ qua lặng lẽ.
const TRAVEL_VERB = /^(đi|bay|tới|đến|du lịch|khám phá|thăm|ghé|qua)\s+/i;
export function asPlaceQuery(text: string): string | null {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t || t.length < 2 || t.length > 60) return null;
  if (/^(xin chào|hello|hi|ok|oke|hay|đẹp|quá|haha|kkk|❤|👍)/i.test(t)) return null;
  const m = t.match(TRAVEL_VERB);
  if (m) return t.slice(m[0].length).trim() || null;
  if (t.split(' ').length <= 5) return t;
  return null;
}

/**
 * Trang stage chạy engine du lịch thật (lõi ở travel.ts) và gửi ảnh chụp trạng thái lên server.
 * Trang điều khiển không tự chạy, chỉ vẽ lại ảnh chụp đó nên xem trước khớp với live.
 */
export function useTravel() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [view, setView] = useState<StageView | null>(null);
  const [lastGift, setLastGift] = useState<(GiftEvent & { at: number }) | null>(null);
  const [stageCount, setStageCount] = useState(0);
  const [channelName, setChannelName] = useState(GAME.defaultChannelName);

  const roomRef = useRef<TravelRoom | null>(null);
  const dirty = useRef(true);

  const [talk] = useState(() => ({
    gifts: new GiftThanker(GAME.giftThanksCooldownMs, GAME.bigGiftCoins),
    follows: new OncePerPerson(),
    greets: new OncePerPerson(),
  }));

  // Câu chính đọc ngay (đồng hồ game dừng trong lúc đọc). Câu phụ chờ cửa sổ rảnh.
  const mainSpeaking = useRef(0);
  const chatter = useRef<{ text: string; priority: boolean; until: number }[]>([]);
  function say(lines: Say[]) {
    const now = Date.now();
    for (const l of lines) {
      if (l.main) {
        mainSpeaking.current++;
        voice.say(l.text, true, () => mainSpeaking.current--);
      } else {
        const ttl = l.priority ? GAME.giftLineMaxWaitMs : GAME.chatterMaxWaitMs;
        chatter.current.push({ text: l.text, priority: !!l.priority, until: now + ttl });
      }
    }
    dirty.current = true;
  }
  function flushChatter(room: TravelRoom, now: number) {
    chatter.current = chatter.current.filter((c) => c.until > now);
    if (voice.busy || mainSpeaking.current > 0 || !room.chatterWindow(now)) return;
    const i = Math.max(0, chatter.current.findIndex((c) => c.priority));
    const next = chatter.current.splice(i, 1)[0];
    if (next) voice.say(next.text);
  }

  const person = (e: { nickname: string; username: string }): Person & { spoken: string } => {
    const nickname = containsBanned(e.nickname) ? e.username : e.nickname;
    return { username: e.username, name: nickname, spoken: speakableName(nickname) };
  };
  const asPerson = (p: Person & { spoken: string }): Person => ({ username: p.username, name: p.spoken });

  // ---------- gợi ý địa điểm: tra tọa độ THẬT rồi mới xếp hàng ----------
  const pendingLookup = useRef(new Set<string>());
  const requestPlace = (p: Person, query: string) => {
    const room = roomRef.current;
    if (!room) return;
    const key = `${p.username}:${query.toLowerCase()}`;
    if (pendingLookup.current.has(key)) return;
    pendingLookup.current.add(key);
    void geocode(query).then((place) => {
      pendingLookup.current.delete(key);
      if (!roomRef.current) return;
      if (!place) { say(room.notFound(query)); return; }
      void enrich(place).then((full) => { if (roomRef.current) say(room.requestTrip(p, full, Date.now())); });
    });
  };
  const requestKnownPlace = (p: Person, place: PlaceData) => {
    const room = roomRef.current;
    if (!room) return;
    void enrich(place).then((full) => { if (roomRef.current) say(room.requestTrip(p, full, Date.now())); });
  };

  useLiveEvents({
    onStatus: setStatus,
    onSpeaker: (d) => setStageCount(d.count),
    onGameState: (s) => {
      if (!IS_STAGE) setView(s as StageView);
    },
    onChat: (e) => {
      const room = roomRef.current;
      if (!room || containsBanned(e.comment)) return;
      const q = asPlaceQuery(e.comment);
      if (q) requestPlace(asPerson(person(e)), q);
    },
    onGift: (e) => {
      const room = roomRef.current;
      if (!room) return;
      const p = person(e);
      const coins = e.diamondCount * e.repeatCount;
      const lines = room.gift(asPerson(p), coins, Date.now()); // quà chỉ vinh danh, không đổi lượt bay
      setLastGift({ ...e, nickname: p.name, at: Date.now() });
      if (talk.gifts.shouldThank(e.username, coins, chatter.current.filter((c) => c.priority).length)) say(lines);
      dirty.current = true;
    },
    onFollow: (e) => {
      const room = roomRef.current;
      if (room && talk.follows.first(e.username)) say(room.follow(asPerson(person(e))));
    },
    onMember: (e) => {
      const room = roomRef.current;
      if (room && talk.greets.first(e.username)) say(room.greet(asPerson(person(e))));
    },
    onShare: (e) => {
      const room = roomRef.current;
      if (room) say(room.share(asPerson(person(e))));
    },
    onLike: (e) => {
      const room = roomRef.current;
      if (!room) return;
      say(room.like(e.likeCount || 1, Date.now()));
      dirty.current = true;
    },
    onControl: (c) => {
      if (c.action === 'setName' && c.text) setChannelName(c.text);
      const room = roomRef.current;
      if (!room) return;
      if (c.action === 'speak' && c.text) voice.say(`F: ${c.text}`, true);
      if (c.action === 'setRate' && c.text) voice.rate = Number(c.text) || 1;
      if (c.action === 'reset') {
        voice.stop();
        chatter.current = [];
        say(room.newSession(Date.now()));
      }
      if (c.action === 'custom' && c.text === 'demo_trip') {
        const place = FAMOUS[Math.floor(Math.random() * FAMOUS.length)];
        const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
        say(room.requestTrip({ username: `demo-${Date.now()}`, name }, place, Date.now()));
      }
      if (c.action === 'custom' && c.text?.startsWith('goto:')) {
        try {
          const place = JSON.parse(c.text.slice(5)) as PlaceData;
          requestKnownPlace({ username: '__host__', name: 'Chủ kênh' }, place);
        } catch { /* ignore */ }
      }
      if (c.action === 'custom' && c.text?.startsWith('query:')) {
        requestPlace({ username: '__host__', name: 'Chủ kênh' }, c.text.slice(6));
      }
      if (c.action === 'custom' && (c.text === 'music_on' || c.text === 'music_off')) {
        room.musicOn = c.text === 'music_on';
        music.setEnabled(room.musicOn);
        dirty.current = true;
      }
      if (c.action === 'custom' && c.text?.startsWith('music_vol:')) {
        const v = Number(c.text.slice('music_vol:'.length));
        if (Number.isFinite(v)) {
          room.musicVolume = Math.min(1, Math.max(0, v));
          music.setVolume(room.musicVolume);
          dirty.current = true;
        }
      }
    },
  });

  useEffect(() => {
    if (!IS_STAGE) return;
    if (MUTED) voice.volume = 0;
    let stop = false;
    const room = new TravelRoom(Date.now());
    roomRef.current = room;
    say(room.newSession(Date.now()));
    // Nhạc nền bật sẵn; 1 lần chạm/click đầu tiên trên stage mở khoá CẢ nhạc lẫn giọng đọc.
    music.setVolume(room.musicVolume);
    music.setEnabled(room.musicOn);
    const unlock = () => {
      music.resume();
      voice.kick();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('focus', unlock);
    document.addEventListener('visibilitychange', unlock);
    const watchdog = setInterval(unlock, 1500);
    let lastSent = 0;
    let lastTick = Date.now();
    const timer = setInterval(() => {
      if (stop) return;
      const now = Date.now();
      if (mainSpeaking.current > 0) {
        room.hold(now - lastTick);
        dirty.current = true;
      }
      lastTick = now;
      say(room.tick(now));
      flushChatter(room, now);
      music.setDucked(voice.busy); // MC đang đọc thì nhạc tự nhỏ xuống
      if (!dirty.current && now - lastSent < 1000) return;
      dirty.current = false;
      setView(room.view(now));
      if (now - lastSent >= 300) {
        lastSent = now;
        fetch('/api/game/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(room.view(now)) }).catch(() => {});
      }
    }, 100);
    return () => {
      stop = true;
      clearInterval(timer);
      clearInterval(watchdog);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('focus', unlock);
      document.removeEventListener('visibilitychange', unlock);
      music.setEnabled(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, view, lastGift, stageCount, channelName };
}

export type TravelState = ReturnType<typeof useTravel>;
