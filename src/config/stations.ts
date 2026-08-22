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

/**
 * arsId(7자리 정류소 번호) → TAGO nodeId 매핑 테이블.
 * API 조회 없이 즉시 사용할 nodeId를 알고 있다면 여기에 등록하세요.
 * (예: '3280671': 'GYB3280671')
 * 등록된 값이 우선 사용되며, 없는 경우에만 API 조회로 변환을 시도합니다.
 */
export const NODE_ID_MAP: Record<string, string> = {
  // '3280671': 'GYB3280671',
  // '3280715': 'GYB3280715',
  // '3280744': 'GYB3280744',
};
