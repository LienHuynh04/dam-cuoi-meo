// Nhân vật MÈO chibi 3D dựng bằng khối cơ bản (không cần file mô hình). Đầu to, người nhỏ, cao ~1.25 đơn vị.
// Đám Cưới Mèo: mọi nhân vật là mèo mặc đồ người — lông thay da/tóc, thêm tai mèo, mũi hồng, râu và đuôi vẫy.
import * as THREE from 'three';
import { hash } from './tags';

export type Body = 'suit' | 'shirt' | 'dress' | 'aodaiM' | 'aodaiF' | 'gown' | 'princess' | 'mermaid' | 'shortGown' | 'shorts';
export type HairStyle = 'short' | 'sidePart' | 'buzz' | 'long' | 'ponytail' | 'bun' | 'bob';
export type Hat = 'none' | 'veil' | 'tiara' | 'veilTiara' | 'khanVan' | 'khanXep' | 'headphones' | 'cap' | 'bun' | 'flowerCrown';

export interface Look {
  body: Body;
  main: string; // màu áo / váy
  pants: string;
  accent: string; // nơ, cà vạt, viền
  shoes: string;
  skin: string;
  hair: string;
  longHair: boolean; // tóc nữ (dài) / tóc nam (ngắn) khi không chỉ rõ kiểu
  hairStyle?: HairStyle;
  hat: Hat;
  flower?: boolean; // hoa cài áo chú rể
  beard?: boolean; // râu bạc (Nguyệt Lão)
  glasses?: boolean; // kính mắt (khách, như ảnh mẫu có mèo đeo kính)
  pearl?: boolean; // vòng cổ ngọc trai (khách nữ, như ảnh mẫu)
  age?: 'kid' | 'old'; // trẻ con (người nhỏ) / bà cụ (lưng còng)
}

// ---------- 6 bộ đồ cưới, mỗi cặp bốc 1 bộ ----------
export interface WeddingSet {
  name: string;
  groom: Partial<Look>;
  bride: Partial<Look>;
  rare?: boolean;
}

export const WEDDING_SETS: WeddingSet[] = [
  {
    name: 'Cổ điển',
    groom: { body: 'suit', main: '#1d1d24', pants: '#1d1d24', accent: '#111111', shoes: '#141414', flower: true, longHair: false, hairStyle: 'sidePart' },
    bride: { body: 'gown', main: '#fbfbfb', accent: '#f4d6df', hat: 'veil', longHair: true, hairStyle: 'bun' },
  },
  {
    name: 'Áo dài truyền thống',
    groom: { body: 'aodaiM', main: '#e0a526', pants: '#fff8e6', accent: '#b5651d', shoes: '#3a2a1a', hat: 'khanXep', longHair: false, hairStyle: 'short' },
    bride: { body: 'aodaiF', main: '#c8102e', pants: '#fff1f1', accent: '#f6c453', hat: 'khanVan', longHair: true, hairStyle: 'bun' },
  },
  {
    name: 'Sang chảnh',
    groom: { body: 'suit', main: '#f7f5f0', pants: '#f7f5f0', accent: '#1a1a1a', shoes: '#e9e4da', flower: true, longHair: false, hairStyle: 'sidePart' },
    bride: { body: 'mermaid', main: '#ffffff', accent: '#e8d8b0', hat: 'tiara', longHair: true, hairStyle: 'bun' },
  },
  {
    name: 'Thanh lịch',
    groom: { body: 'suit', main: '#1f2f5c', pants: '#1f2f5c', accent: '#c9ced6', shoes: '#141414', flower: true, longHair: false, hairStyle: 'sidePart' },
    bride: { body: 'aodaiF', main: '#fdfdfd', pants: '#ffffff', accent: '#e9c46a', hat: 'veil', longHair: true, hairStyle: 'bun' },
  },
  {
    name: 'Dễ thương',
    groom: { body: 'suit', main: '#9aa3ad', pants: '#9aa3ad', accent: '#f49ab2', shoes: '#2b2b2b', flower: true, longHair: false, hairStyle: 'sidePart' },
    bride: { body: 'princess', main: '#f7b6c8', accent: '#ffffff', hat: 'flowerCrown', longHair: true, hairStyle: 'bun' },
  },
  {
    name: 'Bựa',
    rare: true,
    groom: { body: 'shorts', main: '#1d1d24', pants: '#ff8a3d', accent: '#d62828', shoes: '#2a6fdb', flower: true, longHair: false, hairStyle: 'buzz' },
    bride: { body: 'shortGown', main: '#fbfbfb', accent: '#f4d6df', shoes: '#ffffff', hat: 'veil', longHair: true, hairStyle: 'bun' },
  },
];

/** Bộ bựa ra hiếm (~1/8) cho thành điểm gây cười */
export function pickWeddingSet(): WeddingSet {
  if (Math.random() < 0.12) return WEDDING_SETS[5];
  return WEDDING_SETS[Math.floor(Math.random() * 5)];
}

// "skin" của bản gốc giờ là MÀU LÔNG mèo: cam, xám, trắng kem, đen, nâu, tam thể nhạt
const SKINS = ['#f4a259', '#e8873a', '#9aa0a6', '#6e6e6e', '#fff3e0', '#f7ead9', '#2b2b2b', '#c97b4a', '#d9c7b0', '#8a5a3b'];
// "hair" là chỏm lông / tai / đuôi: tông đậm hơn lông thân cho nổi
const HAIRS = ['#b35c17', '#3a3a3a', '#141010', '#8a5a3b', '#5b4632', '#1b1512', '#d97b29', '#4a4a4a'];
const DYED = ['#d6332f', '#f08a24', '#f2c94c', '#f4f4f4', '#f49ab2', '#8a6cff'];
// áo thun màu cơ bản kiểu đám đông Việt + quần jean
const TEES = ['#2e9e5b', '#e85a9b', '#2f6fd6', '#ffffff', '#f2c94c', '#e74c3c', '#1f9d8b', '#8e44ad', '#f5f5f5', '#ff8fab'];
const JEANS = ['#3b5b8c', '#2f4a73', '#1f2f4d', '#2b2b2b', '#e9e4da', '#4a6fa5'];
const CLOTHES = ['#f49ab2', '#7ec8e3', '#ffd166', '#06d6a0', '#ef476f', '#8338ec', '#ff9f1c', '#a7c957', '#e9edc9', '#90e0ef', '#ffafcc', '#cdb4db'];
const PANTS = ['#2b2d42', '#3d405b', '#e9e4da', '#1d3557', '#6d6875'];

// vest khách nam theo ảnh mẫu: đen, navy, xám đậm — đi tiệc cưới là phải lịch sự
const SUITS = ['#1d1d24', '#1f2f5c', '#2b2b2b', '#23272e', '#3a2a3a', '#14213d'];
const BOWTIES = ['#111111', '#7a1020', '#1f2f5c', '#f6c453', '#5b3156'];

/** Khách mời: cùng username luôn ra cùng ngoại hình. `fem` ép giới tính (dàn khách quen theo tên), không có thì ngẫu nhiên */
export function guestLook(id: string, fem?: boolean): Look {
  const h = hash(id);
  const r = (n: number, k: number) => Math.floor(((h >>> (k * 3)) % 1000) / 1000 * n);
  const f = fem ?? r(2, 1) === 1;
  // như ảnh mẫu: khách nam phần lớn vest tối + nơ, khách nữ váy/áo dài pastel, thỉnh thoảng có kính / vòng ngọc
  const kind = (f ? ['dress', 'dress', 'aodaiF', 'shirt'] : ['suit', 'suit', 'suit', 'shirt'])[r(4, 10)] as Body;
  const tee = kind === 'shirt';
  return {
    body: kind,
    main: tee ? TEES[r(TEES.length, 2)] : kind === 'suit' ? SUITS[r(SUITS.length, 2)] : CLOTHES[r(CLOTHES.length, 2)],
    pants: tee ? JEANS[r(JEANS.length, 3)] : kind === 'suit' ? '#17171c' : PANTS[r(PANTS.length, 3)],
    accent: kind === 'suit' ? BOWTIES[r(BOWTIES.length, 4)] : CLOTHES[r(CLOTHES.length, 4)],
    shoes: '#2b2b2b',
    skin: SKINS[r(SKINS.length, 5)],
    hair: r(10, 6) < 2 ? DYED[r(DYED.length, 7)] : HAIRS[r(HAIRS.length, 8)],
    longHair: f,
    hairStyle: (f ? ['long', 'ponytail', 'bun', 'bob', 'long'] : ['short', 'sidePart', 'buzz', 'short'])[r(f ? 5 : 4, 9)] as HairStyle,
    hat: 'none',
    glasses: r(10, 11) < 1,
    pearl: f && r(10, 12) < 3,
  };
}

/** Khách đệm: thêm trẻ con và bà cụ cho rạp đời thường */
export function npcLook(seed: string): Look {
  const base = guestLook(seed);
  const r = Math.random();
  if (r < 0.14) {
    const girl = Math.random() < 0.5;
    return { ...base, age: 'kid', body: girl ? 'dress' : 'shirt', hair: HAIRS[0], longHair: girl, hairStyle: girl ? 'ponytail' : 'short' };
  }
  if (r < 0.26)
    return { ...base, age: 'old', body: 'aodaiF', main: ['#7b4b94', '#8d5a3b', '#4f6d7a', '#a14a5b'][Math.floor(Math.random() * 4)], pants: '#2b2b2b', hair: '#d9d9d9', longHair: true, hairStyle: 'bun', hat: 'none' };
  return base;
}

/** trẻ con nhỏ người hơn */
export const ageScale = (l: Look) => (l.age === 'kid' ? 0.72 : 1);

export function weddingLook(base: Look, part: Partial<Look>): Look {
  return { ...base, pants: '#ffffff', shoes: '#f4f4f4', hat: 'none', ...part, longHair: part.longHair ?? base.longHair, hairStyle: part.hairStyle ?? base.hairStyle };
}

// ---------- vật liệu + khối dùng chung (tiết kiệm bộ nhớ) ----------
const LEG = 0.46; // chiều cao hông
const SEAT = 0.48; // mặt ghế

const mats = new Map<string, THREE.MeshLambertMaterial>();
// vân hạt mịn dùng chung cho mọi bề mặt: phá cảm giác "nhựa phẳng" của màu đơn, lông/vải/đá đều có chất hơn.
// Hạt gần trắng (236–255) nên chỉ tạo vân rất nhẹ, không làm bẩn màu gốc.
let grainTex: THREE.Texture | null = null;
function grain() {
  if (!grainTex) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const x = c.getContext('2d')!;
    const img = x.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 236 + Math.floor(Math.random() * 20);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    grainTex = new THREE.CanvasTexture(c);
    grainTex.wrapS = THREE.RepeatWrapping;
    grainTex.wrapT = THREE.RepeatWrapping;
    grainTex.colorSpace = THREE.SRGBColorSpace;
  }
  return grainTex;
}

export function mat(color: string, opacity = 1) {
  const k = color + opacity;
  let m = mats.get(k);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, map: grain(), transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
    mats.set(k, m);
  }
  return m;
}

const G = {
  head: new THREE.SphereGeometry(0.27, 20, 14),
  hair: new THREE.SphereGeometry(0.285, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
  hairShort: new THREE.SphereGeometry(0.282, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.42),
  hairBuzz: new THREE.SphereGeometry(0.276, 18, 8, 0, Math.PI * 2, 0, Math.PI * 0.38),
  hairBob: new THREE.SphereGeometry(0.295, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
  fringe: new THREE.BoxGeometry(0.32, 0.07, 0.1),
  tailKnot: new THREE.SphereGeometry(0.075, 8, 6),
  tail: new THREE.CylinderGeometry(0.06, 0.025, 0.42, 8),
  brow: new THREE.BoxGeometry(0.075, 0.018, 0.012),
  nose: new THREE.SphereGeometry(0.03, 6, 5),
  ear: new THREE.ConeGeometry(0.115, 0.25, 4),
  earIn: new THREE.ConeGeometry(0.06, 0.14, 4),
  whisker: new THREE.BoxGeometry(0.11, 0.008, 0.008),
  catTail: new THREE.CylinderGeometry(0.04, 0.062, 0.6, 7),
  longHair: new THREE.CylinderGeometry(0.21, 0.24, 0.62, 14),
  eye: new THREE.SphereGeometry(0.045, 8, 6),
  eyeHi: new THREE.SphereGeometry(0.016, 6, 5),
  cheekFluff: new THREE.SphereGeometry(0.115, 8, 6),
  mouth: new THREE.SphereGeometry(0.05, 8, 6),
  glassRim: new THREE.TorusGeometry(0.075, 0.013, 6, 14),
  pearl: new THREE.TorusGeometry(0.13, 0.021, 6, 16),
  smile: new THREE.TorusGeometry(0.045, 0.012, 4, 10, Math.PI),
  cheek: new THREE.CircleGeometry(0.04, 10),
  arm: new THREE.CapsuleGeometry(0.045, 0.3, 4, 8),
  hand: new THREE.SphereGeometry(0.058, 8, 6),
  leg: new THREE.CylinderGeometry(0.062, 0.05, LEG - 0.03, 8),
  shoe: new THREE.BoxGeometry(0.11, 0.06, 0.17),
  torso: new THREE.CylinderGeometry(0.16, 0.2, 0.42, 14),
  shirtFront: new THREE.BoxGeometry(0.1, 0.24, 0.02),
  bow: new THREE.BoxGeometry(0.13, 0.05, 0.03),
  tie: new THREE.BoxGeometry(0.045, 0.2, 0.02),
  flower: new THREE.SphereGeometry(0.035, 6, 5),
  aodaiTop: new THREE.CylinderGeometry(0.16, 0.2, 0.5, 14),
  aodaiFlap: new THREE.BoxGeometry(0.24, 0.34, 0.02),
  gown: new THREE.CylinderGeometry(0.15, 0.48, 0.6, 18),
  princess: new THREE.CylinderGeometry(0.15, 0.56, 0.6, 18),
  bodice: new THREE.CylinderGeometry(0.15, 0.15, 0.2, 14),
  mermaid: new THREE.CylinderGeometry(0.15, 0.12, 0.46, 14),
  flare: new THREE.CylinderGeometry(0.12, 0.33, 0.2, 16),
  shortGown: new THREE.CylinderGeometry(0.15, 0.42, 0.32, 16),
  dress: new THREE.CylinderGeometry(0.14, 0.3, 0.46, 14),
  shortsPants: new THREE.CylinderGeometry(0.2, 0.21, 0.13, 12),
  belt: new THREE.TorusGeometry(0.16, 0.025, 6, 16),
  veil: new THREE.CylinderGeometry(0.1, 0.45, 1.15, 16, 1, true),
  tiara: new THREE.TorusGeometry(0.13, 0.022, 6, 14, Math.PI),
  khanVan: new THREE.TorusGeometry(0.24, 0.065, 8, 18),
  khanXep: new THREE.CylinderGeometry(0.28, 0.28, 0.11, 18),
  mic: new THREE.CylinderGeometry(0.025, 0.02, 0.16, 6),
  trayDisc: new THREE.CylinderGeometry(0.2, 0.2, 0.02, 14),
  dome: new THREE.SphereGeometry(0.13, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
  phones: new THREE.TorusGeometry(0.29, 0.035, 6, 16, Math.PI),
  earCup: new THREE.CylinderGeometry(0.08, 0.08, 0.06, 10),
  cap: new THREE.SphereGeometry(0.29, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.45),
  bun: new THREE.SphereGeometry(0.12, 10, 8),
  beard: new THREE.ConeGeometry(0.16, 0.42, 10),
  glass: new THREE.CylinderGeometry(0.05, 0.035, 0.14, 8),
  bouquet: new THREE.SphereGeometry(0.1, 8, 6),
  ring: new THREE.TorusGeometry(0.06, 0.015, 6, 14),
};

const mesh = (g: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, opacity = 1) => {
  const m = new THREE.Mesh(g, mat(color, opacity));
  m.position.set(x, y, z);
  return m;
};

// đĩa tai nghe dựng đứng hai bên đầu
const flat2 = (m: THREE.Mesh) => {
  m.rotation.z = Math.PI / 2;
  return m;
};

// vòng (thắt lưng) nằm ngang quanh eo
const flat = (m: THREE.Mesh) => {
  m.rotation.x = Math.PI / 2;
  return m;
};

export type Pose =
  | 'stand' | 'walk' | 'sit' | 'cheer' | 'zo' | 'dance' | 'kneel' | 'cry' | 'fall' | 'talk' | 'hug' | 'wave'
  | 'poke' | 'punch' | 'hit' | 'laugh' | 'carry' | 'dj' | 'flip' | 'spin' | 'jump' | 'bow';

/** 1 nhân vật. `root` đặt trên sàn, quay mặt theo +z khi rotation.y = 0 */
export class Chibi {
  root = new THREE.Group();
  private body = new THREE.Group(); // nhún lên xuống
  private outfit = new THREE.Group();
  private head = new THREE.Group();
  private armL = new THREE.Group();
  private armR = new THREE.Group();
  private legL = new THREE.Group();
  private legR = new THREE.Group();
  private prop: THREE.Object3D | null = null;
  look: Look;
  pose: Pose = 'stand';
  private phase = Math.random() * 10;

  private catTail: THREE.Group | null = null; // đuôi mèo, dựng trong build(), vẫy trong update()
  private mouthOpen: THREE.Mesh | null = null; // miệng há khi cười/nói/hô, ẩn hiện trong update()
  private scale: number;
  lean = 1; // trêu / đấm về phía nào (+1 phải, -1 trái)
  bowStart = -99; // lúc bắt đầu cúi lạy (giây, theo đồng hồ của world)
  seated = false; // đang ngồi ghế (world cập nhật mỗi khung hình)

  constructor(look: Look, scale = 1.1) {
    this.look = look;
    scale *= ageScale(look);
    this.scale = scale;
    this.root.scale.setScalar(scale);
    this.root.add(this.body);
    this.body.add(this.outfit, this.head, this.armL, this.armR, this.legL, this.legR);
    // dáng cao thon kiểu châu Á: chân dài, đầu nhỏ lại, áo kéo dài theo
    this.armL.position.set(-0.185, 0.87, 0);
    this.armR.position.set(0.185, 0.87, 0);
    this.legL.position.set(-0.075, LEG, 0);
    this.legR.position.set(0.075, LEG, 0);
    this.head.scale.setScalar(0.95); // đầu mèo to tròn như ảnh mẫu (mèo Anh mặt bánh bao)
    this.build();
  }

  /** đỉnh tóc (toạ độ thế giới), theo cả lúc ngồi / nhảy, để bảng tên nằm sát trên đầu */
  headTop(out: THREE.Vector3) {
    this.head.getWorldPosition(out);
    out.y += 0.34 * this.scale;
    return out;
  }

  setLook(look: Look) {
    this.look = look;
    for (const g of [this.outfit, this.head, this.armL, this.armR, this.legL, this.legR]) g.clear();
    this.prop = null;
    this.build();
  }

  /** cầm đồ trên tay phải: mic, ly, hoa cưới, nhẫn */
  hold(what: 'mic' | 'glass' | 'bouquet' | 'ring' | 'tray' | null) {
    if (this.prop) this.prop.removeFromParent();
    this.prop = null;
    if (!what) return;
    if (what === 'tray') {
      // mâm bưng trước ngực (gắn vào thân, không theo tay)
      const t = new THREE.Group();
      t.add(mesh(G.trayDisc, '#dfe3ea'), mesh(G.dome, '#e9edf2', 0, 0.01, 0));
      t.position.set(0, 0.86, 0.32);
      this.body.add(t);
      this.prop = t;
      return;
    }
    const p =
      what === 'mic'
        ? mesh(G.mic, '#222222', 0, -0.4, 0.06)
        : what === 'glass'
          ? mesh(G.glass, '#fff2b3', 0, -0.42, 0.04, 0.85)
          : what === 'bouquet'
            ? mesh(G.bouquet, '#ff6b8b', 0, -0.42, 0.06)
            : mesh(G.ring, '#f6c453', 0, -0.42, 0.06);
    this.armR.add(p);
    this.prop = p;
  }

  private build() {
    const L = this.look;
    const o = this.outfit;
    // ---- Đuôi mèo (bản Đám Cưới Mèo): gắn vào thân, update() cho vẫy ----
    if (this.catTail) this.catTail.removeFromParent();
    {
      const g = new THREE.Group();
      const t = mesh(G.catTail, L.hair, 0, 0.3, 0);
      g.add(t);
      g.position.set(0, 0.5, -0.17);
      g.rotation.x = -0.75; // chĩa ra sau, ngóc lên
      this.body.add(g);
      this.catTail = g;
    }
    const long = ['gown', 'princess', 'mermaid'].includes(L.body); // váy dài che chân
    // áo vẽ theo dáng cũ (hông 0.27) rồi kéo dãn lên dáng mới (hông LEG), thon lại theo chiều ngang
    if (long) {
      o.scale.set(0.86, 1.25, 0.86);
      o.position.y = 0;
    } else {
      o.scale.set(0.86, 1.15, 0.86);
      o.position.y = LEG - 0.27 * 1.15;
    }
    // chân
    for (const leg of [this.legL, this.legR]) {
      if (long) continue;
      const bare = L.body === 'shorts' || L.body === 'shortGown' || L.body === 'dress';
      leg.add(mesh(G.leg, bare ? L.skin : L.pants, 0, -(LEG - 0.03) / 2, 0));
      leg.add(mesh(G.shoe, L.shoes, 0, -LEG + 0.03, 0.03));
    }
    let sleeve = L.main;
    switch (L.body) {
      case 'suit':
      case 'shorts':
        o.add(mesh(G.torso, L.main, 0, 0.48, 0));
        o.add(mesh(G.shirtFront, '#ffffff', 0, 0.55, 0.165));
        if (L.accent === '#111111' || L.accent === '#1a1a1a' || L.body === 'shorts') o.add(mesh(G.bow, L.accent, 0, 0.66, 0.18));
        else o.add(mesh(G.tie, L.accent, 0, 0.55, 0.18));
        if (L.flower) o.add(mesh(G.flower, '#ff4d6d', -0.11, 0.6, 0.16));
        if (L.body === 'shorts') o.add(mesh(G.shortsPants, L.pants, 0, 0.27, 0));
        break;
      case 'shirt':
        o.add(mesh(G.torso, L.main, 0, 0.48, 0));
        break;
      case 'aodaiM':
        o.add(mesh(G.aodaiTop, L.main, 0, 0.47, 0));
        o.add(mesh(G.aodaiFlap, L.main, 0, 0.12, 0.1));
        o.add(mesh(G.aodaiFlap, L.main, 0, 0.12, -0.1));
        o.add(flat(mesh(G.belt, L.accent, 0, 0.62, 0)));
        break;
      case 'aodaiF':
        o.add(mesh(G.aodaiTop, L.main, 0, 0.47, 0));
        o.add(mesh(G.aodaiFlap, L.main, 0, 0.1, 0.09));
        o.add(mesh(G.aodaiFlap, L.main, 0, 0.1, -0.09));
        o.add(flat(mesh(G.belt, L.accent, 0, 0.66, 0)));
        break;
      case 'gown':
        o.add(mesh(G.gown, L.main, 0, 0.3, 0));
        o.add(mesh(G.bodice, L.main, 0, 0.66, 0));
        o.add(flat(mesh(G.belt, L.accent, 0, 0.58, 0)));
        break;
      case 'princess':
        o.add(mesh(G.princess, L.main, 0, 0.3, 0));
        o.add(mesh(G.bodice, L.main, 0, 0.66, 0));
        o.add(flat(mesh(G.belt, L.accent, 0, 0.58, 0)));
        break;
      case 'mermaid':
        o.add(mesh(G.mermaid, L.main, 0, 0.5, 0));
        o.add(mesh(G.flare, L.main, 0, 0.1, 0));
        o.add(flat(mesh(G.belt, L.accent, 0, 0.62, 0)));
        break;
      case 'shortGown':
        o.add(mesh(G.shortGown, L.main, 0, 0.42, 0));
        o.add(mesh(G.bodice, L.main, 0, 0.66, 0));
        break;
      case 'dress':
        o.add(mesh(G.dress, L.main, 0, 0.47, 0));
        break;
    }
    if (['gown', 'princess', 'mermaid', 'shortGown', 'dress'].includes(L.body)) sleeve = L.skin;
    // vòng cổ ngọc trai cho khách nữ (như ảnh mẫu), đeo ở cổ áo
    if (L.pearl) {
      const p = mesh(G.pearl, '#f8f4ec', 0, 0.7, 0.1);
      p.rotation.x = 0.55;
      o.add(p);
    }
    // tay
    for (const arm of [this.armL, this.armR]) {
      arm.add(mesh(G.arm, sleeve, 0, -0.19, 0));
      arm.add(mesh(G.hand, L.skin, 0, -0.38, 0));
    }
    // đầu
    const h = this.head;
    h.position.y = 1.18;
    h.add(mesh(G.head, L.skin));
    // má lông phồng 2 bên cho mặt tròn bánh bao như mèo trong ảnh mẫu
    for (const sx of [-1, 1]) h.add(mesh(G.cheekFluff, L.skin, sx * 0.16, -0.08, 0.13));
    // tóc: nam tóc ngắn / rẽ ngôi / đầu đinh, nữ tóc dài / đuôi ngựa / búi / bob
    const style: HairStyle = L.hairStyle ?? (L.longHair ? 'long' : 'short');
    const cap = (g: THREE.BufferGeometry, rx: number) => {
      const m = mesh(g, L.hair, 0, 0.03, -0.02);
      m.rotation.x = rx;
      h.add(m);
    };
    if (style === 'buzz') cap(G.hairBuzz, -0.25);
    else if (style === 'short' || style === 'sidePart') {
      cap(G.hairShort, -0.28);
      const fr = mesh(G.fringe, L.hair, style === 'sidePart' ? 0.05 : 0, 0.17, 0.19);
      fr.rotation.set(-0.55, 0, style === 'sidePart' ? -0.35 : 0);
      h.add(fr);
    } else if (style === 'bob') cap(G.hairBob, -0.12);
    else {
      cap(G.hair, -0.35);
      if (style === 'long') h.add(mesh(G.longHair, L.hair, 0, -0.2, -0.12));
      if (style === 'ponytail') {
        h.add(mesh(G.tailKnot, L.hair, 0, 0.06, -0.27));
        const t = mesh(G.tail, L.hair, 0, -0.16, -0.31);
        t.rotation.x = 0.25;
        h.add(t);
      }
      if (style === 'bun') h.add(mesh(G.bun, L.hair, 0, 0.2, -0.2));
    }
    // mắt to tròn long lanh (có đốm sáng) như mèo trong ảnh mẫu
    h.add(mesh(G.eye, '#1a1a1a', -0.09, 0.0, 0.235));
    h.add(mesh(G.eye, '#1a1a1a', 0.09, 0.0, 0.235));
    h.add(mesh(G.eyeHi, '#ffffff', -0.075, 0.02, 0.27));
    h.add(mesh(G.eyeHi, '#ffffff', 0.105, 0.02, 0.27));
    h.add(mesh(G.brow, L.age === 'old' ? '#bdbdbd' : '#2a1c16', -0.09, 0.075, 0.245), mesh(G.brow, L.age === 'old' ? '#bdbdbd' : '#2a1c16', 0.09, 0.075, 0.245));
    if (L.glasses) {
      for (const sx of [-1, 1]) h.add(mesh(G.glassRim, '#2b2b30', sx * 0.09, 0.0, 0.26));
      h.add(mesh(G.brow, '#2b2b30', 0, 0.01, 0.26));
    }
    h.add(mesh(G.nose, '#ff8fab', 0, -0.035, 0.265)); // mũi mèo hồng
    const smile = mesh(G.smile, '#7a2e2e', 0, -0.085, 0.245);
    smile.rotation.z = Math.PI;
    h.add(smile);
    // miệng há (cười to / nói / hô dô): update() bật theo pose, mặc định ẩn
    const mo = mesh(G.mouth, '#8e2f32', 0, -0.12, 0.235);
    mo.scale.set(1, 1.25, 0.45);
    mo.visible = false;
    h.add(mo);
    this.mouthOpen = mo as THREE.Mesh;
    const ck1 = mesh(G.cheek, '#ff9fb2', -0.16, -0.06, 0.2, 0.4);
    const ck2 = mesh(G.cheek, '#ff9fb2', 0.16, -0.06, 0.2, 0.4);
    ck1.rotation.y = -0.6;
    ck2.rotation.y = 0.6;
    h.add(ck1, ck2);
    // ---- Tai mèo + râu mèo (bản Đám Cưới Mèo) ----
    // Khăn xếp / mũ lưỡi trai / tai nghe phủ kín đỉnh đầu thì bỏ tai cho khỏi xuyên qua đồ.
    if (!['khanXep', 'cap', 'headphones'].includes(L.hat)) {
      for (const sx of [-1, 1]) {
        const ear = mesh(G.ear, L.hair, sx * 0.16, 0.29, -0.01);
        ear.rotation.z = sx * -0.18;
        const inner = mesh(G.earIn, '#ffb3c6', sx * 0.155, 0.28, 0.05);
        inner.rotation.z = sx * -0.18;
        h.add(ear, inner);
      }
    }
    // râu: 3 sợi mỗi bên, xòe nhẹ
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const w = mesh(G.whisker, '#f5f5f5', sx * 0.2, -0.03 - i * 0.025, 0.21);
        w.rotation.z = sx * (0.12 - i * 0.12);
        w.rotation.y = sx * 0.5;
        h.add(w);
      }
    }
    if (L.hat === 'veil' || L.hat === 'veilTiara') {
      const v = mesh(G.veil, '#ffffff', 0, -0.22, -0.16, 0.5);
      v.rotation.x = -0.18;
      h.add(v);
    }
    if (L.hat === 'tiara' || L.hat === 'veilTiara') {
      const t = mesh(G.tiara, '#f6c453', 0, 0.2, 0.05);
      t.rotation.x = -0.3;
      h.add(t);
    }
    if (L.hat === 'flowerCrown') {
      // vòng hoa đội đầu như cô dâu mèo trong ảnh mẫu: hoa trắng/hồng xen lá xanh chạy vòng cung trên trán
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI;
        const fx = Math.cos(a) * 0.19;
        const fy = 0.13 + Math.sin(a) * 0.14;
        const fl = mesh(G.flower, ['#ffffff', '#ffc2d1', '#ff8fab'][i % 3], fx, fy, 0.12);
        fl.scale.setScalar(1.7);
        h.add(fl);
        if (i % 2 === 0) {
          const lf = mesh(G.flower, '#5f8f4e', fx * 0.92, fy - 0.03, 0.1);
          lf.scale.setScalar(1.4);
          h.add(lf);
        }
      }
    }
    if (L.hat === 'khanVan') {
      const k = mesh(G.khanVan, L.accent === '#f6c453' ? '#d4a017' : L.main, 0, 0.13, 0);
      k.rotation.x = Math.PI / 2 - 0.2;
      h.add(k);
    }
    if (L.hat === 'khanXep') h.add(mesh(G.khanXep, L.main, 0, 0.2, -0.01));
    if (L.hat === 'headphones') {
      h.add(mesh(G.phones, '#1a1a1a', 0, 0.02, 0));
      h.add(flat2(mesh(G.earCup, '#ff2d55', -0.28, -0.02, 0)), flat2(mesh(G.earCup, '#ff2d55', 0.28, -0.02, 0)));
    }
    if (L.hat === 'cap') h.add(mesh(G.cap, L.accent, 0, 0.04, 0.01));
    if (L.hat === 'bun') h.add(mesh(G.bun, L.hair, 0, 0.2, -0.2));
    if (L.beard) {
      const bd = mesh(G.beard, '#f4f4f4', 0, -0.3, 0.12);
      bd.rotation.x = Math.PI;
      h.add(bd);
    }
  }

  /** gọi mỗi khung hình */
  update(t: number, moving: boolean) {
    const p = this.phase + t;
    const b = this.body;
    let pose: Pose = this.pose;
    if (moving && pose !== 'fall' && pose !== 'carry') pose = 'walk';
    b.position.set(0, 0, 0);
    b.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
    this.armL.rotation.set(0, 0, 0.12);
    this.armR.rotation.set(0, 0, -0.12);
    this.legL.rotation.set(0, 0, 0);
    this.legR.rotation.set(0, 0, 0);
    const sw = Math.sin(p * 9);
    // miệng há khi cười to / nói chuyện / hô dô / hoan hô cho sống động như khách mèo trong ảnh
    if (this.mouthOpen) this.mouthOpen.visible = pose === 'laugh' || pose === 'cheer' || pose === 'zo' || pose === 'talk';
    // đuôi mèo vẫy liên tục, vui (nhảy/hoan hô) thì vẫy nhanh và mạnh hơn
    if (this.catTail) {
      const excited = pose === 'dance' || pose === 'cheer' || pose === 'zo' || pose === 'jump';
      this.catTail.rotation.z = excited ? Math.sin(p * 10) * 0.45 : Math.sin(p * 2.3) * 0.28;
    }
    switch (pose) {
      case 'stand':
        b.position.y = Math.abs(Math.sin(p * 1.6)) * 0.015;
        this.head.rotation.z = Math.sin(p * 0.7) * 0.06;
        break;
      case 'walk':
        b.position.y = Math.abs(sw) * 0.05;
        this.armL.rotation.x = sw * 0.6;
        this.armR.rotation.x = -sw * 0.6;
        this.legL.rotation.x = -sw * 0.55;
        this.legR.rotation.x = sw * 0.55;
        break;
      case 'sit':
        b.position.y = SEAT / this.scale - LEG;
        this.legL.rotation.x = -1.35;
        this.legR.rotation.x = -1.35;
        this.head.rotation.z = Math.sin(p * 0.9) * 0.08;
        this.armL.rotation.x = -0.5;
        this.armR.rotation.x = -0.5;
        break;
      case 'zo':
        b.position.y = SEAT / this.scale - LEG;
        this.legL.rotation.x = -1.35;
        this.legR.rotation.x = -1.35;
        this.armR.rotation.set(-2.6 + Math.sin(p * 6) * 0.15, 0, -0.2);
        this.armL.rotation.x = -0.5;
        break;
      case 'cheer':
        b.position.y = Math.abs(Math.sin(p * 7)) * 0.12;
        this.armL.rotation.set(0, 0, 2.6 + Math.sin(p * 7) * 0.2);
        this.armR.rotation.set(0, 0, -2.6 - Math.sin(p * 7) * 0.2);
        break;
      case 'dance':
        b.position.y = Math.abs(Math.sin(p * 6)) * 0.14;
        b.rotation.y = Math.sin(p * 3) * 0.6;
        b.rotation.z = Math.sin(p * 6) * 0.12;
        this.armL.rotation.set(0, 0, 2.2 + Math.sin(p * 6) * 0.6);
        this.armR.rotation.set(0, 0, -2.2 + Math.sin(p * 6) * 0.6);
        break;
      case 'bow': {
        // bái lạy: chắp tay, cúi 1 cái đúng lúc MC hô "Bái!" (bowStart do world đặt chung cho cả 2 người)
        const k = (t - this.bowStart) / 1.4;
        const a = k > 0 && k < 1 ? Math.sin(Math.PI * k) * 0.6 : 0;
        b.rotation.x = a;
        b.position.z = -a * 0.35;
        b.position.y = -a * 0.08;
        this.legL.rotation.x = -a;
        this.legR.rotation.x = -a;
        this.armL.rotation.set(-0.9 - a, 0, 0.45);
        this.armR.rotation.set(-0.9 - a, 0, -0.45);
        this.head.rotation.x = a * 0.4;
        break;
      }
      case 'kneel':
        b.position.y = -LEG * 0.55;
        this.legL.rotation.x = -1.5;
        this.legR.rotation.x = 0.2;
        this.armR.rotation.set(-1.4, 0, 0);
        this.head.rotation.x = -0.15;
        break;
      case 'cry':
        b.position.y = Math.abs(Math.sin(p * 14)) * 0.02;
        this.armL.rotation.set(-2.3, 0, -0.5);
        this.armR.rotation.set(-2.3, 0, 0.5);
        this.head.rotation.x = 0.35;
        b.rotation.z = Math.sin(p * 14) * 0.04;
        break;
      case 'fall':
        b.rotation.x = -1.45;
        b.position.y = 0.18;
        this.armL.rotation.z = 2.4;
        this.armR.rotation.z = -2.4;
        this.legL.rotation.x = Math.sin(p * 12) * 0.5;
        this.legR.rotation.x = -Math.sin(p * 12) * 0.5;
        break;
      case 'talk':
        b.position.y = Math.abs(Math.sin(p * 5)) * 0.05;
        this.armR.rotation.set(-1.9, 0, 0.25);
        this.armL.rotation.set(0, 0, 0.4 + Math.sin(p * 4) * 0.4);
        this.head.rotation.z = Math.sin(p * 4) * 0.1;
        break;
      case 'hug':
        this.armL.rotation.set(-1.3, 0, -0.6);
        this.armR.rotation.set(-1.3, 0, 0.6);
        b.position.y = Math.abs(Math.sin(p * 3)) * 0.03;
        break;
      case 'wave':
        b.position.y = Math.abs(Math.sin(p * 3)) * 0.03;
        this.armR.rotation.set(0, 0, -2.6 + Math.sin(p * 9) * 0.35);
        break;
      // trêu nhau ở bàn (đang ngồi): chọc, đấm, bị đấm, cười
      case 'poke':
        this.sitBase();
        b.rotation.y = this.lean * 0.6;
        this.armR.rotation.set(-1.4 + Math.sin(p * 12) * 0.3, 0, -this.lean * 0.5);
        break;
      case 'punch': {
        this.sitBase();
        const j = Math.max(0, Math.sin(p * 10));
        b.rotation.y = this.lean * 0.8;
        b.rotation.z = -this.lean * j * 0.15;
        this.armR.rotation.set(-1.55, 0, -this.lean * (0.3 + j * 0.9));
        this.armL.rotation.set(-1.2, 0, 0.2);
        break;
      }
      case 'hit':
        this.sitBase();
        b.rotation.z = this.lean * 0.45;
        this.head.rotation.set(0.2, Math.sin(p * 20) * 0.5, this.lean * 0.3);
        this.armL.rotation.set(-2.4, 0, -0.4);
        this.armR.rotation.set(-2.4, 0, 0.4);
        break;
      case 'laugh':
        this.sitBase();
        b.position.y += Math.abs(Math.sin(p * 16)) * 0.04;
        this.head.rotation.x = -0.35 + Math.sin(p * 16) * 0.08;
        this.armL.rotation.set(-0.9, 0, 0.3);
        this.armR.rotation.set(-0.9, 0, -0.3);
        break;
      case 'carry':
        this.armL.rotation.set(-1.45, 0, -0.25);
        this.armR.rotation.set(-1.45, 0, 0.25);
        if (moving) {
          b.position.y = Math.abs(sw) * 0.04;
          this.legL.rotation.x = -sw * 0.5;
          this.legR.rotation.x = sw * 0.5;
        }
        break;
      // đội nhảy bựa: lộn nhào, xoay như con quay, nhảy cao
      case 'flip': {
        const k = (p * 1.2) % 1;
        b.position.y = Math.sin(k * Math.PI) * 0.9;
        b.rotation.x = -k * Math.PI * 2;
        this.armL.rotation.set(0, 0, 2.8);
        this.armR.rotation.set(0, 0, -2.8);
        break;
      }
      case 'spin':
        b.rotation.y = p * 14;
        b.position.y = Math.abs(Math.sin(p * 7)) * 0.1;
        this.armL.rotation.set(0, 0, 1.5);
        this.armR.rotation.set(0, 0, -1.5);
        break;
      case 'jump':
        b.position.y = Math.abs(Math.sin(p * 5)) * 0.7;
        this.armL.rotation.set(0, 0, 2.9);
        this.armR.rotation.set(0, 0, -2.9);
        this.legL.rotation.x = -Math.abs(Math.sin(p * 5)) * 0.8;
        this.legR.rotation.x = Math.abs(Math.sin(p * 5)) * 0.8;
        break;
      case 'dj':
        b.position.y = Math.abs(Math.sin(p * 8)) * 0.05;
        this.head.rotation.x = Math.sin(p * 8) * 0.25;
        this.armR.rotation.set(-1.3 + Math.sin(p * 8) * 0.3, 0, 0.2);
        this.armL.rotation.set(-1.1, 0, Math.sin(p * 4) * 0.4 - 0.2);
        break;
    }
    if (this.look.age === 'old' && pose !== 'fall') b.rotation.x += 0.2; // lưng còng
  }

  private sitBase() {
    if (!this.seated) return; // đứng đấm / trêu thì giữ dáng đứng
    this.body.position.y = SEAT / this.scale - LEG;
    this.legL.rotation.x = -1.35;
    this.legR.rotation.x = -1.35;
  }

  /** cho đội nhảy nhảy đều tay nhau */
  sync(phase = 0) {
    this.phase = phase;
  }
}
