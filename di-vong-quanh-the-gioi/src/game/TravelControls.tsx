// =====================================================
//  PHẦN ĐIỀU KHIỂN RIÊNG của "Đi Vòng Quanh Thế Giới" (gắn vào Dashboard):
//  trạng thái hành trình, ô nhập địa điểm có AUTOCOMPLETE (OpenStreetMap) +
//  nút KHỞI HÀNH cho chủ kênh, chuyến bay mẫu, nhạc nền. Người xem không cần
//  trang này — họ chỉ bình luận tên địa điểm ngay trong live.
// =====================================================

import { useRef, useState } from 'react';
import { sendControl, emitTest } from '../live/page';
import type { TravelView } from './travel';
import type { PlaceData } from './config';
import { flagEmoji, suggest } from './geo';

export function TravelControls({ view, stageCount }: { view: TravelView | null; stageCount: number }) {
  const [placeInput, setPlaceInput] = useState('');
  const [options, setOptions] = useState<{ label: string; place: PlaceData }[]>([]);
  const [picked, setPicked] = useState<PlaceData | null>(null);
  const [musicOn, setMusicOn] = useState(true);
  const [musicVol, setMusicVol] = useState(35);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onType = (v: string) => {
    setPlaceInput(v); setPicked(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void suggest(v).then(setOptions); }, 350);
  };

  const depart = () => {
    if (picked) { void sendControl('custom', `goto:${JSON.stringify(picked)}`); setPicked(null); setPlaceInput(''); setOptions([]); }
    else if (placeInput.trim()) { void sendControl('custom', `query:${placeInput.trim()}`); setPlaceInput(''); setOptions([]); }
  };

  const simChat = (comment: string) => {
    const names = ['Lan Anh', 'Minh Tuấn', 'Bé Na 🌸', 'Hoàng Long', 'Thu Trang'];
    const nickname = names[Math.floor(Math.random() * names.length)];
    void emitTest('chat', { nickname, username: nickname.normalize('NFKD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'khach', comment });
  };

  const tr = view?.travel;

  return (
    <section className="rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800">
      <h2 className="mb-2 font-semibold">✈️ Đi Vòng Quanh Thế Giới {stageCount > 0 ? `· ${stageCount} trang stage đang mở` : ''}</h2>

      <div className="rounded-lg bg-slate-800/70 px-3 py-2 text-xs leading-relaxed">
        {view == null && 'Chưa nhận được trạng thái từ trang stage. Mở ?view=stage trước.'}
        {view != null && (tr
          ? <>Đang bay: {flagEmoji(tr.from.cc)} <b>{tr.from.name}</b> → {flagEmoji(tr.to.cc)} <b>{tr.to.name}</b> ({tr.km.toLocaleString('vi-VN')} km) · {Math.round(tr.progress * 100)}% · gợi ý: {tr.byName}</>
          : <>Đang ở: {flagEmoji(view.current.cc)} <b>{view.current.name}, {view.current.country}</b> · Hàng chờ: {view.queue.length}
            {view.queue.length > 0 && <> ({view.queue.map((q) => q.name).join(' → ')})</>} · Tổng: {view.totalTrips} chuyến / {view.totalKm.toLocaleString('vi-VN')} km / {view.countries} quốc gia</>)}
      </div>

      <div className="relative mt-3">
        <input
          value={placeInput}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') depart(); }}
          placeholder="Bạn muốn khám phá nơi nào? (vd: Tháp Eiffel, Đà Nẵng, New York)"
          className="w-full rounded-lg bg-slate-800 px-3 py-2"
        />
        {options.length > 0 && (
          <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg bg-slate-800 ring-1 ring-slate-600">
            {options.map((o, i) => (
              <button key={i} onClick={() => { setPicked(o.place); setPlaceInput(o.place.name); setOptions([]); }}
                className="block w-full truncate px-3 py-2 text-left text-xs hover:bg-slate-700">
                {flagEmoji(o.place.cc)} {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button onClick={depart} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500">✈️ KHỞI HÀNH</button>
        <button onClick={() => void sendControl('custom', 'demo_trip')} className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-medium text-slate-950 hover:bg-amber-400">🎲 Chuyến bay mẫu</button>
        <button onClick={() => simChat('Paris')} className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-700">💬 Giả lập: gợi ý Paris</button>
        <button onClick={() => simChat('đi Đà Nẵng')} className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-700">💬 Giả lập: đi Đà Nẵng</button>
        <button onClick={() => simChat('Tháp Eiffel')} className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-700">💬 Giả lập: Tháp Eiffel</button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => { const next = !musicOn; setMusicOn(next); void sendControl('custom', next ? 'music_on' : 'music_off'); }}
          className="rounded-lg bg-slate-800 px-2.5 py-1.5 font-medium hover:bg-slate-700"
        >
          {musicOn ? '🔊 Nhạc: BẬT' : '🔇 Nhạc: TẮT'}
        </button>
        <label className="flex items-center gap-1.5 text-slate-400">
          Âm lượng nhạc
          <input type="range" min={0} max={100} value={musicVol}
            onChange={(e) => { setMusicVol(Number(e.target.value)); void sendControl('custom', `music_vol:${Number(e.target.value) / 100}`); }}
            className="w-28 accent-sky-500" />
          <b className="text-slate-200">{musicVol}%</b>
        </label>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        Cách chơi: người xem bình luận <b className="text-slate-300">tên địa điểm</b> → hệ thống tra tọa độ thật (OpenStreetMap),
        quả địa cầu xoay tới nơi, máy bay bay theo đường cong, đến nơi hiện ảnh + thông tin (Wikipedia).
        Đi càng xa điểm càng cao. Đang bay đủ 100 tim = gió thuận bay nhanh hơn. Quà chỉ vinh danh — thứ tự bay theo lượt gợi ý, không mua được.
      </p>
    </section>
  );
}
