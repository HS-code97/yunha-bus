import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bus } from 'lucide-react';
import type { Station } from '../types/bus';
import { getOptimalBuses } from '../services';
import { TARGET_ROUTES } from '../config/stations';
import BusCard from './BusCard';

interface Props {
  origins: Station[]; // 통합 비교 대상 정류소 (사랑병원 + 사랑병원 건너)
  onDataUpdate?: (ts: number) => void;
}

/** '집에 가기' — 두 정류소를 동시 조회해 ETA 빠른 순으로 통합 표출 */
export default function HomeDashboard({ origins, onDataUpdate }: Props) {
  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ['homeBuses', origins.map((o) => o.stationId)],
    queryFn: async () => {
      const lists = await Promise.all(
        origins.map((o) =>
          getOptimalBuses(o.stationId, 100, {
            stationName: o.name,
            targetRoutes: TARGET_ROUTES[o.stationId] ?? [],
          }),
        ),
      );
      // ETA 빠른 순 통합 정렬
      return lists
        .flat()
        .sort(
          (a, b) =>
            a.arrival.remainingMinutes * 60 + a.arrival.remainingSeconds -
            (b.arrival.remainingMinutes * 60 + b.arrival.remainingSeconds),
        );
    },
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (dataUpdatedAt && onDataUpdate) onDataUpdate(dataUpdatedAt);
  }, [dataUpdatedAt, onDataUpdate]);

  return (
    <div>
      {isLoading && (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-base font-medium text-red-500">
          <AlertTriangle size={18} />
          정보를 불러오지 못했습니다: {(error as Error)?.message ?? '알 수 없는 오류'}
        </div>
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-8 text-base font-medium text-slate-400 shadow-sm">
          <Bus size={32} />
          현재 운행 중인 버스가 없습니다.
        </div>
      )}

      <div className="space-y-2.5">
        {data?.map((bus, i) => (
          <BusCard key={`${bus.arrival.routeId}-${i}`} bus={bus} />
        ))}
      </div>
    </div>
  );
}