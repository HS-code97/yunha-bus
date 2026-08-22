import type { ArrivalInfo, OptimalBus } from '../types/bus';
import { DESTINATION, ROUTE_STOPS_MAP } from '../config/stations';
import { resolveDirection, sortByEta } from '../utils/routeFilter';
import * as realApi from './bisApi';
import { MOCK_ARRIVALS, MOCK_ROUTE_STATIONS } from './mockData';

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
 * - 모든 도착 예정 버스를 표출 (필터링으로 목록이 사라지지 않음)
 * - ROUTE_STOPS_MAP에 등록된 노선(집으로 가는 유효 노선)은 recommended=true,
 *   나머지는 recommended=false('일반')로 함께 반환
 * - 정렬: 추천 노선 우선 → ETA 빠른 순
 */
export async function getOptimalBuses(
  originStationId: string,
  // ETA 제한 없음 — TAGO 응답의 모든 도착 예정 버스(88번 등 장시간 후 도착 포함)를 전부 표출
  maxCount = 100,
): Promise<OptimalBus[]> {
  // ETA 필터링 없음: arrtime이 큰(30분 이상 남은) 버스도 그대로 "XX분 XX초"로 표출됨
  const arrivals = sortByEta(await getArrivals(originStationId));

  // routeId별 그룹핑 (같은 노선 여러 대 → 첫 번째가 대표, 두 번째는 nextArrival)
  const byRoute = new Map<string, ArrivalInfo[]>();
  for (const a of arrivals) {
    const list = byRoute.get(a.routeId) ?? [];
    list.push(a);
    byRoute.set(a.routeId, list);
  }

  const results: OptimalBus[] = [];
  for (const [routeId, list] of byRoute) {
    let stopsToDestination: number | null = null;
    let recommended = false;

    // 1) 하드코딩 매핑 우선 (routeId 또는 routeNo 매칭)
    const normalizedNo = normalizeRouteNo(list[0]?.routeNo ?? '');
    if (ROUTE_STOPS_MAP[routeId] != null) {
      stopsToDestination = ROUTE_STOPS_MAP[routeId];
      recommended = true;
    } else if (ROUTE_STOPS_MAP[normalizedNo] != null) {
      stopsToDestination = ROUTE_STOPS_MAP[normalizedNo];
      recommended = true;
    }

    // 2) Mock 모드: 기존 순환 필터링 로직으로 유효 방향 판별
    if (USE_MOCK) {
      const stations = MOCK_ROUTE_STATIONS[routeId] ?? [];
      const dir = resolveDirection(stations, originStationId, DESTINATION.stationId);
      if (dir.valid) {
        stopsToDestination = dir.stopsToDestination;
        recommended = true;
      }
    }

    results.push({
      arrival: list[0],
      stopsToDestination,
      nextArrival: list[1],
      recommended,
    });
  }

  console.log('[본앱 최종 buses 목록]', results);

  // 추천 노선 우선, 그 다음 ETA 순
  results.sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    return (
      a.arrival.remainingMinutes * 60 +
      a.arrival.remainingSeconds -
      (b.arrival.remainingMinutes * 60 + b.arrival.remainingSeconds)
    );
  });

  return results.slice(0, maxCount);
}