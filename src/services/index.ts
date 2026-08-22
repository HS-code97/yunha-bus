import type { ArrivalInfo, OptimalBus, RouteStation } from '../types/bus';
import { DESTINATION } from '../config/stations';
import { resolveDirection, sortByEta } from '../utils/routeFilter';
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

export async function getRouteStations(routeId: string): Promise<RouteStation[]> {
  if (USE_MOCK) {
    await delay(100);
    return MOCK_ROUTE_STATIONS[routeId] ?? [];
  }
  return realApi.fetchRouteStations(routeId);
}

/** 정류소 실제 명칭 조회 (Mock 모드에서는 설정값 반환) */
export async function getStationName(stationId: string): Promise<string> {
  if (USE_MOCK) return stationId;
  return realApi.fetchStationName(stationId);
}

/**
 * 출발지 → 도착지 최적 버스 목록 조회
 * 1. 정류장 실시간 도착 정보 조회
 * 2. 각 노선의 경유 정류장 목록으로 방향 검증/최단 구간 필터링
 * 3. ETA 기준 정렬 후 상위 N개 반환
 */
export async function getOptimalBuses(
  originStationId: string,
  maxCount = 3,
): Promise<OptimalBus[]> {
  const arrivals = sortByEta(await getArrivals(originStationId));

  // routeId별로 그룹핑 (같은 노선 여러 대 도착)
  const byRoute = new Map<string, ArrivalInfo[]>();
  for (const a of arrivals) {
    const list = byRoute.get(a.routeId) ?? [];
    list.push(a);
    byRoute.set(a.routeId, list);
  }

  const results: OptimalBus[] = [];
  for (const [routeId, list] of byRoute) {
    const stations = await getRouteStations(routeId);
    const dir = resolveDirection(stations, originStationId, DESTINATION.stationId);
    if (!dir.valid) continue; // 순환 오탑승 방지: 유효하지 않은 방향 제외

    results.push({
      arrival: list[0],
      stopsToDestination: dir.stopsToDestination,
      nextArrival: list[1],
    });
  }

  return results.slice(0, maxCount);
}