// Nhạc nền ĐÁM CƯỚI MÈO tự sáng tác bằng code (bản nâng cấp 2026-11-07): vòng hợp âm kiểu Canon
// (D–A–Bm–F#m–G–D–G–A, tiến trình cổ điển đã hết bản quyền từ lâu) + giai điệu GỐC viết riêng cho game.
// Lớp nhạc: dây đệm ấm (stereo), piano rải, bè trầm + bè cello, giai điệu hộp nhạc, chuông nhà thờ
// điểm ở đầu mỗi phần, glissando hạc cầm nối vòng lặp. Nghe thử ở trang điều khiển (nút nhạc nền).
// Dựng sẵn thành 1 file WAV trong trình duyệt (OfflineAudioContext) rồi phát bằng <audio>, giống cách phát giọng MC:
// trình duyệt trong LIVE Studio có thể chặn Web Audio phát trực tiếp nhưng vẫn cho <audio> phát.
// Không dùng file nhạc ngoài nên không dính bản quyền. Chỉ phát trên trang stage; MC nói thì nhạc nhỏ xuống.
import { IS_STAGE } from '../live/page';
import { voice } from '../live/voice';

const LOUD = 0.7; // lúc MC im
const DUCK = 0.28; // lúc MC đang nói
const LEVEL_KEY = 'meowed-music-level';
const BPM = 76;
const RATE = 32000;

// 16 ô nhịp Rê trưởng, mỗi ô 1 hợp âm (nốt MIDI): [bè trầm, 3 nốt hợp âm]
const CHORDS: Record<string, number[]> = {
  D: [38, 62, 66, 69],
  A: [45, 61, 64, 69],
  Bm: [47, 62, 66, 71],
  'F#m': [42, 61, 66, 69],
  G: [43, 62, 67, 71],
};
const PROG = ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A', 'D', 'A', 'Bm', 'F#m', 'G', 'D', 'A', 'D'];
// giai điệu chính GỐC: 4 phách mỗi ô, 0 = ngân tiếp nốt trước. Nửa đầu dịu, nửa sau vút cao rồi hạ về chủ âm.
const MELODY = [
  [74, 78, 81, 78],
  [76, 0, 73, 76],
  [74, 78, 83, 81],
  [81, 0, 78, 0],
  [79, 83, 81, 79],
  [78, 0, 74, 78],
  [79, 78, 76, 74],
  [76, 0, 0, 0],
  [74, 78, 81, 86],
  [85, 0, 81, 0],
  [83, 81, 78, 81],
  [78, 0, 76, 0],
  [79, 81, 83, 86],
  [83, 81, 78, 76],
  [74, 76, 78, 81],
  [74, 0, 0, 0],
];
const ARP = [0, 1, 2, 3, 2, 1, 2, 3]; // 8 móc đơn mỗi ô: rải hợp âm lên xuống

const freq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Dựng cả bài (16 ô nhịp stereo, lặp được) thành AudioBuffer */
export async function render(): Promise<AudioBuffer> {
  const beat = 60 / BPM;
  const bar = beat * 4;
  const len = bar * PROG.length;
  const ctx = new OfflineAudioContext(2, Math.ceil((len + 0.01) * RATE), RATE);
  const out = ctx.createGain();
  out.gain.value = 1;
  // vang nhẹ cho êm, kiểu sảnh tiệc
  const rev = ctx.createConvolver();
  rev.buffer = impulse(ctx, 2.2);
  const wet = ctx.createGain();
  wet.gain.value = 0.3;
  out.connect(ctx.destination);
  out.connect(rev);
  rev.connect(wet);
  wet.connect(ctx.destination);

  interface NoteOpts {
    pan?: number;
    attack?: number;
    partial?: number;
    cutoff?: number; // lowpass cho bè dây ấm
    detune?: number; // cents, cho bè dây dày
  }
  const note = (f: number, at: number, dur: number, vol: number, type: OscillatorType, opts: NoteOpts = {}) => {
    const { pan = 0, attack = 0.01, partial = 0, cutoff = 0, detune = 0 } = opts;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    if (detune) o.detune.value = detune;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, at + dur);
    let head: AudioNode = o;
    if (cutoff) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = cutoff;
      o.connect(lp);
      head = lp;
    }
    head.connect(g);
    if (pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      p.connect(out);
    } else g.connect(out);
    o.start(at);
    o.stop(at + dur + 0.05);
    if (partial) {
      // bồi âm cho tiếng chuông / hộp nhạc
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.frequency.value = f * partial;
      g2.gain.setValueAtTime(vol * 0.25, at);
      g2.gain.exponentialRampToValueAtTime(0.0008, at + dur * 0.4);
      o2.connect(g2);
      g2.connect(out);
      o2.start(at);
      o2.stop(at + dur);
    }
  };

  PROG.forEach((name, b) => {
    const t0 = b * bar;
    const ch = CHORDS[name];
    // bè trầm: chủ âm cả ô + nốt năm ở nửa sau
    note(freq(ch[0] + 12), t0, bar * 0.95, 0.2, 'sine', { attack: 0.02 });
    note(freq(ch[0] + 19), t0 + beat * 2, bar * 0.45, 0.07, 'sine', { attack: 0.02 });
    // bè dây ấm: 3 nốt hợp âm ngân cả ô, 2 lớp lệch tông nhẹ đặt 2 bên tai
    for (const n of [ch[1], ch[2], ch[3]]) {
      note(freq(n), t0, bar * 1.02, 0.032, 'triangle', { attack: 0.5, cutoff: 1300, pan: -0.35, detune: -5 });
      note(freq(n), t0, bar * 1.02, 0.032, 'triangle', { attack: 0.5, cutoff: 1300, pan: 0.35, detune: 5 });
    }
    // bè cello: chủ âm + nốt ba, nửa ô một nốt, trầm và mềm
    note(freq(ch[0] + 24), t0, beat * 1.9, 0.055, 'triangle', { attack: 0.12, cutoff: 900 });
    note(freq(ch[2]), t0 + beat * 2, beat * 1.9, 0.045, 'triangle', { attack: 0.12, cutoff: 900 });
    // piano rải hợp âm lên xuống
    ARP.forEach((k, i) => note(freq(ch[1 + (k % 3)] + (k === 3 ? 12 : 0)), t0 + (i * beat) / 2, beat * 1.6, 0.058, 'triangle', { pan: -0.12 }));
    // giai điệu hộp nhạc: ngân tới nốt kế tiếp
    const mel = MELODY[b];
    mel.forEach((m, i) => {
      if (!m) return;
      let hold = 1;
      while (i + hold < 4 && !mel[i + hold]) hold++;
      note(freq(m), t0 + i * beat, beat * hold + 0.35, 0.15, 'sine', { attack: 0.03, partial: 3.01 });
      note(freq(m), t0 + i * beat, beat * hold + 0.3, 0.05, 'triangle', { attack: 0.05 }); // lớp sáo mỏng đỡ dưới hộp nhạc
    });
    // chuông nhà thờ điểm đầu mỗi phần (ô 1 và ô 9): chủ âm + quãng tám, ngân dài
    if (b === 0 || b === 8) {
      note(freq(ch[0] + 24), t0, 3.6, 0.09, 'sine', { attack: 0.005, partial: 2.76, pan: 0.15 });
      note(freq(ch[0] + 36), t0, 3.2, 0.045, 'sine', { attack: 0.005, partial: 2.76, pan: 0.15 });
    }
    // chuông lấp lánh cuối mỗi câu 4 ô
    if (b % 4 === 3) note(freq(ch[3] + 24), t0 + beat * 3, 2.0, 0.03, 'sine', { attack: 0.005, partial: 2.76, pan: 0.2 });
    // glissando hạc cầm ở 2 phách cuối ô chót, dẫn vòng lặp về ô đầu
    if (b === PROG.length - 1) {
      [69, 74, 78, 81, 86].forEach((m, i) => note(freq(m), t0 + beat * 2 + i * beat * 0.4, beat * 1.2, 0.05, 'sine', { attack: 0.01, partial: 3.01, pan: -0.1 + i * 0.05 }));
    }
  });

  const buf = await ctx.startRendering();
  // nâng đỉnh lên 0,9 cho đủ to (tính trên cả 2 kênh)
  let peak = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  }
  if (peak > 0)
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] *= 0.9 / peak;
    }
  return buf;
}

/** Nhạc DJ 128 BPM: trống 4 phách, vỗ tay, hi-hat, bass nảy, hợp âm giật (8 ô nhịp lặp) */
export async function renderDJ(): Promise<AudioBuffer> {
  const bpm = 128;
  const beat = 60 / bpm;
  const bars = 8;
  const len = beat * 4 * bars;
  const ctx = new OfflineAudioContext(1, Math.ceil((len + 0.01) * RATE), RATE);
  const out = ctx.createGain();
  out.connect(ctx.destination);
  const noise = ctx.createBuffer(1, RATE, RATE);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const kick = (t: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + 0.32);
  };
  const hiss = (t: number, dur: number, vol: number, hp: number) => {
    const sNode = ctx.createBufferSource();
    sNode.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    sNode.connect(f);
    f.connect(g);
    g.connect(out);
    sNode.start(t);
    sNode.stop(t + dur + 0.02);
  };
  const synth = (f: number, t: number, dur: number, vol: number, cutoff: number) => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(lp);
    lp.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
  };
  // Am - F - C - G
  const roots = [57, 53, 48, 55];
  const triads = [[69, 72, 76], [69, 72, 77], [67, 72, 76], [67, 71, 74]];
  for (let b = 0; b < bars; b++) {
    const t0 = b * beat * 4;
    const ch = b % 4;
    for (let i = 0; i < 4; i++) {
      const t = t0 + i * beat;
      kick(t);
      hiss(t + beat / 2, 0.08, 0.25, 7000); // hi-hat giữa phách
      if (i % 2 === 1) hiss(t, 0.18, 0.45, 1200); // vỗ tay phách 2, 4
      synth(freq(roots[ch] - 12), t + beat / 2, beat * 0.45, 0.35, 600); // bass nảy
      if (i % 2 === 0 || b % 2 === 1) for (const n of triads[ch]) synth(freq(n), t + (i % 2 ? beat * 0.75 : 0), beat * 0.3, 0.07, 2600);
    }
    if (b === bars - 1) for (let k = 0; k < 8; k++) hiss(t0 + beat * 2 + (k * beat) / 4, 0.1, 0.15 + k * 0.04, 3000); // dồn trống cuối vòng
  }
  const buf = await ctx.startRendering();
  const d = buf.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  if (peak > 0) for (let i = 0; i < d.length; i++) d[i] *= 0.92 / peak;
  return buf;
}

/** AudioBuffer (mono hoặc stereo) -> file WAV 16-bit, kênh xen kẽ */
function toWav(buf: AudioBuffer): Blob {
  const chans = Math.min(2, buf.numberOfChannels);
  const frames = buf.length;
  const data = [buf.getChannelData(0), chans > 1 ? buf.getChannelData(1) : buf.getChannelData(0)];
  const out = new DataView(new ArrayBuffer(44 + frames * chans * 2));
  const str = (o: number, s: string) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  out.setUint32(4, 36 + frames * chans * 2, true);
  str(8, 'WAVEfmt ');
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, chans, true);
  out.setUint32(24, buf.sampleRate, true);
  out.setUint32(28, buf.sampleRate * chans * 2, true);
  out.setUint16(32, chans * 2, true);
  out.setUint16(34, 16, true);
  str(36, 'data');
  out.setUint32(40, frames * chans * 2, true);
  let o = 44;
  for (let i = 0; i < frames; i++)
    for (let c = 0; c < chans; c++) {
      out.setInt16(o, Math.max(-1, Math.min(1, data[c][i])) * 0x7fff, true);
      o += 2;
    }
  return new Blob([out], { type: 'audio/wav' });
}

class Music {
  private el: HTMLAudioElement | null = null;
  private djEl: HTMLAudioElement | null = null;
  private djUntil = 0;
  on = true;
  // hệ số âm lượng chỉnh ở trang điều khiển: 1 = mặc định, 2 = gấp đôi (tối đa 100%)
  level = readLevel();
  ready = false;

  start() {
    if (!IS_STAGE || this.el) return;
    const el = new Audio();
    el.loop = true;
    el.volume = 0;
    this.el = el;
    render()
      .then((buf) => {
        el.src = URL.createObjectURL(toWav(buf));
        this.ready = true;
      })
      .catch((err) => console.warn('Không dựng được nhạc nền:', err));
    const djEl = new Audio();
    djEl.loop = true;
    djEl.volume = 0;
    this.djEl = djEl;
    renderDJ()
      .then((buf) => (djEl.src = URL.createObjectURL(toWav(buf))))
      .catch((err) => console.warn('Không dựng được nhạc DJ:', err));
    const tryPlay = () => this.ready && this.on && el.paused && el.play().catch(() => {});
    // trình duyệt chặn tự phát thì thử lại định kỳ / khi có tương tác
    setInterval(tryPlay, 2000);
    window.addEventListener('pointerdown', tryPlay);
    // âm lượng trượt mượt về mức đích; lúc quẩy DJ thì nhạc đám cưới nhỏ hẳn, nhạc DJ to lên
    setInterval(() => {
      const dj = Date.now() < this.djUntil;
      const on = this.on && voice.enabled;
      const target = !on || dj ? 0 : Math.min(1, (voice.busy ? DUCK : LOUD) * this.level);
      el.volume = Math.max(0, Math.min(1, el.volume + (target - el.volume) * 0.3));
      if (!this.on && el.volume < 0.01) el.pause();
      const djTarget = on && dj ? Math.min(1, (voice.busy ? 0.42 : 0.85) * this.level) : 0;
      djEl.volume = Math.max(0, Math.min(1, djEl.volume + (djTarget - djEl.volume) * 0.3));
      if (dj && djEl.paused && djEl.src) djEl.play().catch(() => {});
      if (!dj && djEl.volume < 0.01 && !djEl.paused) djEl.pause();
    }, 100);
  }

  /** bật nhạc DJ trong `ms` rồi tự về nhạc đám cưới */
  dj(ms: number) {
    this.djUntil = Math.max(this.djUntil, Date.now() + ms);
    if (this.djEl) this.djEl.currentTime = 0;
  }

  setLevel(level: number) {
    this.level = Math.max(0, Math.min(2, level));
    try {
      localStorage.setItem(LEVEL_KEY, String(this.level));
    } catch {
      // bỏ qua
    }
  }

  set(on: boolean) {
    this.on = on;
    if (on && this.ready) this.el?.play().catch(() => {});
  }

  /** cho DevTools / trang điều khiển hỏi: nhạc có đang phát thật không */
  get playing() {
    return !!this.el && !this.el.paused && this.el.volume > 0.01;
  }
}

function impulse(ctx: BaseAudioContext, secs: number) {
  const len = Math.floor(ctx.sampleRate * secs);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  return buf;
}

function readLevel() {
  try {
    const v = Number(localStorage.getItem(LEVEL_KEY));
    return Number.isFinite(v) && v > 0 ? v : 1;
  } catch {
    return 1;
  }
}

export const music = new Music();
(window as unknown as { cMusic: Music }).cMusic = music;
// nghe thử ở trang điều khiển: window.cMusicPreview()
(window as unknown as { cMusicPreview: () => Promise<void> }).cMusicPreview = async () => {
  const a = new Audio(URL.createObjectURL(toWav(await render())));
  a.volume = 0.6;
  void a.play();
};
