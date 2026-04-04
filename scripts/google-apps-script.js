/**
 * Google Apps Script — 웨딩 청첩장 RSVP & 타임캡슐 시트 저장
 *
 * ============ 설정 방법 ============
 *
 * 1. Google Sheets에서 새 스프레드시트를 생성합니다.
 *    - 시트1 이름을 "RSVP"로 변경합니다.
 *    - 시트2를 추가하고 이름을 "TimeCapsule"로 변경합니다.
 *
 * 2. RSVP 시트의 첫 번째 행(헤더)에 다음을 입력합니다:
 *    A1: 접수시간 | B1: 성함 | C1: 연락처뒷자리 | D1: 신랑/신부측 | E1: 참석여부 | F1: 식사여부 | G1: 동행인원
 *
 * 3. TimeCapsule 시트의 첫 번째 행(헤더)에 다음을 입력합니다:
 *    A1: 접수시간 | B1: 성함 | C1: 메시지
 *
 * 4. 스프레드시트 메뉴에서 [확장 프로그램] > [Apps Script]를 클릭합니다.
 *
 * 5. 기본 코드를 모두 지우고, 아래의 doPost 함수를 붙여넣습니다.
 *
 * 6. [배포] > [새 배포]를 클릭합니다.
 *    - 유형: 웹 앱
 *    - 실행 주체: 나
 *    - 액세스 권한: 모든 사용자
 *    - [배포]를 클릭합니다.
 *
 * 7. 생성된 웹앱 URL을 복사하여 js/config.js의 APPS_SCRIPT_URL에 붙여넣습니다.
 *    예: https://script.google.com/macros/s/AKfycbx.../exec
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

    // 성함(B열) + 연락처뒷자리(C열)가 일치하는 기존 행을 찾아 덮어쓰기
    var existingRow = findRow(sheet, data.name, data.phone);
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
  }

  if (data.type === 'timecapsule') {
    var sheet = ss.getSheetByName('TimeCapsule');
    sheet.appendRow([
      timestamp,
      data.name,
      data.message,
    ]);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * RSVP 시트에서 성함(B열) + 연락처뒷자리(C열)가 일치하는 행 번호를 반환합니다.
 * 일치하는 행이 없으면 -1을 반환합니다.
 */
function findRow(sheet, name, phone) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1; // 헤더만 있는 경우

  var values = sheet.getRange(2, 2, lastRow - 1, 2).getValues(); // B2:C열
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(name) && String(values[i][1]) === String(phone)) {
      return i + 2; // 시트 행 번호 (1-indexed, 헤더 제외)
    }
  }
  return -1;
}
