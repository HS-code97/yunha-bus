import type { ArrivalInfo, RouteStation } from '../types/bus';
import { NODE_ID_MAP } from '../config/stations';

/**
 * 국토교통부(TAGO) 광역 버스 API 연동 모듈
 * - 전라남도 광양시 cityCode: 38070
 * - 로컬 개발: Vite proxy(/api/bis) 경유
 * - 정적 호스팅(GitHub Pages): 공공데이터포털 직접 호출로 폴백
 */

const API_KEY = import.meta.env.VITE_BIS_API_KEY ?? '';
export const CITY_CODE_GWANGYANG = '38070';

const API_BASE = 'https://apis.data.go.kr';
const USE_PROXY = import.meta.env.DEV; // dev 서버에서만 프록시 사용

function buildUrl(path: string, params: Record<string, string>): string {
  const qs = new URLSearchParams({
    serviceKey: API_KEY,
    _type: 'json',
    ...params,
  });
  const full = `${API_BASE}${path}?${qs.toString()}`;
  return USE_PROXY ? `/api/bis${path}?${qs.toString()}` : full;
}

async function fetchJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(buildUrl(path, params));
  if (!res.ok) {
    // HTTP 에러 시에도 응답 본문(공공데이터포털 에러 코드)을 로그로 출력
    let bodyText = '';
    try {
      bodyText = await res.text();
    } catch {
      /* 무시 */
    }
    console.error(
      `[TAGO 디버그] HTTP ${res.status} ${path}\n요청 파라미터:`,
      params,
      '\n응답 본문:',
      bodyText.slice(0, 1000),
    );
    throw new Error(`TAGO API 오류: ${res.status} - ${bodyText.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// ---------- 응답 래퍼 파싱 ----------
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

// ---------- nodeId 변환 ----------
/**
 * 7자리 정류소 번호(arsId)를 TAGO nodeId로 변환.
 *
 * 변환 순서:
 * 1. stations.ts의 NODE_ID_MAP 하드코딩 매핑 (네트워크 호출 없음)
 * 2. getSttnNoList(nodeNo=arsId) 단건 조회
 * 3. getStopLocationList 전체 목록에서 nodeno/arsId 매칭
 * 4. 접두사 후보(GYB/JNB/GYN/GYS/'') + arsId 조합으로 도착정보 API 유효성 검증
 */
const NODE_PREFIX_CANDIDATES = ['GYB', 'JNB', 'GYN', 'GYS', ''];
const nodeIdCache = new Map<string, string>();

function logApiError(context: string, data: unknown): void {
  console.error(`[TAGO 디버그] ${context} 응답 전문:`, JSON.stringify(data, null, 2));
}

export async function resolveNodeId(arsId: string): Promise<string> {
  // 1) 하드코딩 매핑 테이블 우선
  if (NODE_ID_MAP[arsId]) {
    nodeIdCache.set(arsId, NODE_ID_MAP[arsId]);
    return NODE_ID_MAP[arsId];
  }
  if (nodeIdCache.has(arsId)) return nodeIdCache.get(arsId)!;

  // 2) 정류소 번호(nodeNo)로 단건 검색
  try {
    const data = await fetchJson('/1613000/SttnInfoInqireService/getSttnNoList', {
      cityCode: CITY_CODE_GWANGYANG,
      nodeNo: arsId,
    });
    const items = parseItems<Record<string, unknown>>(data);
    const found = items.find((it) => it.nodeid);
    const nid = found ? String(found.nodeid) : undefined;
    if (nid) {
      console.info(`[TAGO] nodeNo=${arsId} → nodeId=${nid}`);
      nodeIdCache.set(arsId, nid);
      return nid;
    }
    logApiError(`getSttnNoList(nodeNo=${arsId}) 결과 없음`, data);
  } catch (e) {
    console.error(`[TAGO 디버그] getSttnNoList(nodeNo=${arsId}) 호출 실패:`, e);
  }

  // 3) 전체 정류소 목록에서 nodeno 매칭
  try {
    const data = await fetchJson('/1613000/SttnInfoInqireService/getStopLocationList', {
      cityCode: CITY_CODE_GWANGYANG,
      numOfRows: '999',
      pageNo: '1',
    });
    const items = parseItems<Record<string, unknown>>(data);
    const match = items.find(
      (it) =>
        String(it.nodeno ?? '') === arsId ||
        String(it.nodeid ?? '').endsWith(arsId),
    );
    if (match?.nodeid) {
      console.info(`[TAGO] StopLocationList 매칭: ${arsId} → ${match.nodeid}`);
      nodeIdCache.set(arsId, String(match.nodeid));
      return String(match.nodeid);
    }
    logApiError(`getStopLocationList에서 ${arsId} 미매칭`, data);
  } catch (e) {
    console.error(`[TAGO 디버그] getStopLocationList 호출 실패:`, e);
  }

  // 4) 접두사 후보 조합 유효성 검증
  for (const prefix of NODE_PREFIX_CANDIDATES) {
    const candidate = `${prefix}${arsId}`;
    try {
      await fetchJson(
        '/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList',
        {
          cityCode: CITY_CODE_GWANGYANG,
          nodeId: candidate,
          numOfRows: '1',
          pageNo: '1',
        },
      );
      console.info(`[TAGO] 접두사 시도 성공: ${candidate}`);
      nodeIdCache.set(arsId, candidate);
      return candidate;
    } catch (e) {
      console.warn(`[TAGO 디버그] nodeId 후보 "${candidate}" 실패:`, e);
    }
  }

  throw new Error(
    `정류소 nodeId 변환 실패: ${arsId}. ` +
      'src/config/stations.ts의 NODE_ID_MAP에 직접 등록해 주세요 (콘솔의 TAGO 디버그 로그 참고).',
  );
}

// ---------- 정류소 명칭 조회 ----------
interface StopLocationItem {
  nodeid: string;
  nodenm: string;
  nodeno?: string;
}

const stationNameCache = new Map<string, string>();

/** 정류소 ID(nodeId 또는 arsId) → 실제 정류소 이름 */
export async function fetchStationName(stationId: string): Promise<string> {
  if (stationNameCache.has(stationId)) return stationNameCache.get(stationId)!;

  const data = await fetchJson('/1613000/SttnInfoInqireService/getStopLocationList', {
    cityCode: CITY_CODE_GWANGYANG,
    numOfRows: '999',
    pageNo: '1',
  });
  const items = parseItems<StopLocationItem>(data);
  for (const it of items) {
    stationNameCache.set(it.nodeid, it.nodenm);
    if (it.nodeno) stationNameCache.set(String(it.nodeno), it.nodenm);
  }
  return stationNameCache.get(stationId) ?? stationId;
}

// ---------- 실시간 도착 정보 ----------
interface ArrivalItem {
  routeid: string;
  routeno: string;
  arrprevstationcnt: number;
  arrtime: number; // 남은 초
  vehicletp?: string;
  nodeorder?: number;
}

/** 정류장 실시간 도착 정보 */
export async function fetchArrivals(stationId: string): Promise<ArrivalInfo[]> {
  const nodeId = await resolveNodeId(stationId);
  const data = await fetchJson(
    '/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList',
    { cityCode: CITY_CODE_GWANGYANG, nodeId, numOfRows: '30', pageNo: '1' },
  );
  return parseItems<ArrivalItem>(data).map((it) => ({
    routeId: it.routeid,
    routeNo: String(it.routeno),
    direction: 'UP' as const,
    remainingMinutes: Math.floor(it.arrtime / 60),
    remainingSeconds: it.arrtime % 60,
    remainingStops: it.arrprevstationcnt ?? 0,
    crowdedness: undefined,
  }));
}

// ---------- 노선 경유 정류장 ----------
interface RouteStationItem {
  nodeid: string;
  nodenm: string;
  nodeord: number;
}

/** 노선의 전체 경유 정류장 목록 (순번 포함) */
export async function fetchRouteStations(routeId: string): Promise<RouteStation[]> {
  const data = await fetchJson(
    '/1613000/RouteInfoInqireService/getRouteAcctoThrghSttnList',
    { cityCode: CITY_CODE_GWANGYANG, routeId, numOfRows: '200', pageNo: '1' },
  );
  return parseItems<RouteStationItem>(data).map((it) => ({
    routeId,
    stationId: it.nodeid,
    stationName: it.nodenm,
    stationSeq: it.nodeord,
  }));
}