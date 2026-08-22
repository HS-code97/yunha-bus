# 최종 진단: 키 인코딩 방식 x nodeId 후보 x 도시코드 조합 테스트
import urllib.request, urllib.parse

key = None
with open('.env', encoding='utf-8') as f:
    for line in f:
        if line.startswith('VITE_BIS_API_KEY='):
            key = line.split('=', 1)[1].strip()
print(f'키: {key[:12]}... (길이 {len(key)}, % 포함: {"%" in key})')

BASE = 'https://apis.data.go.kr'

def call(path, params, key_mode):
    p = dict(params)
    if key_mode == 'raw':
        p['serviceKey'] = key
    else:
        p['serviceKey'] = urllib.parse.quote(key, safe='')
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
    ('도시코드목록', '/1613000/ArvlInfoInqireService/getCtyCodeList', {}),
    ('도착 GYB', '/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList',
     {'cityCode': '38070', 'nodeId': 'GYB3280671', 'numOfRows': '5', 'pageNo': '1'}),
    ('도착 원본', '/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList',
     {'cityCode': '38070', 'nodeId': '3280671', 'numOfRows': '5', 'pageNo': '1'}),
]

for name, path, params in tests:
    for mode in ('raw', 'encoded'):
        status, body = call(path, params, mode)
        print()
        print(f'=== {name} [{mode}] → HTTP {status}')
        print(body[:400].replace(chr(10), ' '))