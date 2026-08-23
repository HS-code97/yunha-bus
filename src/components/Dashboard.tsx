import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bus } from 'lucide-react';
import type { Station } from '../types/bus';
import { getOptimalBuses } from '../services';
import { TARGET_ROUTES } from '../config/stations';
import BusCard from './BusCard';

interface Props {
  origin: Station;
  onDataUpdate?: (ts: number) => void;
}

/** 개별 정류소 단독 도착 정보 뷰 (ETA 빠른 순 단일 스트림 정렬) */
export default function Dashboard({ origin, onDataUpdate }: Props) {
  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ['optimalBuses', origin.stationId],
    queryFn: () =>
      getOptimalBuses(origin.stationId, 100, {
        stationName: origin.name,
        targetRoutes: TARGET_ROUTES[origin.stationId] ?? [],
      }),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (dataUpdatedAt && onDataUpdate) onDataUpdate(dataUpdatedAt);
  }, [dataUpdatedAt, onDataUpdate]);

  return (
    <div>
      {isLoading && (
        <div className="space-y-2.5">
          {[0, 1].map((i) => (
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

      {/* ETA 빠른 순 단일 스트림 렌더링 (isTarget 여부에 따라 강조/슬림 자동 분기) */}
      <div className="space-y-2.5">
        {data?.map((bus, i) => (
          <BusCard key={`${bus.arrival.routeId}-${i}`} bus={bus} />
        ))}
      </div>
    </div>
  );
}
