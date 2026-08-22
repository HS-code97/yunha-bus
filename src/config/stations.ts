import type { Station } from '../types/bus';

// 도착지 (집) — 확정된 한글 정류소명
export const DESTINATION: Station = {
  stationId: '3280744',
  name: '와우중흥APT 건너',
};

// 출발지 후보 (자주 가는 곳) — 확정된 한글 정류소명
export const ORIGINS: Station[] = [
  { stationId: '3280671', name: '사랑병원 (성호2차·와우 방면)' },
  { stationId: '3280715', name: '사랑병원 (중마고·광영 방면)' },
];

/**
 * arsId(7자리 정류소 번호) → TAGO nodeId 매핑 테이블.
 * API 조회 없이 즉시 사용할 nodeId를 알고 있다면 여기에 등록하세요.
 * (예: '3280671': 'KYB3280671')
 * 등록된 값이 우선 사용되며, 없는 경우에만 API 조회로 변환을 시도합니다.
 */
export const NODE_ID_MAP: Record<string, string> = {
  '3280671': 'KYB328010671',
  '3280715': 'KYB328010715',
  '3280744': 'KYB328010744',
};

/**
 * 노선 번호(routeNo) 또는 노선ID(routeId) → 출발지(사랑병원 3280671)→도착지(와우중흥APT 건너 3280744) 경유 정류장 수 매핑.
 * - 88번 버스가 유효 추천 노선으로 즉시 인식되도록 '88' 및 광양시 88번 routeId 패턴 등록
 */
export const ROUTE_STOPS_MAP: Record<string, number> = {
  '88': 4,
  'GYS3030088': 4,
  'GYS30300880': 4,
  'GYS30300881': 4,
  'GYS30300882': 4,
};
