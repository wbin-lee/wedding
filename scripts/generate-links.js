// node scripts/generate-links.js
// 각 하객별 개인화 URL을 출력합니다.
// 출력 결과를 복사해서 카카오톡/문자 발송에 활용하세요.

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://wedding.example.com';
const guestsPath = path.join(__dirname, '..', 'data', 'guests.json');

const guests = JSON.parse(fs.readFileSync(guestsPath, 'utf-8'));

console.log(`\n총 ${guests.length}명의 하객 URL:\n`);
guests.forEach(g => {
  const url = `${BASE_URL}/?name=${encodeURIComponent(g.name)}`;
  console.log(`${g.name}\t${g.side}\t${url}`);
});
console.log('');
