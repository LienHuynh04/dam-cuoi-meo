// Nhạc nền "Đi Vòng Quanh Thế Giới" — bản nhạc GỐC soạn bằng Web Audio ngay
// trong trang stage: 100 BPM tươi sáng kiểu nhạc du lịch, marimba gõ giai điệu
// ngũ cung, đệm pad êm + bass gảy nhẹ + shaker. Không dùng file nhạc ngoài
// nên không dính bản quyền. Nhạc tự nhỏ xuống (duck) khi MC đang đọc.
// Trình duyệt bắt buộc có 1 tương tác đầu tiên mới cho phát tiếng: hook gọi
// resume() khi có tương tác nên nhạc tự lên ngay khi được phép.

const BPM = 100;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const STEP8 = BEAT / 2; // giai điệu chạy nốt đen đôi

// C – Am – F – G: vòng hợp âm sáng, hợp không khí xê dịch
const CHORDS: number[][] = [
  [261.63, 329.63, 392.0], // C4 E4 G4 — C
  [220.0, 261.63, 329.63], // A3 C4 E4 — Am
  [174.61, 220.0, 261.63], // F3 A3 C4 — F
  [196.0, 246.94, 293.66], // G3 B3 D4 — G
];
const BASS = [65.41, 55.0, 43.65, 49.0]; // C2 A1 F1 G1
// Giai điệu marimba gốc (ngũ cung C): 8 nốt mỗi ô nhịp, 0 = nghỉ
const MELODY: number[][] = [
  [523.25, 0, 659.25, 783.99, 0, 659.25, 587.33, 0], // C5 . E5 G5 . E5 D5 .
  [440.0, 0, 523.25, 659.25, 0, 523.25, 440.0, 0], // A4 . C5 E5 . C5 A4 .
  [349.23, 0, 440.0, 523.25, 0, 440.0, 392.0, 0], // F4 . A4 C5 . A4 G4 .
  [493.88, 0, 587.33, 783.99, 0, 587.33, 659.25, 523.25], // B4 . D5 G5 . D5 E5 C5
];
const BASE_LEVEL = 0.4;

class TravelMusic {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private duck: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private barIdx = 0;
  private stepIdx = 0;
  private nextBarAt = 0;
  private nextStepAt = 0;
  enabled = false;
  private volume = 1;
  private ducked = false;

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      this.ctx = ctx;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -24;
      comp.connect(ctx.destination);
      this.duck = ctx.createGain();
      this.duck.gain.value = 1;
      this.duck.connect(comp);
      this.bus = ctx.createGain();
      this.bus.gain.value = 0;
      this.bus.connect(this.duck);
    }
    return this.ctx;
  }

  unlock() { this.resume(); }

  resume() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    const ctx = this.ensureCtx();
    if (!ctx || !this.bus) return;
    const t = ctx.currentTime;
    if (on) {
      void ctx.resume();
      this.bus.gain.cancelScheduledValues(t);
      this.bus.gain.setTargetAtTime(BASE_LEVEL * this.volume, t, 1.0);
      if (!this.timer) {
        this.nextBarAt = t + 0.1;
        this.nextStepAt = t + 0.1;
        this.timer = setInterval(() => this.schedule(), 200);
        this.schedule();
      }
    } else {
      this.bus.gain.setTargetAtTime(0, t, 0.3);
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    if (!this.enabled || !this.ctx || !this.bus) return;
    this.bus.gain.setTargetAtTime(BASE_LEVEL * this.volume, this.ctx.currentTime, 0.2);
  }

  setDucked(on: boolean) {
    if (on === this.ducked) return;
    this.ducked = on;
    if (!this.ctx || !this.duck) return;
    this.duck.gain.setTargetAtTime(on ? 0.32 : 1, this.ctx.currentTime, 0.25);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.enabled) return;
    const ahead = ctx.currentTime + 0.9;
    while (this.nextBarAt < ahead) {
      const i = this.barIdx % CHORDS.length;
      const at = this.nextBarAt;
      this.playPad(CHORDS[i], at);
      for (let b = 0; b < 4; b++) this.playShaker(at + b * BEAT + BEAT / 2);
      this.playBass(BASS[i], at);
      this.playBass(BASS[i] * 1.5, at + BEAT * 2);
      this.barIdx++;
      this.nextBarAt += BAR;
    }
    while (this.nextStepAt < ahead) {
      const bar = Math.floor(this.stepIdx / 8) % MELODY.length;
      const note = MELODY[bar][this.stepIdx % 8];
      if (note > 0) this.playMarimba(note, this.nextStepAt);
      this.stepIdx++;
      this.nextStepAt += STEP8;
    }
  }

  private playShaker(at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const len = Math.floor(ctx.sampleRate * 0.07);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;
    const g = ctx.createGain();
    g.gain.value = 0.045;
    src.connect(hp).connect(g).connect(this.bus);
    src.start(at);
  }

  private playBass(freq: number, at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.14, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + BEAT * 1.4);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + BEAT * 1.5);
  }

  private playPad(freqs: number[], at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.022, at + 0.4);
      g.gain.setValueAtTime(0.022, at + BAR - 0.3);
      g.gain.linearRampToValueAtTime(0, at + BAR + 0.3);
      osc.connect(g).connect(this.bus);
      osc.start(at);
      osc.stop(at + BAR + 0.4);
    }
  }

  private playMarimba(freq: number, at: number) {
    const ctx = this.ctx;
    if (!ctx || !this.bus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const harm = ctx.createOscillator();
    harm.type = 'sine';
    harm.frequency.value = freq * 4;
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(0.012, at);
    hg.gain.exponentialRampToValueAtTime(0.0001, at + 0.09);
    harm.connect(hg).connect(this.bus);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.055, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + STEP8 * 1.6);
    osc.connect(g).connect(this.bus);
    osc.start(at);
    osc.stop(at + STEP8 * 1.7);
    harm.start(at);
    harm.stop(at + 0.1);
  }
}

export const music = new TravelMusic();
