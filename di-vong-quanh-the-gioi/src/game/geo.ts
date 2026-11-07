// =====================================================
//  TRA CỨU ĐỊA ĐIỂM THẬT — chạy trên trang sân khấu (trình duyệt có internet).
//  Tọa độ + quốc gia: OpenStreetMap Nominatim (miễn phí, không cần key).
//  Ảnh + mô tả: Wikipedia REST summary (miễn phí, không cần key).
//  Có cache theo từ khóa để không gọi lặp; gọi nối tiếp để tôn trọng giới hạn 1 req/s.
// =====================================================

import type { PlaceData } from './config';

export function flagEmoji(cc: string): string {
  if (!cc || cc.length !== 2) return '🌍';
  const base = 0x1f1e6;
  return String.fromCodePoint(base + cc.toUpperCase().charCodeAt(0) - 65, base + cc.toUpperCase().charCodeAt(1) - 65);
}

interface NomResult {
  lat: string; lon: string; display_name: string; type: string; class: string; importance?: number;
  address?: { city?: string; town?: string; village?: string; state?: string; country?: string; country_code?: string };
  namedetails?: { name?: string };
}

const cache = new Map<string, PlaceData | null>();
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(() => undefined, () => undefined);
  return run;
}

async function fetchWiki(titleOrName: string, lang: 'vi' | 'en'): Promise<{ fact: string; image: string } | null> {
  try {
    const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titleOrName.replace(/ /g, '_'))}`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    const j = (await r.json()) as { extract?: string; thumbnail?: { source?: string }; originalimage?: { source?: string }; type?: string };
    if (j.type === 'disambiguation' || !j.extract) return null;
    const sentences = j.extract.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
    return { fact: sentences.slice(0, 320), image: j.thumbnail?.source ?? j.originalimage?.source ?? '' };
  } catch { return null; }
}

async function lookupOnce(query: string): Promise<PlaceData | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&addressdetails=1&accept-language=vi`;
  let results: NomResult[] = [];
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    results = (await r.json()) as NomResult[];
  } catch { return null; }
  // Ưu tiên kết quả là địa danh/địa giới có độ quan trọng cao, bỏ kết quả vặt (đường nhỏ, cửa hàng lẻ)
  const good = results.filter((x) => (x.importance ?? 0) >= 0.25 || x.class === 'boundary' || x.class === 'place');
  const best = (good[0] ?? results[0]);
  if (!best) return null;
  const addr = best.address ?? {};
  const country = addr.country ?? '';
  if (!country) return null;
  const namePart = best.display_name.split(',')[0].trim();
  const city = addr.city ?? addr.town ?? addr.village ?? addr.state ?? namePart;
  const place: PlaceData = {
    name: namePart,
    city,
    country,
    cc: (addr.country_code ?? '').toUpperCase(),
    lat: parseFloat(best.lat),
    lng: parseFloat(best.lon),
    fact: '',
    image: '',
  };
  // Wikipedia: thử theo tên hiển thị rồi theo thành phố (tiếng Việt trước, Anh sau)
  const wiki = (await fetchWiki(place.name, 'vi')) ?? (await fetchWiki(city, 'vi')) ?? (await fetchWiki(place.name, 'en')) ?? (await fetchWiki(city, 'en'));
  if (wiki) { place.fact = wiki.fact; place.image = wiki.image; }
  return place;
}

/** Tra một địa điểm theo từ khóa người xem gõ. null = không tìm thấy. */
export function geocode(query: string): Promise<PlaceData | null> {
  const key = query.trim().toLowerCase();
  if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null);
  return serial(async () => {
    if (cache.has(key)) return cache.get(key) ?? null;
    const found = await lookupOnce(query.trim());
    cache.set(key, found);
    return found;
  });
}

/** Gợi ý autocomplete cho ô nhập của chủ kênh (trang điều khiển). */
export async function suggest(query: string): Promise<{ label: string; place: PlaceData }[]> {
  if (query.trim().length < 3) return [];
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&accept-language=vi`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return [];
    const results = (await r.json()) as NomResult[];
    return results.map((x) => {
      const addr = x.address ?? {};
      const namePart = x.display_name.split(',')[0].trim();
      return {
        label: x.display_name,
        place: {
          name: namePart,
          city: addr.city ?? addr.town ?? addr.village ?? addr.state ?? namePart,
          country: addr.country ?? '',
          cc: (addr.country_code ?? '').toUpperCase(),
          lat: parseFloat(x.lat), lng: parseFloat(x.lon), fact: '', image: '',
        },
      };
    }).filter((s) => s.place.country);
  } catch { return []; }
}

/** Bổ sung ảnh + mô tả Wikipedia cho một địa điểm có sẵn tọa độ (dùng cho autocomplete/FAMOUS). */
export async function enrich(place: PlaceData): Promise<PlaceData> {
  if (place.fact && place.image) return place;
  const wiki = (await fetchWiki(place.name, 'vi')) ?? (await fetchWiki(place.city, 'vi')) ?? (await fetchWiki(place.name, 'en'));
  if (!wiki) return place;
  return { ...place, fact: place.fact || wiki.fact, image: place.image || wiki.image };
}
