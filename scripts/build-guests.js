// Vercel 빌드 시 실행됨.
// 환경변수 GUESTS_JSON(하객 개인 메시지 JSON 문자열)을 data/guests.json 파일로 생성한다.
// → 개인 메시지를 git 저장소에 올리지 않고 Vercel 환경변수로만 주입하기 위함.
//
// 설정: Vercel 프로젝트 > Settings > Environment Variables
//   Key:   GUESTS_JSON
//   Value: [{"name":"김철수","side":"groom","msgAttend":"...","msgAbsent":"..."}]
//
// 로컬 개발 시에는 환경변수 없이 data/guests.json을 직접 두고 쓰면 된다(이 스크립트가 보존함).

const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', 'data', 'guests.json');
const raw = process.env.GUESTS_JSON;

fs.mkdirSync(path.dirname(outPath), { recursive: true });

if (raw && raw.trim()) {
  try {
    JSON.parse(raw); // 유효성 검사 (실패 시 빌드 로그에 표시)
    fs.writeFileSync(outPath, raw);
    console.log('[build-guests] GUESTS_JSON 적용 → data/guests.json 생성 완료');
  } catch (e) {
    console.error('[build-guests] GUESTS_JSON 파싱 실패 — 빈 목록으로 생성:', e.message);
    fs.writeFileSync(outPath, '[]');
  }
} else if (fs.existsSync(outPath)) {
  console.log('[build-guests] GUESTS_JSON 없음 — 기존 data/guests.json 유지(로컬 개발)');
} else {
  console.log('[build-guests] GUESTS_JSON 없음 — 빈 목록 생성');
  fs.writeFileSync(outPath, '[]');
}
