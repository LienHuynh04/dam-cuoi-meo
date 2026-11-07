// =====================================================
//  SÂN KHẤU "ĐI VÒNG QUANH THẾ GIỚI" — canvas địa cầu 3D toàn cảnh + HUD:
//  tiêu đề & tổng số, thẻ chặng bay (đi → đến, km, thanh tiến trình, gió thuận),
//  hàng chờ, thẻ điểm đến khi hạ cánh (ảnh Wikipedia + cờ + tọa độ + sự thật),
//  nhật ký hành trình, bảng nhà thám hiểm, bảng ủng hộ (quà chỉ vinh danh).
//  Lớp phủ hạt nhiễu + tối góc theo hiệu ứng Đám Cưới Mèo bản chốt (pass 1).
// =====================================================

import { useEffect, useRef } from 'react';
import { GlobeScene } from './globeScene';
import type { TravelView } from './travel';
import { FAMOUS } from './config';
import { flagEmoji } from './geo';

export default function TravelStage({ view }: { view: TravelView }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GlobeScene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new GlobeScene(canvasRef.current);
    sceneRef.current = scene;
    return () => { scene.dispose(); sceneRef.current = null; };
  }, []);

  useEffect(() => { sceneRef.current?.update(view); }, [view]);

  const tr = view.travel;
  const arr = view.phase === 'arrived' ? view.lastArrival : null;
  const pct = tr ? Math.round(tr.progress * 100) : 0;

  return (
    <div className="absolute inset-0 overflow-hidden bg-sky-300 font-sans">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* phủ hạt + tối góc kiểu Đám Cưới Mèo (pass 1) */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\'/%3E%3C/filter%3E%3Crect width=\'160\' height=\'160\' filter=\'url(%23n)\' opacity=\'0.6\'/%3E%3C/svg%3E")' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 58%, rgba(2,32,71,0.28) 100%)' }} />

      {/* ===== TIÊU ĐỀ ===== */}
      <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-[26px] border-4 border-white/70 bg-sky-600/85 px-8 py-2.5 text-center shadow-xl">
        <div className="text-[40px] font-black leading-none tracking-wide text-white drop-shadow">✈️ ĐI VÒNG QUANH THẾ GIỚI 🌍</div>
      </div>
      <div className="absolute right-5 top-24 rounded-2xl border-2 border-white/60 bg-slate-900/70 px-4 py-2 text-right text-[21px] font-bold leading-snug text-white">
        <div>🗺️ {view.totalTrips} chuyến · {view.countries} quốc gia</div>
        <div>📏 Tổng {view.totalKm.toLocaleString('vi-VN')} km</div>
        <div>❤️ {view.likes.toLocaleString('vi-VN')} tim</div>
      </div>

      {/* ===== THẺ CHẶNG BAY ===== */}
      {tr && (
        <div className="absolute left-5 top-[150px] w-[430px] rounded-3xl border-2 border-white/60 bg-slate-900/75 p-4 text-white shadow-xl">
          <div className="text-[24px] font-black text-amber-300">✈️ ĐANG BAY</div>
          <div className="mt-1 text-[26px] font-bold leading-tight">
            {flagEmoji(tr.from.cc)} {tr.from.name} <span className="text-sky-300">→</span> {flagEmoji(tr.to.cc)} {tr.to.name}
          </div>
          <div className="mt-1 text-[20px] font-semibold text-white/85">
            {tr.to.country} · {tr.km.toLocaleString('vi-VN')} km · gợi ý: {tr.byName}
          </div>
          <div className="mt-3 h-[20px] overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-rose-400 transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 text-[19px] font-bold text-white/80">{pct}% hành trình</div>
          {view.likesToTailwind > 0 && <div className="text-[19px] font-bold text-rose-300">🌬️ Còn {view.likesToTailwind} tim nữa là có GIÓ THUẬN bay nhanh hơn!</div>}
        </div>
      )}

      {/* ===== HÀNG CHỜ ===== */}
      {view.queue.length > 0 && (
        <div className="absolute left-5 top-[470px] w-[430px] rounded-3xl border-2 border-white/50 bg-slate-900/60 p-4 text-white">
          <div className="text-[22px] font-black text-sky-200">🧳 HÀNG CHỜ BAY ({view.queue.length})</div>
          {view.queue.map((q, i) => (
            <div key={i} className="mt-1 truncate text-[21px] font-semibold">
              {i + 1}. {flagEmoji('')} {q.name}, {q.country} <span className="text-white/60">— {q.byName}</span>
            </div>
          ))}
        </div>
      )}

      {/* ===== BĂNG RÔN BÁO TRƯỚC (tự dẫn) ===== */}
      {view.announce && (
        <div className="absolute left-1/2 top-[760px] -translate-x-1/2 rounded-3xl border-4 border-amber-300 bg-rose-600/90 px-8 py-3 text-center shadow-2xl">
          <div className="text-[34px] font-black text-white">📣 {view.announce.title}</div>
          <div className="text-[22px] font-bold text-rose-100">{view.announce.sub}</div>
        </div>
      )}

      {/* ===== THẺ ĐIỂM ĐẾN KHI HẠ CÁNH ===== */}
      {arr && (
        <div className="absolute left-1/2 top-[300px] w-[680px] -translate-x-1/2 overflow-hidden rounded-[28px] border-4 border-white/80 bg-white/95 shadow-2xl">
          {arr.place.image && <img src={arr.place.image} alt={arr.place.name} className="h-[300px] w-full object-cover" />}
          <div className="p-5">
            <div className="text-[38px] font-black leading-tight text-slate-800">
              {flagEmoji(arr.place.cc)} {arr.place.name}
            </div>
            <div className="text-[23px] font-bold text-slate-500">
              {arr.place.country} · 📍 {arr.place.lat.toFixed(2)}°, {arr.place.lng.toFixed(2)}° · ✈️ {arr.km.toLocaleString('vi-VN')} km
            </div>
            {arr.place.fact && <div className="mt-2 text-[23px] font-medium leading-snug text-slate-700">{arr.place.fact}</div>}
            <div className="mt-2 text-[22px] font-black text-rose-500">
              {arr.byName === 'MC gợi ý' ? '🎫 Chuyến gợi ý của MC' : `🎫 ${arr.byName} gợi ý${arr.points > 0 ? ` · +${arr.points} điểm hành trình` : ''}`}
            </div>
          </div>
        </div>
      )}

      {/* ===== TRẠNG THÁI RẢNH ===== */}
      {view.phase === 'idle' && !tr && (
        <div className="absolute left-5 top-[150px] w-[430px] rounded-3xl border-2 border-white/60 bg-slate-900/70 p-4 text-white">
          <div className="text-[24px] font-black text-emerald-300">📍 ĐANG Ở</div>
          <div className="mt-1 text-[27px] font-bold leading-tight">{flagEmoji(view.current.cc)} {view.current.name}, {view.current.country}</div>
          <div className="mt-2 text-[20px] font-semibold leading-snug text-white/85">
            Cả nhà bình luận tên địa điểm muốn tới — mình bay liền!<br />
            Gợi ý: {FAMOUS.slice(0, 4).map((f) => f.name).join(' · ')}…
          </div>
        </div>
      )}

      {/* ===== NHẬT KÝ HÀNH TRÌNH ===== */}
      <div className="absolute bottom-[210px] left-5 w-[440px] rounded-3xl border-2 border-white/50 bg-slate-900/65 p-4 text-white">
        <div className="text-[22px] font-black text-amber-200">📖 NHẬT KÝ HÀNH TRÌNH</div>
        {view.log.length === 0 && <div className="mt-1 text-[20px] font-semibold text-white/70">Chưa có chuyến nào — chuyến đầu tiên chờ bạn gợi ý!</div>}
        {view.log.map((l, i) => (
          <div key={i} className="mt-1 truncate text-[21px] font-semibold">
            {flagEmoji(l.cc)} {l.name} <span className="text-white/55">· {l.km.toLocaleString('vi-VN')} km · {l.by}</span>
          </div>
        ))}
      </div>

      {/* ===== BẢNG NHÀ THÁM HIỂM + ỦNG HỘ ===== */}
      <div className="absolute bottom-[210px] right-5 w-[400px] rounded-3xl border-2 border-white/50 bg-slate-900/65 p-4 text-white">
        <div className="text-[22px] font-black text-amber-200">🏆 NHÀ THÁM HIỂM</div>
        {view.top.length === 0 && <div className="mt-1 text-[20px] font-semibold text-white/70">Chưa ai có điểm — gợi ý một nơi thật xa đi!</div>}
        {view.top.slice(0, 5).map((t, i) => (
          <div key={t.key} className="mt-1 flex justify-between text-[21px] font-semibold">
            <span className="truncate">{['🥇', '🥈', '🥉', '4.', '5.'][i]} {t.name}</span>
            <span className="text-amber-300">{t.points}đ · {t.trips}🎫</span>
          </div>
        ))}
        {view.supporters.length > 0 && (
          <>
            <div className="mt-3 text-[22px] font-black text-rose-300">🎁 ỦNG HỘ CHUYẾN ĐI</div>
            {view.supporters.slice(0, 3).map((s, i) => (
              <div key={i} className="mt-1 truncate text-[20px] font-semibold">{s.name} <span className="text-rose-300">· {s.hearts} xu</span></div>
            ))}
          </>
        )}
      </div>

      {/* ===== THANH HƯỚNG DẪN ===== */}
      <div className="absolute bottom-6 left-1/2 w-[1000px] -translate-x-1/2 rounded-[24px] border-2 border-white/60 bg-sky-700/85 px-6 py-3 text-center shadow-xl">
        <div className="text-[27px] font-black leading-snug text-white">
          💬 Bình luận <span className="text-amber-300">TÊN ĐỊA ĐIỂM</span> để bay tới đó: Paris · Tokyo · Đà Nẵng · Tháp Eiffel · New York
        </div>
        <div className="text-[20px] font-bold text-sky-100">Đi càng xa điểm càng cao · Đang bay đủ 100 tim = gió thuận bay nhanh · Quà chỉ để vinh danh, thứ tự bay theo lượt gợi ý</div>
      </div>
    </div>
  );
}
