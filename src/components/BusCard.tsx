import { Clock } from 'lucide-react';
import type { OptimalBus } from '../types/bus';
import { PASTEL_THEMES, type PastelKey } from '../config/stations';

function formatEta(minutes: number, seconds: number): string {
  const total = minutes * 60 + seconds;
  if (total <= 0) return '곧 도착';
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

interface Props {
  bus: OptimalBus;
}

/** 탑승 대상 버스 — 좌측 정류장 박스 + 중앙 노선 + 우측 ETA 3분할 카드 */
function TargetCard({ bus }: Props) {
  const { arrival, colorKey = 'orange' } = bus;
  const t = PASTEL_THEMES[colorKey as PastelKey];

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border-2 ${t.border} bg-white p-3 shadow-sm ${t.ring} ring-1`}
    >
      {/* 좌측: 정류장 식별 박스 */}
      <div
        className={`flex w-[80px] shrink-0 flex-col items-center justify-center rounded-xl border px-1 py-2 ${t.badgeBg} ${t.badgeText} ${t.badgeBorder}`}
      >
        <span className="text-base leading-none">{t.emoji}</span>
        <span className="mt-1 text-center text-[13px] font-black leading-tight">
          {t.badgeLabel}
        </span>
        {t.badgeTag && (
          <span className="mt-1 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-black">
            [ {t.badgeTag} ]
          </span>
        )}
      </div>

      {/* 중앙: 노선 & 정류장 수 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-2xl font-extrabold text-slate-900">
            {arrival.routeNo}
          </span>
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700">
            탑승
          </span>
        </div>
        <span className="mt-0.5 text-xs font-semibold text-slate-400">
          {arrival.remainingStops}정거장 전
        </span>
      </div>

      {/* 우측: 도착 시간 (한 줄 유지) */}
      <div className="flex shrink-0 items-center gap-1 whitespace-nowrap text-lg font-black tracking-tight text-slate-800">
        <Clock size={16} className="text-slate-400" />
        {formatEta(arrival.remainingMinutes, arrival.remainingSeconds)}
      </div>
    </div>
  );
}

/** 기타 일반 버스 — 슬림 행 (정류장 라벨 표기) */
function SlimCard({ bus }: Props) {
  const { arrival, stationName, colorKey = 'orange' } = bus;
  const t = PASTEL_THEMES[colorKey as PastelKey];

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-100/60 bg-white/60 px-3 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 rounded-md bg-amber-100/70 px-1.5 py-0.5 text-xs font-bold text-amber-800">
          {arrival.routeNo}
        </span>
        {stationName && (
          <span
            className={`truncate text-[11px] font-bold ${t.badgeText}`}
          >
            🚏 {stationName}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-xs">
        <span className="font-semibold text-slate-500">
          {formatEta(arrival.remainingMinutes, arrival.remainingSeconds)}
        </span>
        <span className="text-slate-400">{arrival.remainingStops}정거장 전</span>
      </div>
    </div>
  );
}

export default function BusCard({ bus }: Props) {
  return bus.isTarget ? <TargetCard bus={bus} /> : <SlimCard bus={bus} />;
}