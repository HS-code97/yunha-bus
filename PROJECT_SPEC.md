# [윤하 버스 (yunha-bus)] 전체 아키텍처, UI 명세, 매핑 규칙 및 트러블슈팅 최종 인수인계 명세서 (최종 확정본)

### 1. 기본 인프라 및 프로젝트 메타 정보
* 프로젝트명: 윤하 버스 (`yunha-bus`)
* GitHub 원격 저장소: `https://github.com/HS-code97/yunha-bus.git` (Account: `HS-code97`, Main Branch: `main`)
* 배포 호스팅: Vercel (Hobby Tier, Workspace: `code97`, Production Domain: `https://yunha-bus.vercel.app`)
* 프레임워크 및 스택: React + TypeScript + Vite + Tailwind CSS + PWA
* 데이터 출처: 국토교통부 버스도착정보 목록 조회 (TAGO) API (전남 광양시 BIS)

### 2. 정류장별 버스 탑승(강조) 매핑 규칙 (최종 확정)
* 🚏 사랑병원 건너 정류장 (`3280715`): `87`, `88` (탑승 강조 대상)
* 🏥 사랑병원 정류장 (`3280671`): `54` (탑승 강조 대상)
* 🏡 와우중흥 (집 앞) 정류장 (`3280774`): `87`, `88`, `54` (세 버스 모두 탑승 강조 대상)
* 🏠 집에 가기 (통합 비교) 탭: 사랑병원 건너(`87`, `88`) + 사랑병원(`54`) 통합 표출 (위 세 버스를 우선 비교)

### 3. UI/UX 디자인 및 렌더링 규칙
* 컬러 테마 (보라색 계열 전면 배제, 웜 파스텔 적용):
  * 전체 앱 배경: 부드러운 웜 아이보리/크림 (`#FDFBF7`)
  * 헤더 앱 아이콘: 좌측 버스 아이콘 배경을 웜 레몬/버터 옐로우(`bg-amber-100`)로 설정
  * 앱 설치 아이콘(PWA/iOS): 소프트 피치(#ffd6bf) → 코랄(#fdbab0) 그라데이션 + 흰색 버스 몸체 (iOS: 180×180 투명도 없는 풀블리드 사각)
  * `🏠 집에 가기 (통합 비교)` 메인 탭: 소프트 버터 옐로우/따뜻한 망고 톤 (`bg-amber-400 text-amber-950 font-bold shadow-sm`)
  * 정류소 전용 테마 톤:
    * 사랑병원 (상행): 소프트 로즈/코랄 (`bg-rose-50 text-rose-700 border-rose-200`)
    * 사랑병원 건너 (하행): 소프트 스카이블루/아쿠아 (`bg-sky-50 text-sky-700 border-sky-200`)
    * 와우중흥 (집 앞): 소프트 세이지 그린 (`bg-emerald-50 text-emerald-700 border-emerald-200`)
* 목록 정렬 및 렌더링 (방식 A - ETA 빠른 순 단일 스트림):
  * 탑승 버스와 일반 버스를 별도 그룹으로 쪼개지 않고, 도착 예정 시간(`arrtime` 오름차순, 빠른 순) 단 하나로만 일렬 정렬.
  * 탑승 대상 버스 (`isTarget === true`): 큼직한 강조 카드 + 좌측 정류장 식별 사각 박스 + `탑승` 뱃지 + 볼드 잔여 시간.
  * 일반 버스 (`isTarget === false`): 얇은 컴팩트 슬림 행으로 렌더링하여 시간 순서 사이에 자연스럽게 배치.
* 상단 새로고침 UI:
  * 모바일 터치가 편한 가로형 캡슐 버튼 (`🔄 새로고침`, `bg-amber-100 text-amber-900 border border-amber-300`).
* 실시간 1초 카운트다운(Tick) 타이머:
  * `useCountdown` 커스텀 훅(`setInterval` + `Date.now()` 보정)을 통해 30초 API 폴링 사이에도 남은 초가 매초 1씩 줄어들며, 0초 도달 시 "곧 도착"으로 매끄럽게 전환.

### 4. API 통신 장애 분석 및 해결 아키텍처 (핵심 트러블슈팅)
1. Vercel Serverless Function Proxy (`api/bis/[...path].ts`):
   * `@vercel/node` 의존성을 제거하고 독립 인터페이스(`ServerlessRequest` / `ServerlessResponse`)로 빌드 에러 원천 차단.
   * 프론트엔드가 `/api/bis/...`로 요청하면 `https://apis.data.go.kr`로 fetch 중계.
   * 핵심 로직: URL 쿼리스트링을 Node.js에서 재인코딩하지 않고 클라이언트가 보낸 원본 원시 쿼리스트링(`req.url`의 raw query)을 그대로 붙여 중계하여 특수문자 변형 방지.
2. 캐시 완벽 차단:
   * `src/services/bisApi.ts`: 요청 URL에 타임스탬프(`&_t=${Date.now()}`) 첨부 및 `cache: 'no-store'` 적용.
   * `api/bis/[...path].ts`: 응답 헤더에 `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate` 적용.
3. `vercel.json` 설정:
   * API rewrite를 제거하고 SPA 라우팅 폴백만 유지 (`/((?!api/.*).*)` ➔ `/index.html`).
4. Vercel 환경 변수:
   * `VITE_BIS_API_KEY`: 공공데이터포털 인증키(Encoding) 문자열
   * `VITE_USE_MOCK`: `false`
