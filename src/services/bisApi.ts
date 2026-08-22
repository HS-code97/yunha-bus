import type { ArrivalInfo } from '../types/bus';
import { NODE_ID_MAP } from '../config/stations';

/**
 * 국토교통부(TAGO) 버스도착정보조회 서비스 (ArvlInfoInqireService)
 * - 단일 승인 서비스만 사용: getSttnAcctoArvlPrearngeInfoList
 * - 전라남도 광양시 cityCode: 36060
 * - 로컬 개발: Vite proxy(/api/bis) 경유 / 배포: 직접 호출
 */

const API_KEY = import.meta.env.VITE_BIS_API_KEY ?? '';
export const CITY_CODE_GWANGYANG = '36060';

const API_BASE = 'https://apis.data.go.kr';
const USE_PROXY = import.meta.env.DEV;

function buildUrl(params: Record<string, string>): string {
  // ⚠️ serviceKey는 .env의 "원본" 문자열을 그대로 사용해야 함.
  // URLSearchParams/encodeURIComponent를 거치면 +/= 가 이중 인코딩되어
  // SERVICE_KEY_IS_NOT_REGISTERED_ERROR(403) 발생이 확인됨.
  // 나머지 파라미터만 개별 인코딩하여 수동으로 쿼리스트링을 조합한다.
  const qs = Object.entries({ _type: 'json', ...params })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  const path =
    '/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList';
  const full = `${API_BASE}${path}?serviceKey=${API_KEY}&${qs}`;
  return USE_PROXY ? `/api/bis${path}?serviceKey=${API_KEY}&${qs}` : full;
}

async function fetchJson<T>(params: Record<string, string>): Promise<T> {
  const url = buildUrl(params);
  console.info('[TAGO 요청]', url.replace(/serviceKey=[^&]+/, 'serviceKey=***'));
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    console.error('[TAGO 디버그] fetch 실패 (네트워크/CORS/프록시):', e, '\n요청 URL:', url);
    throw e;
  }
  if (!res.ok) {
    let bodyText = '';
    try {
      bodyText = await res.text();
    } catch {
      /* 무시 */
    }
    console.error(
      `[TAGO 디버그] HTTP ${res.status} | 파라미터:`,
      params,
      '| 응답 본문:',
      bodyText.slice(0, 1000),
    );
    throw new Error(`TAGO API 오류: ${res.status} - ${bodyText.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// ---------- 응답 파싱 ----------
interface ArrivalItem {
  nodeid?: string;
  nodenm?: string;
  routeid: string;
  routeno: string;
  arrprevstationcnt: number;
  arrtime: number; // 남은 초
  vehicletp?: string;
}

function parseItems<T>(data: unknown): T[] {
  const resp = (data as { response?: Record<string, unknown> })?.response;
  const header = resp?.header as
    | { resultCode: string; resultMsg: string }
    | undefined;
  if (!header || header.resultCode !== '00') {
    throw new Error(`TAGO 오류 [${header?.resultCode}]: ${header?.resultMsg}`);
  }
  const body = resp?.body as { items?: { item?: unknown } | string } | undefined;
  const items = body?.items;
  if (!items || typeof items === 'string') return [];
  const raw = items.item;
  if (raw === undefined) return [];
  return (Array.isArray(raw) ? raw : [raw]) as T[];
}

// ---------- nodeId 결정 및 학습 캐시 ----------
const NODE_PREFIX_CANDIDATES = ['KYB', ''];
const nodeIdCache = new Map<string, string>();

/** 도착정보 응답에서 학습한 정류소명 캐시 (별도 정류소 API 호출 불필요) */
export const stationNameCache = new Map<string, string>();

/** 마지막 TAGO 응답 원문 (디버그 UI 표출용) */
export let lastRawJson = '';

function learnFromItems(items: ArrivalItem[]): void {
  for (const it of items) {
    if (it.nodeid && it.nodenm) stationNameCache.set(it.nodeid, it.nodenm);
  }
}

/** arsId(7자리) → nodeId. NODE_ID_MAP 우선, 미등록 시 접두사 후보를 적용해 직접 호출하며 성공 시 학습 */
async function resolveNodeId(arsId: string): Promise<string> {
  if (NODE_ID_MAP[arsId]) return NODE_ID_MAP[arsId];
  if (nodeIdCache.has(arsId)) return nodeIdCache.get(arsId)!;

  for (const prefix of NODE_PREFIX_CANDIDATES) {
    const candidate = `${prefix}${arsId}`;
    try {
      const data = await fetchJson<unknown>({
        cityCode: CITY_CODE_GWANGYANG,
        nodeId: candidate,
        numOfRows: '100',
        pageNo: '1',
      });
      const items = parseItems<ArrivalItem>(data);
      learnFromItems(items); // nodenm 학습
      console.info(`[TAGO] nodeId 확정: ${candidate} (${items.length}건)`);
      nodeIdCache.set(arsId, candidate);
      return candidate;
    } catch (e) {
      console.warn(`[TAGO 디버그] nodeId 후보 "${candidate}" 실패:`, e);
    }
  }

  throw new Error(
    `정류소 nodeId 변환 실패: ${arsId}. ` +
      'src/config/stations.ts의 NODE_ID_MAP에 등록해 주세요.',
  );
}

// ---------- 실시간 도착 정보 ----------
/** 정류장 실시간 도착 정보 (nodenm/routeno/arrtime/arrprevstationcnt 직접 파싱) */
export async function fetchArrivals(stationId: string): Promise<ArrivalInfo[]> {
  const nodeId = await resolveNodeId(stationId);
  // test-bus.html 검증 성공 조건과 동일: numOfRows=30, pageNo=1
  const callApi = async (nid: string) => {
    const data = await fetchJson<unknown>({
      cityCode: CITY_CODE_GWANGYANG,
      nodeId: nid,
      numOfRows: '30',
      pageNo: '1',
    });
    lastRawJson = JSON.stringify(data, null, 2);
    console.log('[본앱 TAGO 응답 원본]', data);
    return parseItems<ArrivalItem>(data);
  };

  let items = await callApi(nodeId);

  // Fallback: nodeId 접두어 제거(숫자만)로 1회 재호출
  if (items.length === 0 && /^[A-Z]{3}/.test(nodeId)) {
    const numericId = nodeId.replace(/^[A-Z]{3}/, '');
    console.warn(`[본앱 TAGO] items 비어있음 → Fallback 재호출: nodeId=${numericId}`);
    try {
      items = await callApi(numericId);
    } catch (e) {
      console.warn('[본앱 TAGO] Fallback 호출 실패:', e);
    }
  }

  if (items.length === 0) {
    console.warn('[본앱 TAGO] 최종 items 비어있음:', { nodeId, cityCode: CITY_CODE_GWANGYANG });
  }
  learnFromItems(items);
  return items.map((it) => ({
    routeId: it.routeid,
    routeNo: String(it.routeno),
    direction: 'UP' as const,
    remainingMinutes: Math.floor(it.arrtime / 60),
    remainingSeconds: it.arrtime % 60,
    remainingStops: it.arrprevstationcnt ?? 0,
    crowdedness: undefined,
  }));
}