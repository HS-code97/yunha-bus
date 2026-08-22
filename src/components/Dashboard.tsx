import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bus, RefreshCw } from 'lucide-react';
import type { Station } from '../types/bus';
import { getOptimalBuses } from '../services';
import BusCard from './BusCard';

interface Props {
  origin: Station;
}

export default function Dashboard({ origin }: Props) {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch, isFetching } =
    useQuery({
      queryKey: ['optimalBuses', origin.stationId],
      queryFn: () => getOptimalBuses(origin.stationId),
    });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="min-w-0 truncate text-base font-bold text-slate-600">
          {origin.name} → 집
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {dataUpdatedAt
              ? `갱신: ${new Date(dataUpdatedAt).toLocaleTimeString('ko-KR')}`
              : ''}
          </span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            새로고침
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-base font-medium text-red-600">
          <AlertTriangle size={18} />
          정보를 불러오지 못했습니다: {(error as Error)?.message ?? '알 수 없는 오류'}
        </div>
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-slate-50 p-8 text-base font-medium text-slate-500">
          <Bus size={32} />
          현재 운행 중인 유효 버스가 없습니다. (운행 종료 또는 방향 미일치)
        </div>
      )}

      <div className="space-y-3">
        {data?.map((bus) => <BusCard key={bus.arrival.routeId} bus={bus} />)}
      </div>
    </div>
  );
}