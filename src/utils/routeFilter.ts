import type { ArrivalInfo, RouteStation } from '../types/bus';

/**
 * 순환 노선 방향 판별 및 최단 경유 필터링 유틸
 *
 * 로직:
 * 1. 노선 경유 정류장 목록에서 출발지/도착지의 stationSeq 조회
 * 2. 둘 중 하나라도 없으면 제외
 * 3. 정방향(seq: 출발 < 도착) 경유 정류장 수 = 도착Seq - 출발Seq
 * 4. 역방향(순환 감기, seq: 출발 > 도착) 경유 정류장 수 = 전체정류장 - (출발Seq - 도착Seq)
 * 5. 두 방향 중 최소 경유 정류장 수 방향 선택
 *    - 단, 역방향이 선택되려면 정방향 대비 과도하게 우회하지 않아야 하므로
 *      항상 "최소" 방향만 채택 (반대 방향으로 크게 도는 경우 자동 제외)
 */

export interface DirectionResult {
  valid: boolean;
  stopsToDestination: number; // 선택된 방향의 경유 정류장 수 (출발지 제외, 도착지 포함)
  isReverse: boolean; // 순환 노선에서 역방향(감는 방향) 여부
}

export function resolveDirection(
  routeStations: RouteStation[],
  originStationId: string,
  destStationId: string,
): DirectionResult {
  const origin = routeStations.find((s) => s.stationId === originStationId);
  const dest = routeStations.find((s) => s.stationId === destStationId);

  if (!origin || !dest) {
    return { valid: false, stopsToDestination: 0, isReverse: false };
  }

  const total = routeStations.length;
  const forwardStops = dest.stationSeq - origin.stationSeq; // 정방향 경유 수
  const reverseStops = total - (origin.stationSeq - dest.stationSeq); // 순환 감기 경유 수

  if (forwardStops > 0 && forwardStops <= reverseStops) {
    // 정방향이 유효하고 더 짧거나 같음
    return { valid: true, stopsToDestination: forwardStops, isReverse: false };
  }

  if (reverseStops > 0 && reverseStops < forwardStops) {
    // 순환 노선에서 역방향(감는 방향)이 더 짧은 경우만 채택
    return { valid: true, stopsToDestination: reverseStops, isReverse: true };
  }

  // 정방향으로 도달 불가(출발지가 도착지 뒤)이고 순환 우회도 불가한 경우
  return { valid: false, stopsToDestination: 0, isReverse: false };
}

/** 도착 정보를 남은 시간(초) 기준 오름차순 정렬 */
export function sortByEta(arrivals: ArrivalInfo[]): ArrivalInfo[] {
  return [...arrivals].sort(
    (a, b) =>
      a.remainingMinutes * 60 + a.remainingSeconds -
      (b.remainingMinutes * 60 + b.remainingSeconds),
  );
}