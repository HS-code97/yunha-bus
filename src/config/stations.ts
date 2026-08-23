import type { Station } from '../types/bus';

// 도착지 (집) — 확정된 한글 정류소명
export const DESTINATION: Station = {
  stationId: '3280774',
  name: '와우중흥APT 앞',
};

/**
 * 정류소별 탑승 대상 버스 노선 (해당 정류소에서 집/목적지로 가는 유효 노선)
 * - 사랑병원: 87, 88
 * - 사랑병원 건너: 54
 * - 와우중흥 (집 앞): 87, 88, 54
 */
export const TARGET_ROUTES: Record<string, string[]> = {
  '3280671': ['87', '88'], // 사랑병원 (87, 88번 탑승)
  '3280715': ['54'], // 사랑병원 건너 (54번 탑승)
  '3280774': ['87', '88', '54'], // 와우중흥 (집 앞) (87, 88, 54번 탑승)
};

// 출발지 후보 — 확정된 한글 정류소명
export const ORIGINS: Station[] = [
  { stationId: '3280671', name: '사랑병원' },
  { stationId: '3280715', name: '사랑병원 건너' },
  { stationId: '3280774', name: '와우중흥 (집 앞)' },
];

/** '집에 가기' 통합 비교에 사용되는 두 정류소 */
export const HOME_ORIGINS: Station[] = [ORIGINS[0], ORIGINS[1]];

/**
 * 정류소별 전용 파스텔 컬러 매핑 (탭 활성화 색상 ↔ 카드 뱃지 색상 100% 동기화)
 * - 사랑병원: 따뜻한 코랄/피치 (orange)
 * - 사랑병원 건너: 부드러운 라벤더/퍼플 (purple)
 * - 와우중흥 APT 앞: 싱그러운 민트/그린 (emerald)
 */
export type PastelKey = 'orange' | 'purple' | 'emerald';

export interface PastelTheme {
  badgeBg: string; // 위치 뱃지 배경
  badgeText: string; // 위치 뱃지 텍스트
  badgeBorder: string; // 위치 뱃지 테두리
  border: string; // 탑승 카드 포인트 테두리
  ring: string; // 은은한 링
  tabActiveBg: string; // 서브 탭 활성 배경
  tabActiveText: string; // 서브 탭 활성 텍스트
  softBg: string; // 부드러운 배경 강조
  emoji: string; // 정류소 대표 이모지
  badgeLabel: string; // 뱃지 기본 라벨
  badgeTag?: string; // 강조 태그 ('건너', '집 앞')
}

export const PASTEL_THEMES: Record<PastelKey, PastelTheme> = {
  orange: {
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    border: 'border-rose-300',
    ring: 'ring-rose-100',
    tabActiveBg: 'bg-rose-50',
    tabActiveText: 'text-rose-700',
    softBg: 'bg-rose-50',
    emoji: '🏥',
    badgeLabel: '사랑병원',
  },
  purple: {
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    border: 'border-sky-300',
    ring: 'ring-sky-100',
    tabActiveBg: 'bg-sky-50',
    tabActiveText: 'text-sky-700',
    softBg: 'bg-sky-50',
    emoji: '🚏',
    badgeLabel: '사랑병원',
    badgeTag: '건너편',
  },
  emerald: {
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    border: 'border-emerald-300',
    ring: 'ring-emerald-100',
    tabActiveBg: 'bg-emerald-50',
    tabActiveText: 'text-emerald-700',
    softBg: 'bg-emerald-50',
    emoji: '🏡',
    badgeLabel: '와우중흥',
    badgeTag: '집 앞',
  },
};

export const STATION_COLOR_KEY: Record<string, PastelKey> = {
  '3280671': 'orange', // 사랑병원
  '3280715': 'purple', // 사랑병원 건너
  '3280774': 'emerald', // 와우중흥 APT 앞
};

/**
 * arsId(7자리 정류소 번호) → TAGO nodeId 매핑 테이블.
 * API 조회 없이 즉시 사용할 nodeId를 알고 있다면 여기에 등록하세요.
 * 등록된 값이 우선 사용되며, 없는 경우에만 API 조회로 변환을 시도합니다.
 */
export const NODE_ID_MAP: Record<string, string> = {
  '3280671': 'KYB328010671',
  '3280715': 'KYB328010715',
  '3280774': 'KYB328010774',
};
