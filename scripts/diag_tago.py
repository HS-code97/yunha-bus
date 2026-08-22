# TAGO API 진단 스크립트: 400 응답 본문의 에러 코드 확인
import urllib.request, urllib.parse, json, sys

# .env에서 키 읽기
key = None
with open('.env', encoding='utf-8') as f:
    for line in f:
        if line.startswith('VITE_BIS_API_KEY='):
            key = line.split('=', 1)[1].strip()
if not key:
    sys.exit('.env에 VITE_BIS_API_KEY 없음')
print(f'키(앞10자): {key[:10]}... 길이={len(key)}')

BASE = 'https://apis.data.go.kr'

def call(path, params, encode_key):
    p = dict(params)
    p['serviceKey'] = urllib.parse.quote(key, safe='') if encode_key else key
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

tests = [
    ('getStopLocationList', '/1613000/BusSttnInfoInqireService/getStopLocationList',
     {'cityCode': '38070', 'numOfRows': '5', 'pageNo': '1'}),
    ('getSttnNoList', '/1613000/BusSttnInfoInqireService/getSttnNoList',
     {'cityCode': '38070', 'nodeNo': '3280671'}),
    ('도착정보 GYB', '/1613000/BusArrivalInfoService/getSttnAcctoArvlPrearngeInfoList',
     {'cityCode': '38070', 'nodeId': 'GYB3280671', 'numOfRows': '3', 'pageNo': '1'}),
]

for name, path, params in tests:
    for enc in (True, False):
        status, body = call(path, params, enc)
        enc_label = 'encoded' if enc else 'raw'
        snippet = body[:300].replace(chr(10), ' ')
        print()
        print(f'=== {name} [{enc_label}] → HTTP {status}')
        print(snippet)
