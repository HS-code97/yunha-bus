# TAGO 오퍼레이션명 변형 탐색
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
    ('도착정보 Inqire', '/1613000/BusArrivalInfoInqireService/getSttnAcctoArvlPrearngeInfoList',
     {'cityCode': '38070', 'nodeId': 'GYB3280671'}),
    ('도착정보 Service(구경로)', '/1613000/BusArrivalInfoService/getSttnAcctoArvlPrearngeInfoList',
     {'cityCode': '38070', 'nodeId': 'GYB3280671'}),
    ('정류소목록 Inqire', '/1613000/BusSttnInfoInqireService/getStopLocationList',
     {'cityCode': '38070'}),
]

for name, path, params in candidates:
    status, body = call(path, params)
    print()
    print(f'=== {name} → HTTP {status}')
    print(body[:400].replace(chr(10), ' '))