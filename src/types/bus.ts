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

// 버스 카드 데이터 (전체 표출, 추천 개념 없음)
export interface OptimalBus {
  arrival: ArrivalInfo;
  nextArrival?: ArrivalInfo; // 다음 도착 예정 버스
  stationName?: string; // 탑승 위치 라벨 ('집에 가기' 통합 뷰에서 표시)
  isTarget?: boolean; // 탑승 대상 버스 여부 (카드 강조)
  colorKey?: 'orange' | 'purple' | 'emerald'; // 정류소 전용 파스텔 컬러
}
