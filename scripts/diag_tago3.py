# 키에 등록된 서비스 탐색: 여러 후보 엔드포인트 프로브
import urllib.request, urllib.parse

key = None
with open('.env', encoding='utf-8') as f:
    for line in f:
        if line.startswith('VITE_BIS_API_KEY='):
            key = line.split('=', 1)[1].strip()

BASE = 'https://apis.data.go.kr'

def call(path, params):
    p = dict(params)
    p['serviceKey'] = urllib.parse.quote(key, safe='')
    p['_type'] = 'json'
    url = f'{BASE}{path}?{urllib.parse.urlencode(p)}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')
    except Exception as e:
        return -1, str(e)

candidates = [
    ('TAGO 도착정보 v2', '/1613000/BusArrivalInfoService2/getSttnAcctoArvlPrearngeInfoList',
     {'cityCode': '38070', 'nodeId': 'GYB3280671'}),
    ('TAGO 노선정보', '/1613000/BusRouteInfoInqireService/getRouteNoList',
     {'cityCode': '38070'}),
    ('전남 BIS 도착정보', '/6410000/busarrivalservice/getBusArrivalList',
     {'stationId': '3280671'}),
    ('전남 BIS 정류소', '/6410000/busstationservice/getStationList',
     {}),
]

for name, path, params in candidates:
    status, body = call(path, params)
    print()
    print(f'=== {name} → HTTP {status}')
    print(body[:400].replace(chr(10), ' '))