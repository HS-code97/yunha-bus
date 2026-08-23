/**
 * TAGO 공공데이터포털 API 프록시 (Vercel Serverless Function)
 *
 * /api/bis/* 요청을 https://apis.data.go.kr/* 로 중계한다.
 * - @vercel/node 외부 의존성 없이 표준 Node/Vercel 호환 인터페이스 정의
 * - 쿼리스트링은 원본 그대로 전달하여 특수문자 이중 인코딩 방지
 * - no-store 캐시 제어 헤더를 적용하여 실시간 데이터 보장
 */

interface ServerlessRequest {
  query: Record<string, string | string[] | undefined>;
  url?: string;
  method?: string;
}

interface ServerlessResponse {
  setHeader(name: string, value: string): this;
  status(code: number): this;
  send(body: any): void;
  json(body: any): void;
  end(): void;
}

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  // CORS (동일 오리진 호출이므로 최소한만 허용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const rawPath = Array.isArray(req.query.path)
      ? req.query.path.join('/')
      : String(req.query.path ?? '');

    const target = `https://apis.data.go.kr/${rawPath}`;

    // 원본 쿼리스트링 그대로 전달 (재인코딩 금지)
    const idx = req.url?.indexOf('?') ?? -1;
    const rawQuery = idx >= 0 ? req.url!.slice(idx + 1) : '';

    const upstream = await fetch(`${target}?${rawQuery}`, {
      method: 'GET',
      headers: { Accept: 'application/json, text/xml' },
      cache: 'no-store',
    });

    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    res.setHeader('Content-Type', contentType);
    res.status(upstream.status).send(await upstream.text());
  } catch (e) {
    console.error('[api/bis] 프록시 오류:', e);
    res.status(502).json({ error: 'API 프록시 오류', detail: String(e) });
  }
}
