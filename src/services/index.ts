import type { ArrivalInfo, OptimalBus } from '../types/bus';
import { sortByEta } from '../utils/routeFilter';
import * as realApi from './bisApi';
import { MOCK_ARRIVALS } from './mockData';
import { STATION_COLOR_KEY } from '../config/stations';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 노선 번호 정규화: 공백/특수문자 제거 후 비교 (예: " 10번 " → "10") */
export function normalizeRouteNo(no: string): string {
  return no.replace(/[\s\-·.()번]/g, '').trim();
}

export async function getArrivals(stationId: string): Promise<ArrivalInfo[]> {
  if (USE_MOCK) {
    await delay(200);
    return MOCK_ARRIVALS[stationId] ?? [];
  }
  return realApi.fetchArrivals(stationId);
}

/**
 * 정류소 실제 명칭 — 도착정보 응답에서 학습한 캐시 사용 (별도 API 호출 없음).
 * 캐시가 비어 있으면 빈 문자열 반환 → 호출부에서 stations.ts 설정 한글명으로 폴백.
 */
export async function getStationName(stationId: string): Promise<string> {
  if (USE_MOCK) return '';
  const cached =
    realApi.stationNameCache.get(stationId) ??
    realApi.stationNameCache.get(`KYB${stationId}`);
  return cached ?? '';
}

/**
 * 출발지 도착 예정 버스 전체 목록 조회.
 * - 모든 도착 버스를 개별 카드로 표출 (그룹핑/다음버스 개념 제거)
 * - 정렬: ETA 빠른 순
 */
export async function getOptimalBuses(
  originStationId: string,
  maxCount = 100,
  opts?: { stationName?: string; targetRoutes?: string[] },
): Promise<OptimalBus[]> {
  const arrivals = sortByEta(await getArrivals(originStationId));

  const targets = opts?.targetRoutes ?? [];
  const isTarget = (no: string) =>
    targets.some((t) => normalizeRouteNo(t) === normalizeRouteNo(no));

  const results: OptimalBus[] = arrivals.map((a) => ({
    arrival: a,
    stationName: opts?.stationName,
    isTarget: isTarget(a.routeNo),
    colorKey: STATION_COLOR_KEY[originStationId],
  }));

  console.log('[본앱 최종 buses 목록]', results);

  return results.slice(0, maxCount);
}
