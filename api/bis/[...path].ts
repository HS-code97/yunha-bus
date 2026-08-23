import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * TAGO 공공데이터포털 API 프록시 (Vercel Serverless Function)
 *
 * /api/bis/* 요청을 https://apis.data.go.kr/* 로 중계한다.
 * - 쿼리스트링은 파싱/재인코딩하지 않고 원본(raw) 그대로 전달하여
 *   serviceKey의 +, /, = 특수문자가 이중 인코딩으로 깨지는 문제를 방지
 *   (403 SERVICE_KEY_IS_NOT_REGISTERED_ERROR 해결)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS (동일 오리진 호출이므로 최소한만 허용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
    });

    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    res.setHeader('Content-Type', contentType);
    res.status(upstream.status).send(await upstream.text());
  } catch (e) {
    console.error('[api/bis] 프록시 오류:', e);
    res.status(502).json({ error: 'API 프록시 오류', detail: String(e) });
  }
}