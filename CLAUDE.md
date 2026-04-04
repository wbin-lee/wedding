# 💍 개인화 웨딩 청첩장 웹사이트 — CLAUDE.md

## 프로젝트 개요

신랑 **이우빈** & 신부 **이여울**의 웨딩 청첩장 웹사이트.
하객마다 **개인화된 URL**을 통해 접속하며, 자신의 이름이 포함된 맞춤 메시지를 확인할 수 있다.
날씨 반응형 UI, 타임캡슐 메시지 기능을 서브 피처로 포함한다.

---

## 기술 스택 권장

- **Framework**: HTML/CSS/JS (단일 파일) 또는 React (Vite)
- **스타일**: CSS Variables 기반 커스텀 스타일 (Tailwind 병용 가능)
- **애니메이션**: CSS Keyframes + JS IntersectionObserver
- **지도**: 카카오맵 API (또는 정적 iframe 대체)
- **RSVP 저장**: Google Forms (iframe 또는 fetch POST)
- **날씨 API**: OpenWeatherMap (서브 피처)

---

## 디자인 방향

- **톤**: 럭셔리 미니멀 + 감성 필름 무드
- **컬러 팔레트**:
  - Background: `#0a0a0a` (랜딩) / `#faf8f5` (메인)
  - Accent: `#c9a96e` (골드)
  - Text: `#1a1a1a` / `#ffffff`
- **폰트**:
  - Display: `Cormorant Garamond` (영문 제목)
  - 한글 본문: `Noto Serif KR`
  - 캡션/포인트: `Playfair Display`
- **무드**: 어두운 시작 → 밝고 따뜻한 메인으로 전환. 필름 그레인 텍스처 오버레이 적용.

---

## URL 파라미터 구조

```
https://wedding.example.com/?name=김철수
```

URL에는 `name` 파라미터 **하나만** 사용한다.
`msg`, `side` 등 나머지 정보는 서버/클라이언트에서 `guests.json`을 조회하여 가져온다.

### guests.json

프로젝트 루트 또는 `/data/guests.json`에 위치. 하객 목록과 개인화 메시지를 관리하는 단일 소스.

```json
[
  {
    "name": "김철수",
    "msg": "오랜 친구야, 꼭 와줘야 해!",
    "side": "groom"
  },
  {
    "name": "박영희",
    "msg": "네가 와줘야 더 빛날 것 같아 💐",
    "side": "bride"
  },
  {
    "name": "이민준",
    "msg": "멀리서도 와줘서 고마워, 기다릴게.",
    "side": "groom"
  }
]
```

| 필드 | 설명 | 값 |
|---|---|---|
| `name` | 하객 이름 (URL 파라미터와 매칭 키) | 문자열 |
| `msg` | 신랑/신부가 해당 하객에게 남기는 한마디 | 문자열 |
| `side` | 어느 측 하객인지 | `"groom"` / `"bride"` |

### 조회 로직

```js
// 페이지 로드 시 실행
async function loadGuest() {
  const params = new URLSearchParams(window.location.search);
  const nameParam = decodeURIComponent(params.get('name') || '');

  const res = await fetch('/data/guests.json');
  const guests = await res.json();

  const guest = guests.find(g => g.name === nameParam) ?? {
    name: nameParam || '소중한 분',
    msg: '함께해 주셔서 감사합니다.',
    side: 'groom',
  };

  return guest; // { name, msg, side }
}
```

> - `name`이 JSON에 없으면 기본값으로 폴백 (에러 없이 graceful 처리)
> - `guests.json`은 Git에 올리지 않거나 `.gitignore` 처리 권장 (개인정보 보호)
> - 대량 발송 시 스크립트로 URL 자동 생성 가능: `node generate-links.js`

---

## 🎵 BGM 플레이어 (전역 고정)

모든 화면(랜딩 + 메인 전 섹션)의 **우측 상단에 고정**으로 표시되는 BGM 컨트롤러.

### UI 구조

```
[화면 우측 상단 — position: fixed, top: 20px, right: 20px, z-index: 9999]

  재생 중:  ▐▐  (일시정지 아이콘 + 음파 애니메이션)
  정지 중:  ▶   (재생 아이콘)
```

- 버튼은 반투명 원형 (`border-radius: 50%`, `backdrop-filter: blur`)
- 재생 중일 때 버튼 주변에 부드러운 pulse 링 애니메이션
- 재생 중일 때 음표(♪) 아이콘이 위로 떠오르는 파티클 효과 (선택)

### 동작 사양

```js
const bgm = new Audio('/audio/bgm.mp3');
bgm.loop = true;
bgm.volume = 0.4; // 기본 볼륨 40%

// 자동재생 정책 대응: 첫 사용자 인터랙션 후 재생 시도
document.addEventListener('click', () => {
  if (bgm.paused && !userPausedManually) bgm.play();
}, { once: true });

function toggleBGM() {
  if (bgm.paused) {
    bgm.play();
    userPausedManually = false;
  } else {
    bgm.pause();
    userPausedManually = true;
  }
}
```

> **브라우저 자동재생 정책 주의**: 크롬/사파리는 사용자 인터랙션 없이 자동재생을 차단함.
> 첫 번째 클릭/터치 이벤트 이후 BGM을 자동 시작하고, 버튼으로 수동 제어 가능하게 구현.

### 에셋

```
/audio/
  bgm.mp3   — 웨딩 분위기 배경음악 (저작권 무료 권장)
              추천: Pixabay, Free Music Archive, Bensound
              예시 곡풍: 피아노 소품, 어쿠스틱 기타, 오케스트라 발라드
```

### 상태 유지

- `localStorage.getItem('bgm-muted')` 로 음소거 상태 유지
- 페이지 전환(랜딩 → 메인) 시에도 BGM이 끊기지 않도록 Audio 객체를 전역으로 유지

### 🖤 랜딩 화면 (검은 화면 / 전체화면)

접속 시 가장 먼저 표시되는 화면. 이후 "청첩장 보기"를 눌러야 메인 화면으로 전환.

**레이아웃 및 콘텐츠**:
```
[검은 배경 — 필름 그레인 텍스처]

  (타이핑 애니메이션 효과로 등장)

  {{ name }}님,
  우리 결혼합니다 💍

  {{ msg }}

  ────────────────────

  신랑 이우빈  ♡  신부 이여울

  2026년 11월 1일 일요일 오후 3시

  엘타워 6F 그레이스홀

  ────────────────────

  모든 분들을 소중히 모실 수 있도록
  참석 의사를 체크해 주세요.

  [ 청첩장 보기 ]   [ 참석의사 전달하기 ]
```

**애니메이션**:
- 텍스트는 순서대로 fade-in (staggered, 300ms 간격)
- 버튼은 마지막에 slide-up으로 등장
- 배경에 미세한 파티클 또는 별빛 효과 (선택)

**버튼 동작**:
- `청첩장 보기`: 랜딩 화면 fade-out → 메인 화면 fade-in (전체 화면 전환)
- `참석의사 전달하기`: RSVP 모달 오픈

---

### 📋 RSVP 모달

랜딩 화면 및 메인 7섹션에서 공통으로 사용하는 모달 컴포넌트.

**모달 내부 구성**:

```
제목: 참석 의사를 전달해 주세요

① 어느 분의 하객이신가요?
   [신랑측]  [신부측]   ← 토글 버튼

② 참석 가능하신가요?
   [O 참석]  [X 불참]

③ 식사 예정이신가요?
   [O 예정]  [X 불필요]  [미정]

④ 성함
   [ 김철수            ] ← URL name 파라미터 기본값, 수정 가능

⑤ 추가 동행 인원
   [ 0명 ▼ ] ← 드롭다운 (0~5명)

              [ 제출하기 ]
```

**제출 동작**:
- Google Forms의 숨겨진 `<iframe>` 또는 `fetch POST`를 통해 구글 폼으로 데이터 전송
- 제출 완료 시 모달 내부가 감사 메시지로 교체됨:
  ```
  "소중한 마음 감사합니다 💌
   당일 기쁜 마음으로 맞이하겠습니다."
  ```

**Google Forms 연동**:
- 실제 구글 폼 URL과 entry ID를 상수로 선언하여 교체 가능하게 구성
- 예시:
  ```js
  const FORM_URL = 'https://docs.google.com/forms/d/e/XXXXX/formResponse';
  const FIELDS = {
    side: 'entry.111111111',
    attend: 'entry.222222222',
    meal: 'entry.333333333',
    name: 'entry.444444444',
    guests: 'entry.555555555',
  };
  ```

---

## 메인 화면 — 섹션 구성

### 전환 효과
- 섹션 이동 시 **세로 슬라이딩 효과** (translateY 기반 CSS transition)
- 스크롤 스냅 (`scroll-snap-type: y mandatory`) 적용
- 각 섹션은 `height: 100vh` 또는 `min-height: 100vh`
- IntersectionObserver로 섹션 진입 시 내부 요소 순차 애니메이션

---

### 섹션 1 — Hero

**목표**: 첫인상. 감성적이고 아름다운 오프닝.

```
[배경 — 커플 사진 1장, 어둡게 필터 처리]

  (중앙 정렬)

  Woobin  ♡  Yeoul

  2026 . 11 . 01
```

**애니메이션**:
- 사진은 `scale(1.05)` → `scale(1.0)` 천천히 줌아웃 (Kenburns 효과)
- 꽃잎(🌸) 파티클이 화면 전체에서 위→아래로 휘날리는 CSS 애니메이션
  - 꽃잎 이미지: SVG 또는 유니코드 문자 사용 (🌸 🌺 🍃)
  - 20~30개의 개별 `span` 요소, 각기 다른 `animation-duration`, `animation-delay`, `left` 값
- 텍스트는 staggered fade-in

---

### 섹션 2 — Invitation

**목표**: 감성 텍스트 중심. 잔잔한 시와 인사말.

```
[배경 — 크림색 (#faf8f5), 미세한 종이 텍스처]

  (중앙, Cormorant Garamond 이탤릭체)

  "사랑은 오래 참고
   사랑은 온유하며"

  ──────────

  저희 두 사람이 함께하는 새로운 시작에
  귀한 발걸음으로 축복해 주시면 감사하겠습니다.

  이성민 · 김혜련의 아들   신랑 이우빈
  이명재 · 이정희의 딸     신부 이여울
```

**애니메이션**:
- 시 구절: 한 줄씩 fade-in (IntersectionObserver 트리거)
- 인사말/가족소개: 아래에서 fade-up

---

### 섹션 3 — Date

**목표**: 날짜와 카운트다운으로 설렘을 자극.

```
제목: WEDDING DAY

  2026년 11월 1일 일요일 오후 3시
  Sunday, November 1, 2026 · 3:00 PM

  ──────────

  [11월 캘린더 UI]
  Su Mo Tu We Th Fr Sa
   1  2  3  4  5  6  7
  ...
  ( 11/1 셀에 "WEDDING DAY" 배지 표시 )

  ──────────

  D - 209  (실시간 업데이트)
  결혼식까지 209일 남았습니다
```

**구현 포인트**:
- 캘린더는 JS로 동적 렌더링 (hardcode 금지)
- D-Day는 `setInterval(1000)` 또는 마운트 시 1회 계산
- 결혼식 당일이면 "🎉 오늘입니다!" 표시

---

### 섹션 4 — Location

**목표**: 장소 안내 + 지도 + 앱 연동 링크.

```
제목: LOCATION

  엘타워 6F 그레이스홀
  서울특별시 서초구 강남대로 213 (양재동 24)

  [지도 UI — 카카오맵 iframe 또는 정적 지도 이미지]

  [ 네이버지도 ]  [ 티맵 ]  [ 카카오맵 ]
  (각각 딥링크로 연결)

  ──────────

  🅿️ 주차 안내
  주차는 1시간 30분 무료 제공되며,
  이후에는 주차요금이 부과될 수 있는 점 참고하시기 바랍니다.

  🚇 양재역 도보 1분 이내
```

**딥링크 URL**:
```
네이버지도: https://map.naver.com/v5/search/엘타워
티맵:       https://apis.openapi.sk.com/tmap/...  (또는 범용 URL 스킴)
카카오맵:   https://map.kakao.com/?q=엘타워
```

---

### 섹션 5 — Gallery

**목표**: 커플 사진 감상. 부드러운 가로 슬라이더.

```
[전체 너비 슬라이더]

  ← 이전                              다음 →

  [ 사진 1 크게 표시 ]
  이미지 카운터: 3 / 20

  [하단 썸네일 도트 또는 미니 프리뷰 바]
```

**구현 포인트**:
- 사진 20장 (`/images/gallery-01.jpg` ~ `gallery-20.jpg`)
- 터치 스와이프 지원 (touchstart/touchend 이벤트)
- 좌우 버튼 클릭으로 이동
- 슬라이드 전환: CSS `transform: translateX()` 트랜지션

---

### 섹션 6 — 마음전하실 곳

**목표**: 계좌번호 안내 + 간편 송금 연동.

```
제목: 마음전하실 곳

  [ 신랑측 ]  [ 신부측 ]   ← 탭 전환

  ────── 신랑측 ──────

  이우빈
  카카오뱅크 123-456-789012
  [ 계좌번호 복사 ]  [ 카카오 송금 ]  [ 토스 송금 ]

  이성민 (부)
  국민은행 123-45-6789-00
  [ 계좌번호 복사 ]  [ 카카오 송금 ]  [ 토스 송금 ]

  김혜련 (모)
  신한은행 123-456-78901
  [ 계좌번호 복사 ]  [ 카카오 송금 ]  [ 토스 송금 ]
```

**계좌 데이터** (상수로 선언하여 쉽게 수정 가능):
```js
const ACCOUNTS = {
  groom: [
    { name: '이우빈', bank: '카카오뱅크', number: '123-456-789012', kakao: '', toss: '' },
    { name: '이성민', bank: '국민은행',   number: '123-45-6789-00', kakao: '', toss: '' },
    { name: '김혜련', bank: '신한은행',   number: '123-456-78901',  kakao: '', toss: '' },
  ],
  bride: [
    { name: '이여울', bank: '카카오뱅크', number: '000-000-000000', kakao: '', toss: '' },
    { name: '이명재', bank: '하나은행',   number: '000-000-000000', kakao: '', toss: '' },
    { name: '이정희', bank: '우리은행',   number: '000-000-000000', kakao: '', toss: '' },
  ]
};
```

**계좌번호 복사**: `navigator.clipboard.writeText()` + 복사 완료 토스트 알림
**카카오 송금**: `https://qr.kakaopay.com/...` 딥링크
**토스 송금**: `https://toss.me/...` 딥링크

---

### 섹션 7 — RSVP

**목표**: 다시 한번 참석 의사를 받는 섹션. 랜딩 화면과 동일한 정보 + 모달.

```
[배경 — 어두운 톤, 랜딩 화면 분위기 재현]

  {{ name }}님,
  아직 참석 의사를 전달하지 않으셨나요?

  모든 분들을 소중히 모실 수 있도록
  참석 의사를 알려주시면 감사하겠습니다.

  신랑 이우빈  ♡  신부 이여울

              [ 참석의사 전달하기 ]
```

- 랜딩 화면과 동일한 RSVP 모달 재사용
- 이미 제출한 경우 "전달 완료" 상태 표시 (localStorage 활용)

---

### 섹션 8 — Footer

**목표**: 여운을 남기는 마무리.

```
[배경 — 커플 사진 전체화면 (Hero와 다른 사진 권장), 어두운 필터]

  (중앙 하단, 흰색 텍스트)

  "사랑은 두 사람이 서로를 바라보는 것이 아니라,
   함께 같은 방향을 바라보는 것이다."

  — 《어린 왕자》, 앙투안 드 생텍쥐페리

  ────────────────────

  © 2026 Woobin & Yeoul
```

---

## 서브 피처

### 🌦️ 날씨 반응형 테마

**트리거**: 페이지 로드 시 OpenWeatherMap API 호출 (서울 기준)

| 날씨 조건 | 테마 변화 |
|---|---|
| 맑음 (낮) | 기본 골드 테마, 밝은 배경 |
| 비/흐림 | 차분한 블루-그레이 톤, 빗소리 효과(선택) |
| 야간 (20시 이후) | 다크 모드, 별빛 파티클 |
| 결혼식 당일 | D-Day 특별 스플래시 화면 |

```js
const WEATHER_API = 'https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=YOUR_KEY';
```

---

### 💌 타임캡슐 메시지

**위치**: Footer 섹션 바로 위 또는 RSVP 섹션 하단

```
[타임캡슐 영역]

  우리 부부에게 1년 후 전달될 메시지를 남겨주세요 📬

  [ 성함을 입력해주세요... ]
  [ 1년 후의 우빈&여울에게 전하고 싶은 말... ]

              [ 타임캡슐에 담기 ]
```

**구현 방법**:
- Google Forms의 별도 시트로 저장
- 수령 날짜(2027년 11월 1일)에 자동 이메일 발송은 Google Apps Script로 구현 권장
  - Apps Script 코드 예시를 주석으로 포함

---

## 상수 정의 (쉬운 커스터마이징)

파일 상단 또는 별도 `config.js`에 아래 상수 선언:

```js
const WEDDING = {
  groom: '이우빈',
  bride: '이여울',
  groomEn: 'Woobin',
  brideEn: 'Yeoul',
  date: new Date('2026-11-01T15:00:00'),
  dateKo: '2026년 11월 1일 일요일 오후 3시',
  dateEn: 'Sunday, November 1, 2026 · 3:00 PM',
  venue: '엘타워 6F 그레이스홀',
  address: '서울특별시 서초구 강남대로 213 (양재동 24)',
  parking: '주차는 1시간 30분 무료 제공되며, 이후에는 주차요금이 부과될 수 있습니다.',
  transit: '양재역 도보 1분 이내',
};

const RSVP_FORM = {
  url: 'https://docs.google.com/forms/d/e/REPLACE_ME/formResponse',
  fields: {
    name:   'entry.000000001',
    side:   'entry.000000002',
    attend: 'entry.000000003',
    meal:   'entry.000000004',
    guests: 'entry.000000005',
  }
};
```

---

## 에셋 구조

```
/data/
  guests.json       — 하객 개인화 정보 (name / msg / side)

/audio/
  bgm.mp3           — 배경음악 (loop)

/images/
  hero.jpg          — 히어로 섹션 커플 사진 (1장)
  footer.jpg        — 푸터 전체화면 사진 (1장, hero와 다른 컷)
  gallery-01.jpg    — 갤러리 (20장)
  ...
  gallery-20.jpg
  petal.svg         — 꽃잎 SVG (애니메이션용)

/scripts/
  generate-links.js — guests.json 읽어서 개인화 URL 목록 출력 스크립트
```

### generate-links.js 예시

```js
// node generate-links.js 실행 시 각 하객별 URL 출력
const guests = require('./data/guests.json');
const BASE_URL = 'https://wedding.example.com';

guests.forEach(g => {
  const url = `${BASE_URL}/?name=${encodeURIComponent(g.name)}`;
  console.log(`${g.name}\t${url}`);
});
// 출력 결과를 복사해서 카카오톡/문자 발송에 활용
```

---

## 반응형 브레이크포인트

```css
/* 모바일 우선 */
:root { --max-width: 100%; }

@media (min-width: 768px) {
  /* 태블릿: 여백 추가, 폰트 크기 확대 */
}

@media (min-width: 1280px) {
  /* 데스크탑: 최대 너비 제한, 2컬럼 레이아웃 일부 적용 */
  :root { --max-width: 960px; }
}
```

---

## 접근성 & 성능

- 모든 이미지에 `alt` 속성 필수
- 버튼/링크에 `aria-label` 적용 (BGM 버튼: `aria-label="배경음악 재생"` / `"배경음악 일시정지"`)
- BGM 버튼은 키보드 포커스 가능 (`tabindex="0"`)
- 폰트는 Google Fonts `display=swap`으로 로드
- 갤러리 이미지는 lazy loading (`loading="lazy"`)
- RSVP 제출 중 버튼 disabled 처리 + 로딩 스피너
- `guests.json` fetch 실패 시 기본값 폴백 처리 필수 (네트워크 오류 대응)

---

## 구현 순서 권장

1. `guests.json` 데이터 구조 설계 + `loadGuest()` 유틸 함수
2. BGM 플레이어 전역 컴포넌트 (fixed 버튼)
3. 랜딩 화면 + 기본 레이아웃
4. RSVP 모달 (공통 컴포넌트)
5. 메인 화면 섹션별 구현 (1→8 순서)
6. 섹션 전환 슬라이딩 효과
7. 꽃잎 애니메이션
8. Google Forms 연동
9. 날씨 API 연동 (서브)
10. 타임캡슐 (서브)
11. `generate-links.js` URL 생성 스크립트 작성
12. 반응형 QA + 크로스브라우저 테스트