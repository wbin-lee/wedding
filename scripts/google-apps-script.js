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
 * 3-1. (개인 메시지 기능) "Guests" 시트를 만들고 헤더(1행):
 *    A1: 이름 | B1: 측 | C1: 참석메시지 | D1: 불참메시지
 *    - B열(측)은 'groom'/'bride' 또는 '신랑측'/'신부측' 모두 인식
 *    - 이름·메시지는 이 시트에만 보관되고 외부로 전체 공개되지 않음(본인 것만 응답)
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
 * GET 라우팅
 *  - action=guestmsg : 이름+측+참석여부로 개인 메시지 1건만 반환 (개인정보 비공개 유지)
 *  - 그 외(기본)      : 갤러리 좋아요/댓글 전체 반환
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'gallery';
  if (action === 'guestmsg') {
    return guestMessage(e);
  }

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

/**
 * 개인 메시지 조회
 * "Guests" 시트(A:이름 B:측 C:참석메시지 D:불참메시지)에서
 * 이름 + 측이 일치하는 행을 찾아, 참석여부에 맞는 메시지 1건만 반환한다.
 * 응답: { msg: "..." } (없으면 { msg: null })
 *
 * ⚠️ Guests 시트는 직접 만들어 주세요. (이름·메시지는 비공개로 시트에만 보관)
 *   A1: 이름 | B1: 측 | C1: 참석메시지 | D1: 불참메시지
 *   B열(측)에는 'groom'/'bride' 또는 '신랑측'/'신부측' 모두 인식합니다.
 */
function guestMessage(e) {
  var name = String((e.parameter.name || '')).trim();
  var side = normSide(e.parameter.side || '');
  var attend = String((e.parameter.attend || '')).trim();
  var msg = null;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Guests');
  if (sheet && sheet.getLastRow() > 1) {
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues(); // A:이름 B:측 C:참석 D:불참
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === name && normSide(rows[i][1]) === side) {
        var cell = (attend === 'yes') ? rows[i][2] : rows[i][3];
        msg = (cell !== '' && cell != null) ? String(cell) : null;
        break;
      }
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ msg: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 측 표기 정규화: 신랑/groom → 'groom', 신부/bride → 'bride' */
function normSide(s) {
  s = String(s).trim().toLowerCase();
  if (s.indexOf('신랑') >= 0 || s === 'groom') return 'groom';
  if (s.indexOf('신부') >= 0 || s === 'bride') return 'bride';
  return s;
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
