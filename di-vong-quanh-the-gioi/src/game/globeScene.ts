// =====================================================
//  SÂN KHẤU 3D "ĐI VÒNG QUANH THẾ GIỚI" — Three.js (không asset ngoài nào bắt buộc):
//  - Quả địa cầu kết cấu bản đồ Trái Đất thật (tải runtime từ CDN jsdelivr — ảnh
//    Blue Marble của NASA, public domain); tải hỏng → kết cấu canvas vẽ tay.
//  - Địa danh mini dựng bằng khối nguyên thủy đặt ĐÚNG tọa độ thật trên cầu:
//    tháp Eiffel (Paris), Skytree (Tokyo), tượng Tự Do (New York), Kim tự tháp (Giza).
//  - Máy bay khối nguyên thủy bay theo đường cong cầu vồng giữa 2 điểm lat/lng thật,
//    quả địa cầu tự xoay cho điểm đến hướng về camera.
//  - Cô gái du khách (vali, ba lô, máy ảnh) đứng trên mây bên trái: vẫy tay khi chờ,
//    chỉ bản đồ khi đang bay, nhảy ăn mừng khi đến nơi.
//  - Hiệu ứng thừa hưởng từ Đám Cưới Mèo bản chốt: ACES tone mapping 1.12,
//    pháo giấy khi đến nơi, tim bay khi phòng thả tim.
// =====================================================

import * as THREE from 'three';
import type { TravelView } from './travel';
import type { PlaceData } from './config';
import { LAND_B64, LAND_W, LAND_H } from './landgrid';

const GLOBE_R = 10;

export function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function softCircleTexture(inner: string, outer: string): THREE.Texture {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function fallbackEarthTexture(): THREE.Texture {
  // Kết cấu dự phòng kiểu chấm (dot-matrix): đại dương chuyển sắc + các châu lục
  // vẽ từ lưới đất liền thật (landgrid.ts, dữ liệu Natural Earth public domain).
  const W = 1440, H = 720;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2563eb'); g.addColorStop(0.5, '#1d6fc4'); g.addColorStop(1, '#2563eb');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  try {
    const bin = atob(LAND_B64);
    const cellW = W / LAND_W, cellH = H / LAND_H;
    for (let y = 0; y < LAND_H; y++) {
      const lat = 90 - (y + 0.5) * (180 / LAND_H);
      const aLat = Math.abs(lat);
      const color = aLat > 62 ? '#f1f5f9' : aLat > 24 && aLat < 38 ? '#d9b36a' : lat > 0 && aLat <= 24 ? '#3fae5f' : '#57b96a';
      ctx.fillStyle = color;
      for (let x = 0; x < LAND_W; x++) {
        const idx = y * LAND_W + x;
        const byte = bin.charCodeAt(idx >> 3);
        if (byte & (1 << (7 - (idx & 7)))) {
          ctx.beginPath();
          ctx.arc((x + 0.5) * cellW, (y + 0.5) * cellH, cellW * 0.52, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } catch { /* không vẽ được thì vẫn còn nền đại dương */ }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function heartTexture(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.font = '76px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('💗', 48, 52);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const M = {
  std: (color: number, rough = 0.7, metal = 0.05) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }),
};

function box(w: number, h: number, d: number, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.castShadow = false; return m;
}
function cyl(rt: number, rb: number, h: number, mat: THREE.Material, seg = 14): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); return m;
}
function sph(r: number, mat: THREE.Material, w = 20, h = 14): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(r, w, h), mat);
}

function buildPlane(): THREE.Group {
  const g = new THREE.Group();
  const white = M.std(0xf8fafc, 0.35, 0.25); const red = M.std(0xe11d48, 0.4, 0.2); const dark = M.std(0x1e293b, 0.4, 0.3);
  const body = cyl(0.34, 0.34, 2.6, white, 16); body.rotation.z = Math.PI / 2; g.add(body);
  const nose = sph(0.34, white); nose.position.x = 1.3; nose.scale.set(1.5, 1, 1); g.add(nose);
  const cockpit = box(0.5, 0.22, 0.5, dark); cockpit.position.set(1.15, 0.24, 0); g.add(cockpit);
  const tail = cyl(0.1, 0.3, 0.8, white, 12); tail.rotation.z = Math.PI / 2; tail.position.x = -1.5; g.add(tail);
  const fin = box(0.5, 0.75, 0.08, red); fin.position.set(-1.75, 0.45, 0); g.add(fin);
  const wing = box(1.0, 0.07, 3.4, red); wing.position.set(0.1, -0.05, 0); g.add(wing);
  const stab = box(0.4, 0.06, 1.4, red); stab.position.set(-1.75, 0.05, 0); g.add(stab);
  const stripe = cyl(0.345, 0.345, 2.62, M.std(0x38bdf8, 0.4, 0.2), 16); stripe.rotation.z = Math.PI / 2; stripe.scale.set(1, 0.35, 1); stripe.position.y = 0.12; g.add(stripe);
  return g;
}

function surfaceGroup(lat: number, lng: number): THREE.Group {
  const g = new THREE.Group();
  const pos = latLngToVec3(lat, lng, GLOBE_R);
  g.position.copy(pos);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
  return g;
}

function buildLandmarks(): THREE.Group[] {
  const out: THREE.Group[] = [];
  // Eiffel — Paris
  {
    const g = surfaceGroup(48.8584, 2.2945); const iron = M.std(0x475569, 0.5, 0.5);
    const t1 = cyl(0.06, 0.34, 0.55, iron, 4); t1.position.y = 0.27; g.add(t1);
    const t2 = cyl(0.03, 0.16, 0.4, iron, 4); t2.position.y = 0.72; g.add(t2);
    const spire = cyl(0.005, 0.03, 0.3, iron, 4); spire.position.y = 1.05; g.add(spire);
    out.push(g);
  }
  // Skytree — Tokyo
  {
    const g = surfaceGroup(35.7101, 139.8107); const mat = M.std(0xbae6fd, 0.35, 0.4);
    const t = cyl(0.05, 0.22, 1.0, mat, 10); t.position.y = 0.5; g.add(t);
    const ant = cyl(0.012, 0.012, 0.45, mat, 6); ant.position.y = 1.2; g.add(ant);
    out.push(g);
  }
  // Tượng Tự do — New York
  {
    const g = surfaceGroup(40.6892, -74.0445); const mat = M.std(0x34d399, 0.5, 0.3);
    const robe = cyl(0.05, 0.2, 0.6, mat, 10); robe.position.y = 0.3; g.add(robe);
    const head = sph(0.09, mat); head.position.y = 0.68; g.add(head);
    const arm = cyl(0.03, 0.03, 0.4, mat, 6); arm.position.set(0.14, 0.75, 0); arm.rotation.z = -0.5; g.add(arm);
    out.push(g);
  }
  // Kim tự tháp — Giza
  {
    const g = surfaceGroup(29.9792, 31.1342); const mat = M.std(0xd6b25e, 0.9, 0);
    const p = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.6, 4), mat); p.position.y = 0.3; p.rotation.y = Math.PI / 4; g.add(p);
    out.push(g);
  }
  return out;
}

function buildGirl(): { group: THREE.Group; armR: THREE.Group; armL: THREE.Group; body: THREE.Group } {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const skin = M.std(0xffd9b3, 0.6); const dress = M.std(0xec4899, 0.7); const hairM = M.std(0x6b3f22, 0.8);
  // đám mây đế
  const cloud = new THREE.Group();
  const cloudM = M.std(0xffffff, 1);
  [[0, 0, 0, 1.3], [0.9, -0.1, 0.2, 0.9], [-0.9, -0.08, -0.1, 0.95], [0.2, 0.12, -0.5, 0.8]].forEach(([x, y, z, r]) => {
    const s = sph(r, cloudM); s.position.set(x, y, z); s.scale.y = 0.45; cloud.add(s);
  });
  cloud.position.y = -0.15; g.add(cloud);
  // váy + thân
  const skirt = cyl(0.34, 0.62, 0.85, dress, 18); skirt.position.y = 0.65; body.add(skirt);
  const torso = cyl(0.3, 0.36, 0.55, dress, 14); torso.position.y = 1.32; body.add(torso);
  // ba lô sau lưng + máy ảnh trước ngực
  const pack = box(0.55, 0.7, 0.3, M.std(0x14b8a6, 0.7)); pack.position.set(0, 1.35, -0.38); body.add(pack);
  const cam = box(0.34, 0.24, 0.16, M.std(0x1e293b, 0.4, 0.3)); cam.position.set(0, 1.28, 0.36); body.add(cam);
  const lens = cyl(0.07, 0.07, 0.08, M.std(0x38bdf8, 0.2, 0.6), 12); lens.rotation.x = Math.PI / 2; lens.position.set(0, 1.28, 0.46); body.add(lens);
  // đầu + tóc + búi
  const head = sph(0.42, skin); head.position.y = 2.0; body.add(head);
  const hair = sph(0.45, hairM); hair.position.set(0, 2.08, -0.06); hair.scale.set(1, 0.92, 1); body.add(hair);
  const face = sph(0.4, skin); face.position.set(0, 1.97, 0.09); body.add(face);
  const bun = sph(0.2, hairM); bun.position.set(0.28, 2.42, -0.1); body.add(bun);
  const bow = sph(0.1, M.std(0xf43f5e, 0.6)); bow.position.set(0.28, 2.52, -0.1); body.add(bow);
  // tay (pivot ở vai)
  const mkArm = (side: 1 | -1) => {
    const arm = new THREE.Group(); arm.position.set(0.36 * side, 1.55, 0);
    const a = cyl(0.085, 0.075, 0.62, skin, 10); a.position.y = -0.31; arm.add(a);
    body.add(arm); return arm;
  };
  const armR = mkArm(1); const armL = mkArm(-1);
  armL.rotation.z = 0.5; armR.rotation.z = -0.4;
  // vali cạnh chân
  const caseG = new THREE.Group(); caseG.position.set(1.05, 0, 0.25);
  const suitcase = box(0.62, 0.85, 0.28, M.std(0xf59e0b, 0.55)); suitcase.position.y = 0.45; caseG.add(suitcase);
  const handle = box(0.3, 0.2, 0.05, M.std(0x78716c, 0.4, 0.5)); handle.position.y = 1.0; caseG.add(handle);
  const sticker = box(0.2, 0.2, 0.02, M.std(0x38bdf8, 0.6)); sticker.position.set(0.1, 0.55, 0.15); caseG.add(sticker);
  g.add(caseG);
  return { group: g, armR, armL, body };
}

interface Confetto { vel: THREE.Vector3; spin: number; life: number; max: number }
interface Floater { sprite: THREE.Sprite; vel: number; life: number }

export class GlobeScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private spinGroup = new THREE.Group();
  private faceGroup = new THREE.Group();
  private globe!: THREE.Mesh;
  private plane = buildPlane();
  private arcLine!: THREE.Line;
  private trailLine!: THREE.Line;
  private curPin!: THREE.Group;
  private dstPin!: THREE.Group;
  private pinRing!: THREE.Mesh;
  private visitedGroup = new THREE.Group();
  private girl = buildGirl();
  private confetti!: THREE.Points;
  private confettiData: Confetto[] = [];
  private hearts: Floater[] = [];
  private heartTex = heartTexture();
  private raf = 0;
  private last = performance.now();
  private smoothProgress = 0;
  private lastConfettiAt = 0;
  private lastHeartsAt = 0;
  private visitedKey = '';
  private spinAngle = 0;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;   // hiệu ứng Đám Cưới Mèo bản chốt
    this.renderer.toneMappingExposure = 1.12;
    this.camera = new THREE.PerspectiveCamera(42, 9 / 16, 0.1, 300);
    this.camera.position.set(0, 3.2, 34);
    this.camera.lookAt(0, 1.4, 0);

    // bầu trời ban ngày
    const skyC = document.createElement('canvas'); skyC.width = 4; skyC.height = 256;
    const sctx = skyC.getContext('2d')!;
    const sg = sctx.createLinearGradient(0, 0, 0, 256);
    sg.addColorStop(0, '#3d9be9'); sg.addColorStop(0.55, '#8fd0f7'); sg.addColorStop(1, '#e3f5ff');
    sctx.fillStyle = sg; sctx.fillRect(0, 0, 4, 256);
    const skyTex = new THREE.CanvasTexture(skyC); skyTex.colorSpace = THREE.SRGBColorSpace;
    this.scene.background = skyTex;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    const sun = new THREE.DirectionalLight(0xfff6e0, 2.0); sun.position.set(12, 18, 16); this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xbfe3ff, 0.7); fill.position.set(-10, 4, -8); this.scene.add(fill);

    this.spinGroup.position.set(0.6, 2.1, 0);
    this.spinGroup.scale.setScalar(0.78);
    this.scene.add(this.spinGroup);
    this.spinGroup.add(this.faceGroup);

    // quả địa cầu
    const globeMat = new THREE.MeshStandardMaterial({ map: fallbackEarthTexture(), roughness: 0.85, metalness: 0 });
    this.globe = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R, 64, 48), globeMat);
    this.faceGroup.add(this.globe);
    new THREE.TextureLoader().load(
      'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg',
      (t) => { t.colorSpace = THREE.SRGBColorSpace; globeMat.map = t; globeMat.needsUpdate = true; },
      undefined,
      () => { /* giữ kết cấu dự phòng */ },
    );
    // viền khí quyển
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softCircleTexture('rgba(125,211,252,0.55)', 'rgba(125,211,252,0)'), transparent: true, depthWrite: false }));
    glow.scale.setScalar(27); glow.position.z = -2;
    this.faceGroup.add(glow);
    // địa danh mini
    buildLandmarks().forEach((l) => this.faceGroup.add(l));
    this.faceGroup.add(this.visitedGroup);

    // đường bay + vệt bay
    const arcMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
    const arcGeo = new THREE.BufferGeometry(); arcGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(65 * 3), 3));
    this.arcLine = new THREE.Line(arcGeo, arcMat); this.arcLine.visible = false; this.faceGroup.add(this.arcLine);
    const trailMat = new THREE.LineBasicMaterial({ color: 0xfda4af, transparent: true, opacity: 0.9 });
    const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(65 * 3), 3));
    this.trailLine = new THREE.Line(trailGeo, trailMat); this.trailLine.visible = false; this.faceGroup.add(this.trailLine);
    this.plane.visible = false;
    this.faceGroup.add(this.plane);

    // ghim vị trí hiện tại (vàng) + điểm đến (hồng)
    const mkPin = (color: number) => {
      const g = new THREE.Group();
      const dot = sph(0.32, M.std(color, 0.35, 0.2)); dot.position.y = 0.2; g.add(dot);
      const spike = cyl(0.03, 0.13, 0.55, M.std(color, 0.4, 0.2), 8); spike.position.y = -0.12; g.add(spike);
      return g;
    };
    this.curPin = mkPin(0xf59e0b);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 24), new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    ring.rotation.x = Math.PI / 2; ring.position.y = -0.28;
    this.curPin.add(ring); this.pinRing = ring;
    this.faceGroup.add(this.curPin);
    this.dstPin = mkPin(0xf43f5e); this.dstPin.visible = false;
    this.faceGroup.add(this.dstPin);

    // cô gái du khách trên mây, góc trái dưới quả cầu (trong khung hình dọc)
    this.girl.group.position.set(-5.1, -5.7, 5.5);
    this.girl.group.scale.setScalar(1.25);
    this.scene.add(this.girl.group);

    // mây trôi
    const cloudTex = softCircleTexture('rgba(255,255,255,0.95)', 'rgba(255,255,255,0)');
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.5 + Math.random() * 0.4, depthWrite: false }));
      s.position.set(-26 + Math.random() * 52, -8 + Math.random() * 22, -14 + Math.random() * 10);
      s.scale.set(6 + Math.random() * 7, 2 + Math.random() * 1.6, 1);
      s.userData.speed = 0.14 + Math.random() * 0.3;
      this.scene.add(s);
    }

    // pháo giấy
    const N = 260;
    const pos = new Float32Array(N * 3); const col = new Float32Array(N * 3);
    const palette = [0xf43f5e, 0xf59e0b, 0x10b981, 0x38bdf8, 0xa78bfa, 0xfacc15].map((h) => new THREE.Color(h));
    for (let i = 0; i < N; i++) {
      pos[i * 3 + 1] = -999;
      const c = palette[i % palette.length]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      this.confettiData.push({ vel: new THREE.Vector3(), spin: Math.random() * 6, life: 0, max: 1 });
    }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    cg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.confetti = new THREE.Points(cg, new THREE.PointsMaterial({ size: 0.42, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false }));
    this.scene.add(this.confetti);

    this.resize();
    window.addEventListener('resize', this.resize);
    this.loop();
  }

  private resize = () => {
    const w = this.canvas.clientWidth || 1080; const h = this.canvas.clientHeight || 1920;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
  }

  private burstConfetti(origin: THREE.Vector3) {
    const pos = this.confetti.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < this.confettiData.length; i++) {
      const d = this.confettiData[i];
      pos.setXYZ(i, origin.x + (Math.random() - 0.5) * 2, origin.y + Math.random() * 1.5, origin.z + 2);
      d.vel.set((Math.random() - 0.5) * 7, 3 + Math.random() * 6, (Math.random() - 0.5) * 3);
      d.max = 1.4 + Math.random() * 1.2; d.life = d.max;
    }
    pos.needsUpdate = true;
  }

  private burstHearts() {
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.heartTex, transparent: true, depthWrite: false }));
      s.position.set(-14 + Math.random() * 28, -11 + Math.random() * 3, 4 + Math.random() * 4);
      s.scale.setScalar(0.9 + Math.random() * 0.8);
      this.scene.add(s);
      this.hearts.push({ sprite: s, vel: 1.6 + Math.random() * 1.6, life: 2.6 });
    }
  }

  private setPin(pin: THREE.Group, place: PlaceData) {
    const g = surfaceGroup(place.lat, place.lng);
    pin.position.copy(g.position); pin.quaternion.copy(g.quaternion);
  }

  private arcPoint(a: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) {
    out.copy(a).lerp(b, t).normalize();
    const ang = a.angleTo(b);
    const alt = Math.sin(Math.PI * t) * Math.min(3.2, ang * 1.6);
    return out.multiplyScalar(GLOBE_R + 0.4 + alt);
  }

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    const t = now / 1000;
    const view = this.latest;
    if (view) this.applyView(view, t, dt);
    this.renderer.render(this.scene, this.camera);
  };

  private latest: TravelView | null = null;
  update(view: TravelView) { this.latest = view; }

  private applyView(view: TravelView, t: number, dt: number) {
    const camDir = new THREE.Vector3(0, 0.12, 1).normalize();

    // --- ghim + vòng pulse ---
    this.setPin(this.curPin, view.travel ? view.travel.from : view.current);
    this.pinRing.scale.setScalar(1 + 0.35 * Math.sin(t * 3));
    (this.pinRing.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.3 * Math.sin(t * 3);

    // --- điểm đã đến: chấm nhỏ ở lại trên cầu ---
    const vKey = view.log.map((l) => `${l.lat.toFixed(1)},${l.lng.toFixed(1)}`).join('|');
    if (vKey !== this.visitedKey) {
      this.visitedKey = vKey;
      this.visitedGroup.clear();
      for (const l of view.log) {
        const g = surfaceGroup(l.lat, l.lng);
        const dot = sph(0.13, M.std(0xffffff, 0.4)); dot.position.y = 0.05; g.add(dot);
        this.visitedGroup.add(g);
      }
    }

    let faceTarget: THREE.Vector3 | null = null;

    if (view.travel) {
      const tr = view.travel;
      // tiến trình bay: đuổi theo progress của engine cho mượt
      const target = tr.progress;
      this.smoothProgress += THREE.MathUtils.clamp(target - this.smoothProgress, -dt * 0.25, dt * 0.25 + 0.002);
      const p = THREE.MathUtils.clamp(this.smoothProgress, 0, 1);
      const a = latLngToVec3(tr.from.lat, tr.from.lng, 1);
      const b = latLngToVec3(tr.to.lat, tr.to.lng, 1);
      const surf = a.clone().lerp(b, p).normalize();
      faceTarget = surf;
      // vẽ đường bay đầy đủ + vệt đã bay
      const arcPos = this.arcLine.geometry.getAttribute('position') as THREE.BufferAttribute;
      const trailPos = this.trailLine.geometry.getAttribute('position') as THREE.BufferAttribute;
      const tmp = new THREE.Vector3();
      for (let i = 0; i <= 64; i++) {
        this.arcPoint(a, b, i / 64, tmp); arcPos.setXYZ(i, tmp.x, tmp.y, tmp.z);
        this.arcPoint(a, b, (i / 64) * p, tmp); trailPos.setXYZ(i, tmp.x, tmp.y, tmp.z);
      }
      arcPos.needsUpdate = true; trailPos.needsUpdate = true;
      this.arcLine.visible = true; this.trailLine.visible = true;
      const planePos = this.arcPoint(a, b, p, new THREE.Vector3());
      const ahead = this.arcPoint(a, b, Math.min(1, p + 0.02), new THREE.Vector3());
      this.plane.scale.setScalar(0.8);
      this.plane.position.copy(planePos);
      const m = new THREE.Matrix4().lookAt(planePos, ahead, planePos.clone().normalize());
      this.plane.quaternion.setFromRotationMatrix(m);
      this.plane.rotateY(Math.PI / 2);
      this.plane.visible = true;
      this.dstPin.visible = true;
      this.setPin(this.dstPin, tr.to);
    } else {
      this.arcLine.visible = false; this.trailLine.visible = false; this.plane.visible = false;
      this.smoothProgress = 0;
      if (view.phase === 'arrived' && view.lastArrival) {
        faceTarget = latLngToVec3(view.lastArrival.place.lat, view.lastArrival.place.lng, 1);
        this.dstPin.visible = true; this.setPin(this.dstPin, view.lastArrival.place);
      } else {
        this.dstPin.visible = false;
        faceTarget = latLngToVec3(view.current.lat, view.current.lng, 1);
      }
    }

    // --- xoay cầu: điểm cần nhìn hướng về camera; rảnh thì xoay chậm ngắm cảnh ---
    if (faceTarget) {
      const q = new THREE.Quaternion().setFromUnitVectors(faceTarget, camDir);
      this.faceGroup.quaternion.slerp(q, view.travel ? 1 - Math.pow(0.0015, dt) : 1 - Math.pow(0.02, dt));
    }
    if (view.phase === 'idle' && !view.travel) {
      this.spinAngle += dt * 0.03;
    }
    this.spinGroup.rotation.y = this.spinAngle * (view.phase === 'idle' ? 1 : 0);
    if (view.phase !== 'idle') this.spinAngle = 0;

    // --- cô gái: vẫy / chỉ / ăn mừng ---
    const girl = this.girl;
    girl.body.position.y = Math.sin(t * 1.7) * 0.06;
    if (view.phase === 'arrived' && view.lastArrival && view.at - view.lastArrival.at < 2600) {
      const jump = Math.abs(Math.sin(t * 7)) * 0.55;
      girl.body.position.y = jump;
      girl.armR.rotation.z = -2.6 + Math.sin(t * 7) * 0.25;
      girl.armL.rotation.z = 2.6 - Math.sin(t * 7) * 0.25;
    } else if (view.phase === 'flying') {
      girl.armR.rotation.z = -2.2;                       // chỉ lên quả địa cầu
      girl.armL.rotation.z = 0.5;
      girl.body.rotation.y = 0.25;
    } else {
      girl.body.rotation.y = 0;
      girl.armR.rotation.z = -0.4 + Math.max(0, Math.sin(t * 0.7)) * -1.6 * (Math.sin(t * 3) > 0 ? 1 : 0.15); // vẫy tay từng đợt
      girl.armL.rotation.z = 0.5;
    }

    // --- mây trôi ---
    this.scene.traverse((o) => {
      if (o instanceof THREE.Sprite && o.userData.speed) {
        o.position.x += (o.userData.speed as number) * dt;
        if (o.position.x > 30) o.position.x = -30;
      }
    });

    // --- pháo giấy khi đến nơi ---
    if (view.confettiAt && view.confettiAt !== this.lastConfettiAt) {
      this.lastConfettiAt = view.confettiAt;
      this.burstConfetti(new THREE.Vector3(2, 6, 6));
    }
    const pos = this.confetti.geometry.getAttribute('position') as THREE.BufferAttribute;
    let anyAlive = false;
    for (let i = 0; i < this.confettiData.length; i++) {
      const d = this.confettiData[i];
      if (d.life <= 0) continue;
      anyAlive = true;
      d.life -= dt;
      d.vel.y -= 6.5 * dt;
      const x = pos.getX(i) + d.vel.x * dt, y = pos.getY(i) + d.vel.y * dt, z = pos.getZ(i) + d.vel.z * dt;
      pos.setXYZ(i, x, Math.max(y, -13), z);
      if (d.life <= 0) pos.setY(i, -999);
    }
    if (anyAlive) pos.needsUpdate = true;

    // --- tim bay ---
    if (view.heartsAt && view.heartsAt !== this.lastHeartsAt) { this.lastHeartsAt = view.heartsAt; this.burstHearts(); }
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      h.life -= dt; h.sprite.position.y += h.vel * dt;
      (h.sprite.material as THREE.SpriteMaterial).opacity = Math.max(0, Math.min(1, h.life));
      if (h.life <= 0) { this.scene.remove(h.sprite); this.hearts.splice(i, 1); }
    }
  }
}
