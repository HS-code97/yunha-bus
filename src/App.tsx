import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bus } from 'lucide-react';
import { ORIGINS } from './config/stations';
import { getStationName } from './services';
import OriginTabs from './components/OriginTabs';
import Dashboard from './components/Dashboard';

export default function App() {
  const [selectedOriginId, setSelectedOriginId] = useState(ORIGINS[0].stationId);

  // 정류소 실제 명칭 조회 — 세션 동안 캐싱(staleTime: Infinity), 실패 시 ID 폴백
  const { data: originNames } = useQuery({
    queryKey: ['stationNames', ORIGINS.map((o) => o.stationId)],
    queryFn: async () => {
      const entries = await Promise.all(
        ORIGINS.map(async (o) => [o.stationId, await getStationName(o.stationId)] as const),
      );
      return Object.fromEntries(entries) as Record<string, string>;
    },
    staleTime: Infinity,
    retry: false,
  });

  // 이름 우선순위: stations.ts 설정 한글명(방향구분 포함) → API 학습 캐시(nodenm) → stationId
  const namedOrigins = ORIGINS.map((o) => ({
    ...o,
    name: o.name || originNames?.[o.stationId] || o.stationId,
  }));
  const selectedOrigin = namedOrigins.find((o) => o.stationId === selectedOriginId)!;

  return (
    <div className="min-h-screen bg-slate-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Bus size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">윤하 버스</h1>
            <p className="text-sm text-slate-500">광양시 실시간 최적 버스</p>
          </div>
        </header>

        <div className="mb-5">
          <OriginTabs
            origins={namedOrigins}
            selectedId={selectedOriginId}
            onSelect={setSelectedOriginId}
          />
        </div>

        <Dashboard origin={selectedOrigin} />

        <footer className="mt-6 text-center text-xs text-slate-400">
          30초마다 자동 갱신 · 국토교통부 TAGO API (광양시)
        </footer>
      </div>
    </div>
  );
}