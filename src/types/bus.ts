// 정류장 정보
export interface Station {
  stationId: string;
  name: string;
}

// 노선 정보
export interface Route {
  routeId: string;
  routeNo: string; // 버스 번호 (예: 720-3)
  routeType: string; // 일반/직행/순환 등
  startStationName: string;
  endStationName: string;
}

// 노선의 경유 정류장 (순번 포함)
export interface RouteStation {
  routeId: string;
  stationId: string;
  stationName: string;
  stationSeq: number; // 정류소 순번
}

// 실시간 도착 정보
export interface ArrivalInfo {
  routeId: string;
  routeNo: string;
  direction: 'UP' | 'DOWN' | 'CIRCULAR';
  remainingMinutes: number; // 남은 시간(분)
  remainingSeconds: number; // 남은 시간(초, 분에 더해짐)
  remainingStops: number; // 남은 정류장 수
  vehiclePlate?: string;
  crowdedness?: 'SEAT' | 'STAND' | 'CROWDED';
}

// 최적 버스 카드 데이터 (전체 표출 + 추천 플래그)
export interface OptimalBus {
  arrival: ArrivalInfo;
  stopsToDestination: number | null; // 출발지 → 도착지 경유 정류장 수 (미확정 시 null)
  nextArrival?: ArrivalInfo; // 다음 도착 예정 버스
  recommended: boolean; // 집으로 가는 유효 노선 여부 ('추천' 뱃지)
}
