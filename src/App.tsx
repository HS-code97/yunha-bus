import { useState } from 'react';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import { House, RefreshCw } from 'lucide-react';
import {
  ORIGINS,
  HOME_ORIGINS,
  STATION_COLOR_KEY,
  PASTEL_THEMES,
  type PastelKey,
} from './config/stations';
import HomeDashboard from './components/HomeDashboard';
import Dashboard from './components/Dashboard';

type ViewMode = 'home' | string; // 'home': 통합 비교, 그 외: 정류소 stationId

export default function App() {
  const [view, setView] = useState<ViewMode>('home'); // 앱 실행 시 기본: 집에 가기
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;

  const selectedOrigin = ORIGINS.find((o) => o.stationId === view);

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-4 py-5">
        {/* 헤더 — 좌: 타이틀 / 우: 갱신시간 + 새로고침 알약 */}
        <header className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-xl shadow-sm shadow-amber-200/60">
              🚌
            </div>
            <h1 className="text-xl font-extrabold text-slate-800">윤하 버스</h1>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-white px-2 py-1 shadow-sm">
            <span className="whitespace-nowrap text-[11px] font-semibold text-slate-400">
              {updatedAt ? new Date(updatedAt).toLocaleTimeString('ko-KR') : '-'}
            </span>
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              aria-label="새로고침"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-amber-950 transition-all hover:opacity-90 disabled:opacity-50"
            >
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* 1단 — 메인 액션 버튼 (소프트 버터 옐로우/망고) */}
        <button
          onClick={() => setView('home')}
          className={`mb-3 flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-3xl px-5 text-lg font-bold transition-all active:scale-95 ${
            view === 'home'
              ? 'bg-amber-400 text-amber-950 shadow-sm shadow-amber-200'
              : 'border-2 border-amber-200 bg-white text-amber-600 hover:border-amber-300'
          }`}
        >
          <House size={21} />
          집에 가기 (통합 비교)
        </button>

        {/* 2단 — 개별 정류소 서브 탭 (3분할, 정류소 전용 파스텔 컬러) */}
        <div className="mb-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-amber-100/60">
          {ORIGINS.map((origin) => {
            const active = view === origin.stationId;
            const t = PASTEL_THEMES[STATION_COLOR_KEY[origin.stationId] as PastelKey];
            return (
              <button
                key={origin.stationId}
                onClick={() => setView(origin.stationId)}
                className={`flex min-h-[44px] items-center justify-center rounded-xl px-1.5 py-2 text-[13px] font-bold transition-colors ${
                  active
                    ? `${t.tabActiveBg} ${t.tabActiveText} shadow-sm`
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="truncate">{origin.name}</span>
              </button>
            );
          })}
        </div>

        {view === 'home' ? (
          <HomeDashboard origins={HOME_ORIGINS} onDataUpdate={setUpdatedAt} />
        ) : (
          selectedOrigin && (
            <Dashboard origin={selectedOrigin} onDataUpdate={setUpdatedAt} />
          )
        )}

        <footer className="mt-6 text-center text-xs font-medium text-slate-400">
          30초마다 자동 갱신 · 국토교통부 TAGO API (광양시)
        </footer>
      </div>
    </div>
  );
}