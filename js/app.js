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

  // Apply guest data to UI
  document.getElementById('landing-name').textContent = currentGuest.name;
  document.getElementById('landing-msg').textContent = currentGuest.msg;
  document.getElementById('rsvp-name').value = currentGuest.name;
  document.getElementById('rsvp-section-name').textContent = currentGuest.name;
  document.getElementById('tc-name').value = currentGuest.name;

  // Set RSVP side toggle
  if (currentGuest.side === 'bride') {
    setToggle('rsvp-side', 'bride');
  }

  // Check if already submitted RSVP
  if (localStorage.getItem('rsvp-submitted')) {
    document.getElementById('rsvp-prompt-text').textContent = '참석 의사를 전달해 주셔서 감사합니다!';
    document.getElementById('btn-section-rsvp').textContent = '전달 완료';
    document.getElementById('btn-section-rsvp').disabled = true;
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

  // Restore mute state
  if (localStorage.getItem('bgm-muted') === 'true') {
    userPausedManually = true;
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
  btn.disabled = true;
  btn.textContent = '전송 중...';

  const data = {
    [RSVP_FORM.fields.side]: getToggleValue('rsvp-side'),
    [RSVP_FORM.fields.attend]: getToggleValue('rsvp-attend'),
    [RSVP_FORM.fields.meal]: getToggleValue('rsvp-meal'),
    [RSVP_FORM.fields.name]: document.getElementById('rsvp-name').value,
    [RSVP_FORM.fields.guests]: document.getElementById('rsvp-guests').value,
  };

  try {
    const formData = new URLSearchParams(data);
    await fetch(RSVP_FORM.url, {
      method: 'POST',
      mode: 'no-cors',
      body: formData,
    });
  } catch {
    // Google Forms cross-origin will throw but still submits
  }

  localStorage.setItem('rsvp-submitted', 'true');
  document.getElementById('rsvp-form-content').style.display = 'none';
  document.getElementById('rsvp-thankyou').style.display = '';

  // Update section 7
  document.getElementById('rsvp-prompt-text').textContent = '참석 의사를 전달해 주셔서 감사합니다!';
  document.getElementById('btn-section-rsvp').textContent = '전달 완료';
  document.getElementById('btn-section-rsvp').disabled = true;
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
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const ddayEl = document.getElementById('dday');
  const numEl = ddayEl.querySelector('.dday-number');
  const textEl = ddayEl.querySelector('.dday-text');

  if (days > 0) {
    numEl.textContent = `D - ${days}`;
    textEl.textContent = `결혼식까지 ${days}일 남았습니다`;
  } else if (days === 0) {
    numEl.textContent = '🎉 오늘입니다!';
    textEl.textContent = '축복해 주세요';
  } else {
    numEl.textContent = `D + ${Math.abs(days)}`;
    textEl.textContent = `결혼식이 ${Math.abs(days)}일 지났습니다`;
  }
}

/* ===========================
   Gallery (Section 5)
   =========================== */
function initGallery() {
  const track = document.getElementById('gallery-track');
  const dotsContainer = document.getElementById('gallery-dots');

  // Create slides with placeholder images (replace with actual photos)
  for (let i = 1; i <= GALLERY_COUNT; i++) {
    const img = document.createElement('img');
    img.className = 'gallery-slide';
    img.src = `images/gallery-${String(i).padStart(2, '0')}.jpg`;
    img.alt = `웨딩 사진 ${i}`;
    img.loading = 'lazy';
    // Fallback for missing images
    img.onerror = function () {
      this.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="533" fill="#f0ede8"><rect width="100%" height="100%"/><text x="50%" y="50%" text-anchor="middle" fill="#c9a96e" font-size="20" font-family="serif">Photo ${i}</text></svg>`)}`;
      this.onerror = null;
    };
    track.appendChild(img);

    const dot = document.createElement('button');
    dot.className = `gallery-dot${i === 1 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `사진 ${i}`);
    dot.addEventListener('click', () => goToSlide(i - 1));
    dotsContainer.appendChild(dot);
  }

  document.querySelector('.gallery-prev').addEventListener('click', () => {
    goToSlide(galleryIndex - 1);
  });
  document.querySelector('.gallery-next').addEventListener('click', () => {
    goToSlide(galleryIndex + 1);
  });

  // Touch swipe
  let touchStartX = 0;
  let touchEndX = 0;
  const slider = document.querySelector('.gallery-slider');

  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToSlide(galleryIndex + 1);
      else goToSlide(galleryIndex - 1);
    }
  }, { passive: true });

  updateGalleryUI();
}

function goToSlide(index) {
  if (index < 0) index = GALLERY_COUNT - 1;
  if (index >= GALLERY_COUNT) index = 0;
  galleryIndex = index;
  updateGalleryUI();
}

function updateGalleryUI() {
  const track = document.getElementById('gallery-track');
  track.style.transform = `translateX(-${galleryIndex * 100}%)`;

  document.getElementById('gallery-counter').textContent = `${galleryIndex + 1} / ${GALLERY_COUNT}`;

  document.querySelectorAll('.gallery-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === galleryIndex);
  });
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
        ${acc.kakao ? `<a class="btn-account" href="${acc.kakao}" target="_blank" rel="noopener">카카오 송금</a>` : ''}
        ${acc.toss ? `<a class="btn-account" href="${acc.toss}" target="_blank" rel="noopener">토스 송금</a>` : ''}
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

  const data = {
    [TIMECAPSULE_FORM.fields.name]: name,
    [TIMECAPSULE_FORM.fields.message]: message,
  };

  try {
    await fetch(TIMECAPSULE_FORM.url, {
      method: 'POST',
      mode: 'no-cors',
      body: new URLSearchParams(data),
    });
  } catch {
    // Google Forms cross-origin
  }

  document.getElementById('tc-form-content').style.display = 'none';
  document.getElementById('tc-thankyou').style.display = '';
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
  await loadGuest();
  initBGM();
  initLanding();
  initRSVP();
  renderCalendar();
  updateDDay();
  initGallery();
  initAccounts();
  initPetals();
  initTimeCapsule();
  applyWeatherTheme();
});
