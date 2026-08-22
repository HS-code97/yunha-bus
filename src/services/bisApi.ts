import type { ArrivalInfo, RouteStation } from '../types/bus';

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
  if (!res.ok) throw new Error(`TAGO API 오류: ${res.status}`);
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
 * TAGO nodeId 형식은 지역별 접두사 + arsId (예: 광양시 "GYB3280671").
 * 접두사 후보들을 순차 시도하여 실제 존재하는 nodeId를 찾아 캐싱.
 */
const NODE_PREFIX_CANDIDATES = ['GYB', 'GYN', ''];
const nodeIdCache = new Map<string, string>();

export async function resolveNodeId(arsId: string): Promise<string> {
  if (nodeIdCache.has(arsId)) return nodeIdCache.get(arsId)!;

  // 먼저 정류소 목록에서 arsId로 nodeid 직접 검색
  try {
    const data = await fetchJson(
      '/1613000/BusSttnInfoInqireService/getSttnNoList',
      { cityCode: CITY_CODE_GWANGYANG, nodeNo: arsId },
    );
    const items = parseItems<{ nodeid: string }>(data);
    if (items.length > 0 && items[0].nodeid) {
      nodeIdCache.set(arsId, items[0].nodeid);
      return items[0].nodeid;
    }
  } catch {
    // 폴백으로 진행
  }

  // 접두사 후보 조합으로 nodeId 추정
  for (const prefix of NODE_PREFIX_CANDIDATES) {
    const candidate = `${prefix}${arsId}`;
    try {
      await fetchJson('/1613000/BusArrivalInfoService/getSttnAcctoArvlPrearngeInfoList', {
        cityCode: CITY_CODE_GWANGYANG,
        nodeId: candidate,
        numOfRows: '1',
      });
      nodeIdCache.set(arsId, candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error(`정류소 nodeId 변환 실패: ${arsId}`);
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

  const data = await fetchJson(
    '/1613000/BusSttnInfoInqireService/getStopLocationList',
    { cityCode: CITY_CODE_GWANGYANG, numOfRows: '999' },
  );
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
    '/1613000/BusArrivalInfoService/getSttnAcctoArvlPrearngeInfoList',
    { cityCode: CITY_CODE_GWANGYANG, nodeId },
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
    '/1613000/BusRouteInfoInqireService/getRouteAcctoThrghSttnList',
    { cityCode: CITY_CODE_GWANGYANG, routeId, numOfRows: '200' },
  );
  return parseItems<RouteStationItem>(data).map((it) => ({
    routeId,
    stationId: it.nodeid,
    stationName: it.nodenm,
    stationSeq: it.nodeord,
  }));
}