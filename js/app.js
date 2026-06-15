/* ===========================
   Global State
   =========================== */
let currentGuest = null;
let userPausedManually = false;
let bgm = null;
let galleryIndex = 0;

/* ===========================
   Guest Loading
   =========================== */
async function loadGuest() {
  const params = new URLSearchParams(window.location.search);
  const nameParam = decodeURIComponent(params.get('name') || '');

  try {
    const res = await fetch('data/guests.json');
    const guests = await res.json();
    currentGuest = guests.find(g => g.name === nameParam) ?? {
      name: nameParam || '소중한 분',
      msg: '함께해 주셔서 감사합니다.',
      side: 'groom',
    };
  } catch {
    currentGuest = {
      name: nameParam || '소중한 분',
      msg: '함께해 주셔서 감사합니다.',
      side: 'groom',
    };
  }

  // 표시 이름 결정: 직접 제출한 이름(있으면) > URL/guests.json 이름
  const savedName = localStorage.getItem('rsvp-name') || '';
  const realName = (currentGuest.name && currentGuest.name !== '소중한 분') ? currentGuest.name : '';
  const inputName = savedName || realName; // 입력칸 기본값(폴백 문구는 넣지 않음)

  // Apply guest data to UI
  document.getElementById('landing-name').textContent = currentGuest.name;
  document.getElementById('landing-msg').textContent = currentGuest.msg;
  document.getElementById('rsvp-name').value = inputName;
  document.getElementById('rsvp-section-name').textContent = inputName || '소중한 분';
  document.getElementById('tc-name').value = inputName;

  // Set RSVP side toggle
  if (currentGuest.side === 'bride') {
    setToggle('rsvp-side', 'bride');
  }

  // Check if already submitted RSVP
  if (localStorage.getItem('rsvp-submitted')) {
    showRSVPCompleted();
  }
}

/* ===========================
   BGM Player
   =========================== */
function initBGM() {
  bgm = new Audio('audio/bgm.mp3');
  bgm.loop = true;
  bgm.volume = 0.4;

  const btn = document.getElementById('bgm-btn');
  const iconPlay = btn.querySelector('.play');
  const iconPause = btn.querySelector('.pause');

  // Restore mute state — default is play
  if (localStorage.getItem('bgm-muted') === 'true') {
    userPausedManually = true;
  }

  // Attempt autoplay immediately
  if (!userPausedManually) {
    bgm.play().then(updateBGMUI).catch(() => {});
  }

  function updateBGMUI() {
    if (bgm.paused) {
      iconPlay.style.display = '';
      iconPause.style.display = 'none';
      btn.classList.remove('playing');
      btn.setAttribute('aria-label', '배경음악 재생');
    } else {
      iconPlay.style.display = 'none';
      iconPause.style.display = '';
      btn.classList.add('playing');
      btn.setAttribute('aria-label', '배경음악 일시정지');
    }
  }

  btn.addEventListener('click', () => {
    if (bgm.paused) {
      bgm.play().then(updateBGMUI).catch(() => {});
      userPausedManually = false;
      localStorage.setItem('bgm-muted', 'false');
    } else {
      bgm.pause();
      userPausedManually = true;
      localStorage.setItem('bgm-muted', 'true');
      updateBGMUI();
    }
  });

  // Auto-play on first interaction
  document.addEventListener('click', () => {
    if (bgm.paused && !userPausedManually) {
      bgm.play().then(updateBGMUI).catch(() => {});
    }
  }, { once: true });
}

/* ===========================
   Landing Screen
   =========================== */
function initLanding() {
  // Staggered fade-in
  const seqElements = document.querySelectorAll('.fade-seq');
  seqElements.forEach(el => {
    const delay = parseInt(el.dataset.delay) || 0;
    setTimeout(() => el.classList.add('visible'), delay);
  });

  // Landing particles (stars)
  const container = document.getElementById('landing-particles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'landing-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (3 + Math.random() * 4) + 's';
    p.style.animationDelay = Math.random() * 5 + 's';
    p.style.width = p.style.height = (1 + Math.random() * 2) + 'px';
    container.appendChild(p);
  }

  // "View Invitation" button
  document.getElementById('btn-view-invitation').addEventListener('click', () => {
    const landing = document.getElementById('landing');
    const main = document.getElementById('main');
    landing.classList.add('hidden');
    main.style.display = '';
    // Trigger scroll animations for first visible section
    setTimeout(() => observeSections(), 300);
  });

  // RSVP button on landing
  document.getElementById('btn-landing-rsvp').addEventListener('click', openRSVP);
}

/* ===========================
   RSVP Modal
   =========================== */
function showRSVPCompleted() {
  document.getElementById('rsvp-prompt-text').textContent = '참석 의사를 전달해 주셔서 감사합니다!';
  document.getElementById('btn-section-rsvp').textContent = '전달 완료';
  document.getElementById('btn-section-rsvp').disabled = true;
  document.getElementById('btn-section-rsvp-edit').style.display = '';
}

function openRSVP() {
  document.getElementById('rsvp-modal').style.display = '';
}

function closeRSVP() {
  document.getElementById('rsvp-modal').style.display = 'none';
}

function initRSVP() {
  document.getElementById('rsvp-close').addEventListener('click', closeRSVP);
  document.getElementById('rsvp-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeRSVP();
  });

  // Toggle buttons
  document.querySelectorAll('.toggle-group').forEach(group => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.toggle-btn');
      if (!btn) return;
      group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Section 7 RSVP button
  document.getElementById('btn-section-rsvp').addEventListener('click', openRSVP);

  // Edit button — reopen modal with form visible
  document.getElementById('btn-section-rsvp-edit').addEventListener('click', () => {
    document.getElementById('rsvp-form-content').style.display = '';
    document.getElementById('rsvp-thankyou').style.display = 'none';
    const btn = document.getElementById('rsvp-submit');
    btn.disabled = false;
    btn.textContent = '수정하기';
    openRSVP();
  });

  // Submit
  document.getElementById('rsvp-submit').addEventListener('click', submitRSVP);
}

function getToggleValue(groupId) {
  const active = document.querySelector(`#${groupId} .toggle-btn.active`);
  return active ? active.dataset.value : '';
}

function setToggle(groupId, value) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.value === value);
  });
}

async function submitRSVP() {
  const btn = document.getElementById('rsvp-submit');
  const nameVal = document.getElementById('rsvp-name').value.trim();
  const phoneVal = document.getElementById('rsvp-phone').value.trim();

  if (!nameVal) {
    showToast('성함을 입력해 주세요');
    return;
  }
  if (!/^\d{4}$/.test(phoneVal)) {
    showToast('연락처 뒷자리 4자리를 입력해 주세요');
    return;
  }

  btn.disabled = true;
  btn.textContent = '전송 중...';

  const data = {
    type: 'rsvp',
    side: getToggleValue('rsvp-side'),
    attend: getToggleValue('rsvp-attend'),
    meal: getToggleValue('rsvp-meal'),
    name: nameVal,
    phone: phoneVal,
    guests: document.getElementById('rsvp-guests').value,
  };

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    localStorage.setItem('rsvp-submitted', 'true');
    localStorage.setItem('rsvp-name', nameVal); // 제출한 이름 저장
    // 입력한 이름을 화면에 반영 (하단 RSVP 섹션 인사말)
    document.getElementById('rsvp-section-name').textContent = nameVal;
    document.getElementById('rsvp-form-content').style.display = 'none';
    document.getElementById('rsvp-thankyou').style.display = '';
    showRSVPCompleted();
  } catch {
    btn.disabled = false;
    btn.textContent = '제출하기';
    showToast('전송에 실패했습니다. 다시 시도해 주세요.');
  }
}

/* ===========================
   Calendar (Section 3)
   =========================== */
function renderCalendar() {
  const container = document.getElementById('calendar');
  const year = 2026;
  const month = 10; // November (0-indexed)
  const weddingDay = 1;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '<div class="month-label">NOVEMBER 2026</div>';
  html += '<table><thead><tr>';
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  dayNames.forEach(d => { html += `<th>${d}</th>`; });
  html += '</tr></thead><tbody><tr>';

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += '<td></td>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dow = (firstDay + day - 1) % 7;
    let cls = '';
    if (day === weddingDay) cls = 'wedding-day';
    else if (dow === 0) cls = 'sunday';
    else if (dow === 6) cls = 'saturday';

    html += `<td class="${cls}">${day}</td>`;
    if (dow === 6 && day < daysInMonth) html += '</tr><tr>';
  }

  // Fill remaining cells
  const lastDow = (firstDay + daysInMonth - 1) % 7;
  for (let i = lastDow + 1; i <= 6; i++) {
    html += '<td></td>';
  }

  html += '</tr></tbody></table>';
  container.innerHTML = html;
}

/* ===========================
   D-Day Countdown (Section 3)
   =========================== */
function updateDDay() {
  const now = new Date();
  const diff = WEDDING.date - now;
  const textEl = document.getElementById('dday-text');
  const daysEl = document.getElementById('dday-days');
  const hoursEl = document.getElementById('dday-hours');
  const minsEl = document.getElementById('dday-mins');
  const secsEl = document.getElementById('dday-secs');

  if (diff > 0) {
    const totalSec = Math.floor(diff / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    daysEl.textContent = d;
    hoursEl.textContent = String(h).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
    secsEl.textContent = String(s).padStart(2, '0');
    textEl.textContent = `결혼식까지 ${d}일 남았습니다`;
  } else if (diff > -86400000) {
    daysEl.textContent = '🎉';
    hoursEl.textContent = '00';
    minsEl.textContent = '00';
    secsEl.textContent = '00';
    textEl.textContent = '오늘입니다! 축복해 주세요';
  } else {
    const absDays = Math.floor(Math.abs(diff) / 86400000);
    daysEl.textContent = absDays;
    hoursEl.textContent = '00';
    minsEl.textContent = '00';
    secsEl.textContent = '00';
    textEl.textContent = `결혼식이 ${absDays}일 지났습니다`;
  }
}

function startDDayTimer() {
  updateDDay();
  setInterval(updateDDay, 1000);
}

/* ===========================
   Gallery (Section 5) — Instagram UI
   =========================== */
let igLikes = [];     // 사진별 좋아요 수
let igComments = [];  // 사진별 댓글 배열 [{name, text}]
let igLiked = [];     // 이 기기에서 내가 좋아요한 사진(빨강 유지용)
const IG_DOT_STEP = 10; // 점 하나가 차지하는 폭(6px + margin 2px*2)

const IG_CAPTIONS = [
  '함께라서 더 빛나는 순간 ✨ #우빈여울 #웨딩 #2026',
  '평생 너의 손을 잡고 걸을게 💍 #wedding',
  '우리의 이야기가 시작되는 날 🤍 #예비부부',
  '사랑한다는 말로는 부족한 하루 🌿 #weddingday',
  '오래도록 이 미소 그대로 😊 #couple #11월의신부',
];

function igCaption(i) { return IG_CAPTIONS[i % IG_CAPTIONS.length]; }

// 즉시 표시용 로컬 캐시(오프라인/첫 페인트). 실제 원본은 서버(Google Sheet).
function igLoadState() {
  igLikes = []; igComments = [];
  try {
    const c = JSON.parse(localStorage.getItem('ig-cache'));
    if (c) { igLikes = c.likes || []; igComments = c.comments || []; }
  } catch {}
  for (let i = 0; i < GALLERY_COUNT; i++) {
    if (typeof igLikes[i] !== 'number') igLikes[i] = 0;
    if (!Array.isArray(igComments[i])) igComments[i] = [];
  }
}
function igCacheSave() {
  try { localStorage.setItem('ig-cache', JSON.stringify({ likes: igLikes, comments: igComments })); } catch {}
}

function igConfigured() {
  return typeof APPS_SCRIPT_URL === 'string' && /^https:\/\/script\.google\.com/.test(APPS_SCRIPT_URL);
}

// 서버로 전송 (fire-and-forget)
function igPost(payload) {
  if (!igConfigured()) return;
  try {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {}
}

// 서버에서 좋아요/댓글 전체 조회 → 화면 갱신 (모든 하객 공유)
async function igFetchData() {
  if (!igConfigured()) return;
  try {
    const res = await fetch(APPS_SCRIPT_URL + '?action=gallery&t=' + Date.now());
    const data = await res.json();

    for (let i = 0; i < GALLERY_COUNT; i++) {
      igLikes[i] = (data.likes && data.likes[i] != null) ? Number(data.likes[i]) : 0;
    }
    const grouped = [];
    for (let i = 0; i < GALLERY_COUNT; i++) grouped[i] = [];
    (data.comments || []).forEach((c) => {
      const p = Number(c.photo);
      if (p >= 0 && p < GALLERY_COUNT) grouped[p].push({ name: c.name, text: c.text });
    });
    igComments = grouped;

    igCacheSave();
    // 현재 보고 있는 사진 갱신
    document.getElementById('ig-likes-count').textContent = (igLikes[galleryIndex] || 0).toLocaleString();
    igRenderComments();
  } catch {
    // 오프라인/CORS 실패 → 캐시 유지
  }
}

function initGallery() {
  igLoadState();

  const track = document.getElementById('ig-track');
  for (let i = 1; i <= GALLERY_COUNT; i++) {
    const img = document.createElement('img');
    img.className = 'ig-slide';
    img.src = `images/gallery-${String(i).padStart(2, '0')}.jpg`;
    img.alt = `웨딩 사진 ${i}`;
    img.loading = 'lazy';
    img.draggable = false;
    img.onerror = function () {
      this.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="#f0ede8"><rect width="100%" height="100%"/><text x="50%" y="50%" text-anchor="middle" fill="#c9a96e" font-size="20" font-family="serif">Photo ${i}</text></svg>`)}`;
      this.onerror = null;
    };
    track.appendChild(img);
  }

  // 캐러셀 페이지 점
  const pagerTrack = document.getElementById('ig-pager-track');
  for (let i = 0; i < GALLERY_COUNT; i++) {
    const d = document.createElement('span');
    d.className = 'ig-pdot';
    pagerTrack.appendChild(d);
  }
  // 보이는 점 창 너비 (최대 7개)
  document.getElementById('ig-pager').style.width = (Math.min(GALLERY_COUNT, 7) * IG_DOT_STEP) + 'px';

  document.querySelector('.ig-prev').addEventListener('click', () => goToSlide(galleryIndex - 1));
  document.querySelector('.ig-next').addEventListener('click', () => goToSlide(galleryIndex + 1));

  // 좋아요 버튼: 누를 때마다 +1 (중복 가능)
  document.getElementById('ig-like-btn').addEventListener('click', () => igAddLike(false));

  // 댓글 아이콘: 입력창 포커스
  document.getElementById('ig-comment-btn').addEventListener('click', () => {
    document.getElementById('ig-cmt').focus();
  });

  // 공유 아이콘
  document.getElementById('ig-share-btn').addEventListener('click', igShare);

  // 댓글 작성 폼
  document.getElementById('ig-addcomment').addEventListener('submit', (e) => {
    e.preventDefault();
    igSubmitComment();
  });

  // 닉네임 기억
  const savedNick = localStorage.getItem('ig-nick');
  if (savedNick) document.getElementById('ig-nick').value = savedNick;

  // 미디어 영역: 스와이프 + 더블탭 좋아요
  const media = document.getElementById('ig-media');
  let startX = 0, startY = 0, lastTap = 0;

  media.addEventListener('touchstart', (e) => {
    startX = e.changedTouches[0].screenX;
    startY = e.changedTouches[0].screenY;
  }, { passive: true });

  media.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - startX;
    const dy = e.changedTouches[0].screenY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      goToSlide(galleryIndex + (dx < 0 ? 1 : -1));
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      // 탭 → 더블탭 감지
      const now = Date.now();
      if (now - lastTap < 300) { igAddLike(true); lastTap = 0; }
      else lastTap = now;
    }
  }, { passive: true });

  // 데스크탑 더블클릭 좋아요
  media.addEventListener('dblclick', () => igAddLike(true));

  updateGalleryUI();

  // 서버에서 공유 데이터 불러오기 + 주기적 갱신(15초)
  igFetchData();
  setInterval(igFetchData, 15000);
}

function goToSlide(index) {
  if (index < 0) index = GALLERY_COUNT - 1;
  if (index >= GALLERY_COUNT) index = 0;
  galleryIndex = index;
  updateGalleryUI();
}

function updateGalleryUI() {
  const i = galleryIndex;
  document.getElementById('ig-track').style.transform = `translateX(-${i * 100}%)`;
  document.getElementById('ig-count').textContent = `${i + 1}/${GALLERY_COUNT}`;
  document.getElementById('ig-likes-count').textContent = (igLikes[i] || 0).toLocaleString();
  document.getElementById('ig-caption-text').textContent = igCaption(i);
  // 좋아요 버튼 상태(이 사진에 내가 누른 적 있으면 빨강 유지)
  document.getElementById('ig-like-btn').classList.toggle('liked', !!(igLiked && igLiked[i]));
  updateIgPager();
  igRenderComments();
}

// 인스타식 페이지 점: 활성 점을 창 중앙에 두고, 가장자리 점은 작게
function updateIgPager() {
  const track = document.getElementById('ig-pager-track');
  if (!track) return;
  const dots = track.children;
  const n = dots.length;
  const step = IG_DOT_STEP;
  const pagerW = Math.min(n, 7) * step;
  const trackW = n * step;

  let tx = pagerW / 2 - (galleryIndex * step + step / 2);
  tx = Math.max(Math.min(tx, 0), pagerW - trackW); // 양끝에서 멈춤
  track.style.transform = `translateX(${tx}px)`;

  for (let i = 0; i < n; i++) {
    const el = dots[i];
    el.classList.toggle('active', i === galleryIndex);
    // 창(window) 중앙으로부터의 거리에 따라 크기 조절
    const posInWindow = (i * step + step / 2) + tx;
    const dist = Math.abs(posInWindow - pagerW / 2);
    let scale = 1;
    if (dist > step * 2.5) scale = 0.34;
    else if (dist > step * 1.5) scale = 0.66;
    el.style.transform = `scale(${scale})`;
  }
}

function igAddLike(fromDoubleTap) {
  const i = galleryIndex;
  igLikes[i] = (igLikes[i] || 0) + 1; // 즉시 반영(낙관적), 서버 폴링으로 정정
  igLiked[i] = true;
  igCacheSave();
  igPost({ type: 'like', photo: i });
  document.getElementById('ig-likes-count').textContent = igLikes[i].toLocaleString();

  const btn = document.getElementById('ig-like-btn');
  btn.classList.add('liked');
  btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');

  // 떠오르는 하트
  const floater = document.createElement('span');
  floater.className = 'ig-floater';
  floater.textContent = '♥';
  btn.style.position = 'relative';
  btn.appendChild(floater);
  setTimeout(() => floater.remove(), 1000);

  // 더블탭이면 이미지 가운데 큰 하트
  if (fromDoubleTap) {
    const burst = document.getElementById('ig-burst');
    burst.classList.remove('animate'); void burst.offsetWidth; burst.classList.add('animate');
  }
}

function igRenderComments() {
  const wrap = document.getElementById('ig-comments');
  const list = igComments[galleryIndex] || [];
  if (!list.length) {
    wrap.innerHTML = '<p class="ig-empty">첫 댓글을 남겨보세요.</p>';
    return;
  }
  wrap.innerHTML = list.map(c =>
    `<p class="ig-comment"><span class="ig-cname">${igEscape(c.name)}</span>${igEscape(c.text)}</p>`
  ).join('');
  wrap.scrollTop = wrap.scrollHeight;
}

function igSubmitComment() {
  const nickEl = document.getElementById('ig-nick');
  const cmtEl = document.getElementById('ig-cmt');
  const name = nickEl.value.trim();
  const text = cmtEl.value.trim();

  if (!name) { showToast('닉네임을 입력해 주세요'); nickEl.focus(); return; }
  if (!text) { showToast('댓글을 입력해 주세요'); cmtEl.focus(); return; }

  igComments[galleryIndex].push({ name, text }); // 즉시 반영(낙관적)
  igCacheSave();
  igPost({ type: 'comment', photo: galleryIndex, name, text });
  localStorage.setItem('ig-nick', name); // 닉네임 기억
  cmtEl.value = '';
  igRenderComments();
}

function igEscape(s) {
  return String(s).replace(/[&<>"']/g, (m) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
  ));
}

async function igShare() {
  const i = galleryIndex;
  const rel = `images/gallery-${String(i + 1).padStart(2, '0')}.jpg`;
  const abs = siteBase() + '/' + rel;
  const title = '우빈 ♡ 여울 Wedding';
  const text = `우빈 ♡ 여울의 웨딩 사진 (${i + 1}/${GALLERY_COUNT})`;

  // 1) 이미지 파일 자체 공유 시도
  if (navigator.canShare) {
    try {
      const res = await fetch(rel);
      const blob = await res.blob();
      const file = new File([blob], `wedding-${i + 1}.jpg`, { type: blob.type || 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return; // 사용자가 취소
    }
  }
  // 2) URL 공유
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: abs });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  // 3) 링크 복사 폴백
  try {
    await navigator.clipboard.writeText(abs);
    showToast('사진 링크가 복사되었습니다');
  } catch {
    showToast('공유를 지원하지 않는 환경입니다');
  }
}

/* ===========================
   Accounts (Section 6)
   =========================== */
function initAccounts() {
  renderAccounts('groom');

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAccounts(btn.dataset.tab);
    });
  });
}

function renderAccounts(side) {
  const list = document.getElementById('account-list');
  const accounts = ACCOUNTS[side];

  list.innerHTML = accounts.map(acc => `
    <div class="account-card">
      <div class="account-name">
        ${acc.name}${acc.relation ? ` <span class="relation">(${acc.relation})</span>` : ''}
      </div>
      <div class="account-number">${acc.bank} ${acc.number}</div>
      <div class="account-actions">
        <button class="btn-account" onclick="copyAccount('${acc.number}')">계좌번호 복사</button>
        ${acc.kakao ? `<a class="btn-account btn-kakao" href="${acc.kakao}" target="_blank" rel="noopener" aria-label="카카오페이 송금"><img src="images/icon-kakaopay.svg" alt="카카오페이" /></a>` : ''}
        ${acc.toss ? `<a class="btn-account btn-toss" href="${acc.toss}" target="_blank" rel="noopener" aria-label="토스 송금"><img src="images/icon-toss.svg" alt="토스" /></a>` : ''}
      </div>
    </div>
  `).join('');
}

async function copyAccount(number) {
  try {
    await navigator.clipboard.writeText(number.replace(/-/g, ''));
    showToast('계좌번호가 복사되었습니다');
  } catch {
    showToast('복사에 실패했습니다');
  }
}

/* ===========================
   Map Buttons (Section 4)
   =========================== */
function initMapButtons() {
  const container = document.getElementById('map-buttons');
  const buttons = [
    { label: '네이버지도', url: MAP_LINKS.naver },
    { label: '티맵', url: MAP_LINKS.tmap },
    { label: '카카오맵', url: MAP_LINKS.kakao },
  ];
  container.innerHTML = buttons.map(b =>
    `<a class="btn btn-map" href="${b.url}" target="_blank" rel="noopener">${b.label}</a>`
  ).join('');
}

/* ===========================
   Petals (Section 1)
   =========================== */
function initPetals() {
  const container = document.getElementById('petals');
  const petalChars = ['🌸', '🌺', '🍃'];

  for (let i = 0; i < 25; i++) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.textContent = petalChars[i % petalChars.length];
    petal.style.left = Math.random() * 100 + '%';
    petal.style.animationDuration = (4 + Math.random() * 6) + 's';
    petal.style.animationDelay = Math.random() * 8 + 's';
    petal.style.fontSize = (0.8 + Math.random() * 0.8) + 'rem';
    container.appendChild(petal);
  }
}

/* ===========================
   Scroll Animations
   =========================== */
function observeSections() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger child animations
        const animElements = entry.target.querySelectorAll('.anim-fade');
        animElements.forEach((el, i) => {
          setTimeout(() => el.classList.add('visible'), i * 150);
        });
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.section').forEach(sec => observer.observe(sec));
}

/* ===========================
   Weather Theme (Sub-feature)
   =========================== */
async function applyWeatherTheme() {
  if (WEATHER_API_KEY === 'YOUR_KEY') return; // Skip if no API key

  try {
    const res = await fetch(WEATHER_API);
    const data = await res.json();
    const weatherId = data.weather[0].id;
    const hour = new Date().getHours();

    if (hour >= 20 || hour < 6) {
      document.body.classList.add('weather-night');
    } else if (weatherId >= 200 && weatherId < 600) {
      document.body.classList.add('weather-rain');
    }
    // Default: sunny gold theme (no class needed)

    // D-Day special
    const today = new Date();
    if (today.toDateString() === WEDDING.date.toDateString()) {
      document.body.classList.add('weather-dday');
    }
  } catch {
    // Silently fail — default theme
  }
}

/* ===========================
   Time Capsule
   =========================== */
function initTimeCapsule() {
  document.getElementById('tc-submit').addEventListener('click', submitTimeCapsule);
}

async function submitTimeCapsule() {
  const btn = document.getElementById('tc-submit');
  const name = document.getElementById('tc-name').value.trim();
  const message = document.getElementById('tc-message').value.trim();

  if (!name || !message) {
    showToast('성함과 메시지를 모두 입력해 주세요');
    return;
  }

  btn.disabled = true;
  btn.textContent = '전송 중...';

  const data = { type: 'timecapsule', name, message };

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    document.getElementById('tc-form-content').style.display = 'none';
    document.getElementById('tc-thankyou').style.display = '';
  } catch {
    btn.disabled = false;
    btn.textContent = '타임캡슐에 담기';
    showToast('전송에 실패했습니다. 다시 시도해 주세요.');
  }
}

/* ===========================
   Kakao Share (공유 카드 + 버튼)
   =========================== */
function siteBase() {
  return SITE_URL.replace(/\/$/, '');
}

// 현재 보고 있는 청첩장 절대 URL (name 파라미터 보존)
function getInvitationUrl() {
  const search = location.search.replace(/[?&]action=calendar/, '');
  return siteBase() + '/' + (search && search !== '?' ? search : '');
}

// 구글 캘린더 "일정 추가" 링크
// 결혼식: 2026-11-01 15:00~17:00 KST (= 06:00~08:00 UTC)
function getCalendarUrl() {
  const text = `${WEDDING.groom} ♡ ${WEDDING.bride} 결혼식`;
  const details = `${WEDDING.groom} · ${WEDDING.bride}의 결혼식에 초대합니다.\n\n청첩장: ${getInvitationUrl()}`;
  const loc = `${WEDDING.venue} (${WEDDING.address})`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text,
    dates: '20261101T060000Z/20261101T080000Z',
    details,
    location: loc,
  });
  return 'https://calendar.google.com/calendar/render?' + params.toString();
}

function initKakaoShare() {
  if (typeof Kakao === 'undefined') return;
  if (!Kakao.isInitialized()) {
    if (!KAKAO_JS_KEY || KAKAO_JS_KEY === 'YOUR_KAKAO_JS_KEY') return; // 키 미설정 시 비활성
    Kakao.init(KAKAO_JS_KEY);
  }
  const btn = document.getElementById('btn-kakao-share');
  if (btn) btn.addEventListener('click', shareKakao);
}

function shareKakao() {
  if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
    showToast('카카오 공유 설정이 필요합니다');
    return;
  }
  const invitationUrl = getInvitationUrl();
  // "일정 추가하기"도 기본 브라우저에서 열리도록 우리 사이트(?action=calendar)를 경유
  const calendarUrl = siteBase() + '/?action=calendar';

  try {
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `${WEDDING.groom} ♡ ${WEDDING.bride}, 우리 결혼합니다 💍`,
        description: `${WEDDING.dateKo}\n${WEDDING.venue}`,
        imageUrl: siteBase() + '/images/hero.jpg',
        link: { mobileWebUrl: invitationUrl, webUrl: invitationUrl },
      },
      buttons: [
        { title: '일정 추가하기', link: { mobileWebUrl: calendarUrl, webUrl: calendarUrl } },
        { title: '청첩장 보러가기', link: { mobileWebUrl: invitationUrl, webUrl: invitationUrl } },
      ],
    });
  } catch (e) {
    // PC에서 팝업이 차단되면 SDK가 focus 단계에서 실패함
    showToast('팝업이 차단되었어요. 브라우저에서 팝업을 허용한 뒤 다시 시도해 주세요.');
  }
}

/* ===========================
   Toast
   =========================== */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = '';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => { toast.style.display = 'none'; }, 2500);
}

/* ===========================
   Init
   =========================== */
document.addEventListener('DOMContentLoaded', async () => {
  // 카카오 공유 "일정 추가하기" 버튼 처리
  if (new URLSearchParams(location.search).get('action') === 'calendar') {
    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    // 모바일: .ics → 기본 캘린더 앱(안드로이드=구글 캘린더 / 아이폰=Apple 캘린더)
    // PC: 구글 캘린더 웹 일정 등록 페이지
    location.replace(isMobile ? siteBase() + '/wedding.ics' : getCalendarUrl());
    return;
  }

  await loadGuest();
  initKakaoShare();
  initBGM();
  initLanding();
  initRSVP();
  renderCalendar();
  startDDayTimer();
  initGallery();
  initAccounts();
  initMapButtons();
  initPetals();
  initTimeCapsule();
  applyWeatherTheme();
});
