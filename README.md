# 💍 우빈 ♡ 여울 웨딩 청첩장

하객마다 개인화된 URL(`?name=김철수`)로 접속하면 맞춤 메시지가 표시되는 웨딩 청첩장 웹사이트입니다.

## 시작하기

정적 HTML/CSS/JS 프로젝트이므로 별도 빌드 없이 웹 서버로 바로 실행할 수 있습니다.

```bash
# VS Code Live Server, Python, npx 등 아무 정적 서버 사용
npx serve .
# 또는
python -m http.server 8000
```

브라우저에서 `http://localhost:8000/?name=김철수` 로 접속하면 개인화된 청첩장을 확인할 수 있습니다.

## 설정

### 1. 하객 목록 (`data/guests.json`)

```json
[
  { "name": "김철수", "msg": "오랜 친구야, 꼭 와줘야 해!", "side": "groom" },
  { "name": "박영희", "msg": "네가 와줘야 더 빛날 것 같아 💐", "side": "bride" }
]
```

> `guests.json`은 개인정보 보호를 위해 `.gitignore`에 포함되어 있습니다.

### 2. 에셋 준비

```
images/hero.jpg          — 히어로 배경 사진
images/footer.jpg        — 푸터 배경 사진
images/gallery-01~20.jpg — 갤러리 사진 (20장)
audio/bgm.mp3            — 배경음악
```

### 3. Google Forms 연동 (`js/config.js`)

`RSVP_FORM.url`과 `RSVP_FORM.fields`의 `REPLACE_ME` / `entry.000000001` 값을 실제 Google Forms URL과 entry ID로 교체하세요. 타임캡슐(`TIMECAPSULE_FORM`)도 동일합니다.

### 4. 계좌 정보 (`js/config.js`)

`ACCOUNTS` 객체에서 실제 계좌번호, 카카오페이/토스 송금 링크를 입력하세요.

### 5. 날씨 API (선택)

`js/config.js`의 `WEATHER_API_KEY`에 [OpenWeatherMap](https://openweathermap.org/api) API 키를 입력하면 날씨 반응형 테마가 활성화됩니다. 미입력 시 기본 테마로 동작합니다.

## 개인화 URL 일괄 생성

```bash
node scripts/generate-links.js
```

`guests.json`의 모든 하객에 대해 개인화 URL을 출력합니다. 카카오톡/문자 발송에 활용하세요.

```bash
# 도메인 지정
BASE_URL=https://mydomain.com node scripts/generate-links.js
```

## 프로젝트 구조

```
index.html            — 메인 페이지 (랜딩 + 8개 섹션)
css/style.css         — 전체 스타일 (애니메이션, 반응형, 날씨 테마)
js/config.js          — 결혼식 정보, 계좌, 폼 ID 등 설정 상수
js/app.js             — 애플리케이션 로직
data/guests.json      — 하객 목록 (gitignored)
scripts/generate-links.js — 개인화 URL 생성 스크립트
```

## 주요 기능

- 개인화 랜딩 화면 (타이핑 애니메이션, 별빛 파티클)
- RSVP 참석 의사 전달 (Google Forms 연동)
- BGM 플레이어 (자동재생 정책 대응, 상태 유지)
- 사진 갤러리 (터치 스와이프 지원)
- 계좌번호 복사 + 카카오/토스 송금 링크
- D-Day 카운트다운 + 동적 캘린더
- 카카오맵/네이버지도/티맵 딥링크
- 날씨 반응형 테마 (맑음/비/야간)
- 타임캡슐 메시지 (1년 후 전달)

## 배포

정적 파일만으로 구성되어 있어 GitHub Pages, Netlify, Vercel, CloudFlare Pages 등 어디든 배포 가능합니다.

## 라이선스

Private — 개인 사용 목적
