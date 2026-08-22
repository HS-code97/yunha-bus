import type { ArrivalInfo, Route, RouteStation } from '../types/bus';

/**
 * Mock 데이터셋
 * - 순환 노선 케이스를 의도적으로 포함:
 *   - R-100: 출발지(3280671) seq 3 → 도착지(3280744) seq 7 (정방향, 최단)
 *   - R-200: 순환 노선. 정방향으로는 12정거장, 역방향(순환 감기)으로는 2정거장.
 *            → 역방향이 최단이므로 역방향만 유효로 판정되어야 함.
 *   - R-300: 도착지가 노선에 없음 → 제외되어야 함.
 */

export const MOCK_ROUTES: Route[] = [
  {
    routeId: 'R-100',
    routeNo: '720-3',
    routeType: '일반',
    startStationName: '터미널',
    endStationName: '윤하마을',
  },
  {
    routeId: 'R-200',
    routeNo: '순환01',
    routeType: '순환',
    startStationName: '윤하마을',
    endStationName: '윤하마을',
  },
  {
    routeId: 'R-300',
    routeNo: '55',
    routeType: '일반',
    startStationName: '시청',
    endStationName: '공원',
  },
];

// 노선별 경유 정류장 목록 (stationSeq 포함)
export const MOCK_ROUTE_STATIONS: Record<string, RouteStation[]> = {
  'R-100': [
    { routeId: 'R-100', stationId: '3280600', stationName: '터미널', stationSeq: 1 },
    { routeId: 'R-100', stationId: '3280650', stationName: '중앙로', stationSeq: 2 },
    { routeId: 'R-100', stationId: '3280671', stationName: '자주 가는 곳 1', stationSeq: 3 },
    { routeId: 'R-100', stationId: '3280700', stationName: '한빛교', stationSeq: 4 },
    { routeId: 'R-100', stationId: '3280715', stationName: '자주 가는 곳 2', stationSeq: 5 },
    { routeId: 'R-100', stationId: '3280730', stationName: '은하수공원', stationSeq: 6 },
    { routeId: 'R-100', stationId: '3280744', stationName: '집', stationSeq: 7 },
  ],
  // 순환 노선: 정방향으론 멀고, 역방향(순환 감기)으론 가까움
  'R-200': [
    { routeId: 'R-200', stationId: '3280744', stationName: '집', stationSeq: 1 },
    { routeId: 'R-200', stationId: '3280671', stationName: '자주 가는 곳 1', stationSeq: 2 },
    { routeId: 'R-200', stationId: '3280801', stationName: '북부시장', stationSeq: 3 },
    { routeId: 'R-200', stationId: '3280802', stationName: '도서관', stationSeq: 4 },
    { routeId: 'R-200', stationId: '3280803', stationName: '체육관', stationSeq: 5 },
    { routeId: 'R-200', stationId: '3280804', stationName: '병원', stationSeq: 6 },
    { routeId: 'R-200', stationId: '3280805', stationName: '남산터널', stationSeq: 7 },
    { routeId: 'R-200', stationId: '3280806', stationName: '강변로', stationSeq: 8 },
    { routeId: 'R-200', stationId: '3280807', stationName: '수변공원', stationSeq: 9 },
    { routeId: 'R-200', stationId: '3280808', stationName: '백화점', stationSeq: 10 },
    { routeId: 'R-200', stationId: '3280809', stationName: '역전로', stationSeq: 11 },
    { routeId: 'R-200', stationId: '3280810', stationName: '문화회관', stationSeq: 12 },
    { routeId: 'R-200', stationId: '3280811', stationName: '중앙상가', stationSeq: 13 },
    { routeId: 'R-200', stationId: '3280812', stationName: '종점', stationSeq: 14 },
  ],
  'R-300': [
    { routeId: 'R-300', stationId: '3280671', stationName: '자주 가는 곳 1', stationSeq: 2 },
    { routeId: 'R-300', stationId: '3280901', stationName: '시장입구', stationSeq: 3 },
  ],
};

// 정류장별 실시간 도착 정보
export const MOCK_ARRIVALS: Record<string, ArrivalInfo[]> = {
  // 자주 가는 곳 1 (3280671)
  '3280671': [
    {
      routeId: 'R-100',
      routeNo: '720-3',
      direction: 'UP',
      remainingMinutes: 3,
      remainingSeconds: 20,
      remainingStops: 2,
      crowdedness: 'SEAT',
    },
    {
      routeId: 'R-100',
      routeNo: '720-3',
      direction: 'UP',
      remainingMinutes: 12,
      remainingSeconds: 0,
      remainingStops: 9,
      crowdedness: 'STAND',
    },
    {
      routeId: 'R-200',
      routeNo: '순환01',
      direction: 'CIRCULAR',
      remainingMinutes: 5,
      remainingSeconds: 45,
      remainingStops: 1,
      crowdedness: 'STAND',
    },
    {
      routeId: 'R-300',
      routeNo: '55',
      direction: 'UP',
      remainingMinutes: 2,
      remainingSeconds: 10,
      remainingStops: 1,
      crowdedness: 'CROWDED',
    },
  ],
  // 자주 가는 곳 2 (3280715)
  '3280715': [
    {
      routeId: 'R-100',
      routeNo: '720-3',
      direction: 'UP',
      remainingMinutes: 1,
      remainingSeconds: 30,
      remainingStops: 1,
      crowdedness: 'SEAT',
    },
    {
      routeId: 'R-100',
      routeNo: '720-3',
      direction: 'UP',
      remainingMinutes: 10,
      remainingSeconds: 15,
      remainingStops: 7,
      crowdedness: 'STAND',
    },
  ],
};