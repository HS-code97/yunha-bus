import { Bus, Clock, Flag, Home, Users } from 'lucide-react';
import type { OptimalBus } from '../types/bus';

const CROWDED_LABEL: Record<string, { text: string; cls: string }> = {
  SEAT: { text: '여유', cls: 'bg-green-100 text-green-700' },
  STAND: { text: '보통', cls: 'bg-amber-100 text-amber-700' },
  CROWDED: { text: '혼잡', cls: 'bg-red-100 text-red-700' },
};

function formatEta(minutes: number, seconds: number): string {
  const total = minutes * 60 + seconds;
  if (total <= 0) return '곧 도착';
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

export default function BusCard({ bus }: { bus: OptimalBus }) {
  const { arrival, stopsToDestination, nextArrival } = bus;
  const crowded = arrival.crowdedness ? CROWDED_LABEL[arrival.crowdedness] : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Bus size={28} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-2xl font-extrabold text-slate-900">
              {arrival.routeNo}
            </div>
            <div className="text-sm font-medium text-slate-500">
              {arrival.direction === 'CIRCULAR'
                ? '순환'
                : arrival.direction === 'UP'
                  ? '상행'
                  : '하행'}{' '}
              방면
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 text-3xl font-black tracking-tight text-blue-600">
            <Clock size={22} />
            {formatEta(arrival.remainingMinutes, arrival.remainingSeconds)}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1.5 text-base font-bold text-slate-600">
            <Flag size={15} />
            {arrival.remainingStops}정거장 전
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-4 py-2 text-base font-bold text-indigo-700">
          <Home size={16} />
          집까지 {stopsToDestination}정거장
        </span>
        {crowded && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-base font-bold ${crowded.cls}`}
          >
            <Users size={16} />
            {crowded.text}
          </span>
        )}
      </div>

      {nextArrival && (
        <div className="mt-4 flex min-h-[48px] items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-base">
          <span className="font-semibold text-slate-500">다음 버스</span>
          <span className="font-bold text-slate-700">
            {nextArrival.routeNo} ·{' '}
            {formatEta(nextArrival.remainingMinutes, nextArrival.remainingSeconds)} ·{' '}
            {nextArrival.remainingStops}정거장 전
          </span>
        </div>
      )}
    </div>
  );
}