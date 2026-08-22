import type { ArrivalInfo, OptimalBus } from '../types/bus';
import { DESTINATION, ROUTE_STOPS_MAP } from '../config/stations';
import { sortByEta } from '../utils/routeFilter';
import * as realApi from './bisApi';
import { MOCK_ARRIVALS, MOCK_ROUTE_STATIONS } from './mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getArrivals(stationId: string): Promise<ArrivalInfo[]> {
  if (USE_MOCK) {
    await delay(200);
    return MOCK_ARRIVALS[stationId] ?? [];
  }
  return realApi.fetchArrivals(stationId);
}

/** 정류소 실제 명칭 — 도착정보 응답에서 학습한 캐시 사용 (별도 API 호출 없음) */
export async function getStationName(stationId: string): Promise<string> {
  if (USE_MOCK) return stationId;
  // nodeId 형태로도 조회 시도
  const cached =
    realApi.stationNameCache.get(stationId) ??
    realApi.stationNameCache.get(`GYB${stationId}`);
  return cached ?? stationId;
}

/**
 * 출발지 → 도착지 최적 버스 목록 조회
 * - 도착정보 응답은 해당 정류장으로 오는 버스만 포함되므로 방향 자체는 안전
 * - "집까지 N정거장" 뱃지는 ROUTE_STOPS_MAP(하드코딩) 기반
 */
export async function getOptimalBuses(
  originStationId: string,
  maxCount = 3,
): Promise<OptimalBus[]> {
  const arrivals = sortByEta(await getArrivals(originStationId));

  // routeId별 그룹핑 (같은 노선 여러 대)
  const byRoute = new Map<string, ArrivalInfo[]>();
  for (const a of arrivals) {
    const list = byRoute.get(a.routeId) ?? [];
    list.push(a);
    byRoute.set(a.routeId, list);
  }

  const results: OptimalBus[] = [];
  for (const [routeId, list] of byRoute) {
    let stopsToDestination = ROUTE_STOPS_MAP[routeId];

    // Mock 모드에서는 기존 순환 필터링 로직 검증 유지
    if (USE_MOCK) {
      const { resolveDirection } = await import('../utils/routeFilter');
      const stations = MOCK_ROUTE_STATIONS[routeId] ?? [];
      const dir = resolveDirection(stations, originStationId, DESTINATION.stationId);
      if (!dir.valid) continue;
      stopsToDestination = dir.stopsToDestination;
    }

    results.push({
      arrival: list[0],
      stopsToDestination: stopsToDestination ?? 0,
      nextArrival: list[1],
    });
  }

  return results.slice(0, maxCount);
}