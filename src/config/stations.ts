import type { Station } from '../types/bus';

// 도착지 (집) — name은 API 조회 전 임시값, 조회 후 실제 정류소명으로 교체
export const DESTINATION: Station = {
  stationId: '3280744',
  name: '집',
};

// 출발지 후보 (자주 가는 곳) — name은 로딩 스켈레톤/ID 폴백용
export const ORIGINS: Station[] = [
  { stationId: '3280671', name: '...' },
  { stationId: '3280715', name: '...' },
];