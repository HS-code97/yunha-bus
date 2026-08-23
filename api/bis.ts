interface ServerlessRequest {
  url?: string;
  method?: string;
  query?: any;
}

interface ServerlessResponse {
  setHeader(name: string, value: string): this;
  statusCode?: number;
  end(data?: string): void;
}

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse,
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    const rawUrl = req.url || '';
    const cleanPath = rawUrl.replace(/^\/api\/bis\/?/, '');
    const targetUrl = `https://apis.data.go.kr/${cleanPath}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/xml, */*',
        'User-Agent': 'Mozilla/5.0',
      },
      cache: 'no-store',
    });

    const contentType =
      response.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    res.statusCode = response.status;

    const data = await response.text();
    res.end(data);
  } catch (error: any) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        error: 'Proxy Gateway Error',
        message: error?.message,
      }),
    );
  }
}
