/**
 * Google Apps Script — 웨딩 청첩장 RSVP / 타임캡슐 / 갤러리(좋아요·댓글) 시트 저장
 *
 * ============ 설정 방법 ============
 *
 * 1. Google Sheets에서 새 스프레드시트를 생성합니다.
 *    - 시트1 이름을 "RSVP"로 변경합니다.
 *    - 시트2를 추가하고 이름을 "TimeCapsule"로 변경합니다.
 *    - 갤러리용 시트(GalleryLikes / GalleryComments)는 코드가 자동 생성하므로 안 만들어도 됩니다.
 *
 * 2. RSVP 시트 헤더(1행):
 *    A1: 접수시간 | B1: 성함 | C1: 연락처뒷자리 | D1: 신랑/신부측 | E1: 참석여부 | F1: 식사여부 | G1: 동행인원
 *
 * 3. TimeCapsule 시트 헤더(1행):
 *    A1: 접수시간 | B1: 성함 | C1: 메시지
 *
 * 4. [확장 프로그램] > [Apps Script] → 기존 코드 전체 삭제 후 이 파일 내용 붙여넣기.
 *
 * 5. [배포] > [새 배포]
 *    - 유형: 웹 앱 / 실행 주체: 나 / 액세스 권한: 모든 사용자
 *
 * 6. ⚠️ 기존 URL을 유지하려면 [배포 관리] > 연필(편집) > 버전 "새 버전"으로 올려 재배포하세요.
 *    URL은 js/config.js 의 APPS_SCRIPT_URL 과 일치해야 합니다.
 *
 * ===================================
 */

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var now = new Date();
  var timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

  if (data.type === 'rsvp') {
    var sheet = ss.getSheetByName('RSVP');
    var row = [
      timestamp,
      data.name,
      data.phone,
      data.side === 'groom' ? '신랑측' : '신부측',
      data.attend === 'yes' ? '참석' : '불참',
      data.meal === 'yes' ? '예정' : data.meal === 'no' ? '불필요' : '미정',
      Number(data.guests) || 0,
    ];
    var existingRow = findRow(sheet, data.name, data.phone);
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
  }

  if (data.type === 'timecapsule') {
    var sheet = ss.getSheetByName('TimeCapsule');
    sheet.appendRow([timestamp, data.name, data.message]);
  }

  // 갤러리 좋아요: 누를 때마다 한 행씩 추가(중복 허용) → doGet에서 합산
  if (data.type === 'like') {
    var lock = LockService.getScriptLock();
    lock.tryLock(5000);
    var sheet = ensureSheet(ss, 'GalleryLikes', ['접수시간', '사진번호']);
    sheet.appendRow([timestamp, Number(data.photo) || 0]);
    lock.releaseLock();
  }

  // 갤러리 댓글
  if (data.type === 'comment') {
    var lock = LockService.getScriptLock();
    lock.tryLock(5000);
    var sheet = ensureSheet(ss, 'GalleryComments', ['접수시간', '사진번호', '닉네임', '댓글']);
    sheet.appendRow([timestamp, Number(data.photo) || 0, String(data.name), String(data.text)]);
    lock.releaseLock();
  }

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 갤러리 데이터 조회 (모든 하객이 같은 좋아요/댓글을 보도록 읽기 제공)
 * 응답: { likes: { "0": 3, "1": 7, ... }, comments: [ { photo, name, text }, ... ] }
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var likes = {};
  var lsheet = ss.getSheetByName('GalleryLikes');
  if (lsheet && lsheet.getLastRow() > 1) {
    var lv = lsheet.getRange(2, 2, lsheet.getLastRow() - 1, 1).getValues(); // B열: 사진번호
    for (var i = 0; i < lv.length; i++) {
      var p = Number(lv[i][0]);
      likes[p] = (likes[p] || 0) + 1;
    }
  }

  var comments = [];
  var csheet = ss.getSheetByName('GalleryComments');
  if (csheet && csheet.getLastRow() > 1) {
    var cv = csheet.getRange(2, 2, csheet.getLastRow() - 1, 3).getValues(); // B:사진번호 C:닉네임 D:댓글
    for (var j = 0; j < cv.length; j++) {
      comments.push({ photo: Number(cv[j][0]), name: String(cv[j][1]), text: String(cv[j][2]) });
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ likes: likes, comments: comments }))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 시트가 없으면 헤더와 함께 생성해서 반환 */
function ensureSheet(ss, name, header) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(header);
  }
  return sheet;
}

/** RSVP 시트에서 성함(B) + 연락처뒷자리(C)가 일치하는 행 번호 반환 (없으면 -1) */
function findRow(sheet, name, phone) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var values = sheet.getRange(2, 2, lastRow - 1, 2).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(name) && String(values[i][1]) === String(phone)) {
      return i + 2;
    }
  }
  return -1;
}
