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
  parking: '주차는 2시간 무료 제공됩니다.',
  transit: '양재역 도보 1분 이내',
  groomFather: '이성민',
  groomMother: '김혜련',
  brideFather: '이명재',
  brideMother: '이정희',
};

// Google Apps Script 웹앱 URL (배포 후 생성되는 URL로 교체)
// 설정 방법: scripts/google-apps-script.js 파일 참고
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx1m6Bqo_RZeftgNYKvah_TzoR6WdWXgir8F9RMDfHI6OPQ90L1FmTphSHgVNWNgXqt/exec';

// ===========================
// 카카오톡 공유 설정
// ===========================
// 1) https://developers.kakao.com 에서 앱 생성 후 "JavaScript 키"를 아래에 입력
// 2) [내 애플리케이션 > 플랫폼 > Web] 에 배포 도메인(SITE_URL)을 등록해야 동작합니다
const KAKAO_JS_KEY = '88f3712d1ac90505472006503a171557';

// 배포 도메인 (끝에 / 없이). 공유 카드의 이미지/링크 절대경로에 사용됩니다.
const SITE_URL = 'https://woobin-yeoul.vercel.app';

const ACCOUNTS = {
  groom: [
    { name: '이우빈', relation: '', bank: '토스뱅크', number: '1000-2536-3873', kakao: 'https://qr.kakaopay.com/Ej8CUvMtj', toss: 'supertoss://send?&bank=토스뱅크&accountNo=1000-2536-3873' },
    { name: '김혜련', relation: '모', bank: '하나은행', number: '171-049477-00108', kakao: '', toss: '' },
  ],
  bride: [
    { name: '이여울', relation: '', bank: '카카오뱅크', number: '3333-0506-62599', kakao: '', toss: '' },
    { name: '이명재', relation: '부', bank: '하나은행', number: '50691082925007', kakao: '', toss: '' },
    { name: '이정희', relation: '모', bank: 'IM뱅크', number: '22813002180', kakao: '', toss: '' },
  ],
};

const VENUE_GEO = {
  name: '엘타워',
  query: '서울 서초구 강남대로 213 엘타워',
  lat: 37.4823133,
  lng: 127.0355977,
};

const MAP_LINKS = {
  naver: 'https://map.naver.com/p/search/' + encodeURIComponent(VENUE_GEO.query),
  tmap: 'https://www.tmap.co.kr/tmap2/mobile/route.jsp?goalname=' + encodeURIComponent(VENUE_GEO.name) + '&goalx=' + VENUE_GEO.lng + '&goaly=' + VENUE_GEO.lat,
  kakao: 'https://map.kakao.com/link/map/' + encodeURIComponent(VENUE_GEO.name) + ',' + VENUE_GEO.lat + ',' + VENUE_GEO.lng,
};

const WEATHER_API_KEY = '0b4e798993d32814f5e89cf0e3ed6da9';
const WEATHER_API = `https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=${WEATHER_API_KEY}&units=metric`;

const GALLERY_COUNT = 12;
