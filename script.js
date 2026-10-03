'use strict';
/* =========================================================
   나만의 플래너 - script.js
   구성
   1. 상수 · 상태(state) · 저장(localStorage)
   2. 도구 함수 (날짜, 문자열 처리)
   3. 일정 기능 (추가 · 완료 · 삭제 · 수정)
   4. 화면 그리기 (홈 · 달력 · 친구 · 설정)
   5. 공유 (링크/코드로 일정 주고받기)
   6. 시작 화면(온보딩)
   7. 이벤트 연결 · 시작
   ========================================================= */

/* ---------- 1. 상수 · 상태 · 저장 ---------- */
const STORAGE_KEY = 'myPlanner.v1';

// 카테고리 = 사용 목적. 시작 화면에서 고른 것만 카테고리로 나와요.
const CATS = [
  { id: 'school',  label: '수업·과제',  emoji: '📚', color: '#6d5dfc', desc: '시간표, 수업, 과제 마감', share: false },
  { id: 'personal', label: '개인',      emoji: '🌿', color: '#10b981', desc: '나만의 일정과 할 일',     share: false },
  { id: 'meet',    label: '약속',       emoji: '🤝', color: '#f59e0b', desc: '친구와의 만남',         share: true  },
  { id: 'couple',  label: '커플',       emoji: '💜', color: '#ec4899', desc: '데이트와 기념일',        share: true  },
  { id: 'workout', label: '운동·습관',  emoji: '💪', color: '#06b6d4', desc: '운동과 루틴 만들기',     share: false },
  { id: 'team',    label: '팀플·모임',  emoji: '👥', color: '#8b5cf6', desc: '팀 프로젝트와 모임',     share: true  },
];
const AVATARS = ['🐻', '🐰', '🦊', '🐱', '🐶', '🐼', '🐯', '🐸', '🦄', '🐥', '🍀', '🌙'];
const ACCENTS = ['#7c5cff', '#3b82f6', '#ec4899', '#16a34a', '#f97316', '#0d9488'];
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  friends: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.8c2 .7 3.2 2.4 3.5 5.2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/></svg>',
};
const TABS = [
  { id: 'home', label: '홈' },
  { id: 'calendar', label: '달력' },
  { id: 'friends', label: '친구' },
  { id: 'settings', label: '설정' },
];

// 저장되는 데이터
let state = loadState();

// 저장하지 않는 화면 상태
const now = new Date();
const ui = {
  tab: 'home',
  range: 'all',        // all | today | upcoming | past
  cat: 'all',
  q: '',
  hideDone: false,
  calYear: now.getFullYear(),
  calMonth: now.getMonth(),
  selected: todayStr(),
  newStar: false,
};
let pendingShare = null; // 링크로 들어온 친구 일정

function defaultState() {
  return {
    onboarded: false,
    profile: { id: uid(), name: '', avatar: AVATARS[0], status: '', purposes: [] },
    settings: {
      dark: !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches),
      accent: ACCENTS[0],
      size: 'md',
    },
    events: [],   // { id, title, date, cat, important, done, shared, createdAt }
    friends: [],  // { id, name, avatar, color, status, events:[{t,d,c,x}], visible, updatedAt }
  };
}

function loadState() {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const s = JSON.parse(raw);
    return {
      onboarded: !!s.onboarded,
      profile: Object.assign(base.profile, s.profile),
      settings: Object.assign(base.settings, s.settings),
      events: Array.isArray(s.events) ? s.events : [],
      friends: Array.isArray(s.friends) ? s.friends : [],
    };
  } catch (e) {
    return base;
  }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* 저장 공간이 없어도 앱은 계속 동작 */ }
}

/* ---------- 2. 도구 함수 ---------- */
function uid() {
  return (window.crypto && crypto.randomUUID) ? crypto.randomUUID().slice(0, 12) : Math.random().toString(36).slice(2, 14);
}
const $ = (sel, root = document) => root.querySelector(sel);
function pad(n) { return String(n).padStart(2, '0'); }
function fmtDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function todayStr() { return fmtDate(new Date()); }
function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function diffDays(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
}
function addDays(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return fmtDate(d); }
function dateLabel(s) { const d = parseDate(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`; }
function ddayText(s) {
  const n = diffDays(s, todayStr());
  return n === 0 ? 'D-Day' : n > 0 ? `D-${n}` : `D+${-n}`;
}
// 사용자가 입력한 글자를 화면에 넣을 때 꼭 거쳐야 하는 함수 (친구가 보낸 글자도 안전하게)
function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const catOf = id => CATS.find(c => c.id === id) || CATS[1];
const activeCats = () => {
  const list = CATS.filter(c => state.profile.purposes.includes(c.id));
  return list.length ? list : CATS;
};
function isValidDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseDate(s)); }

/* ---------- 3. 일정 기능 ---------- */
// 필수 1~3: 제목 입력 + 날짜 지정 + [추가]
function addEvent({ title, date, cat, important, shared }) {
  state.events.push({
    id: uid(), title: title.trim(), date, cat, important: !!important,
    done: false, shared: !!shared, createdAt: Date.now(),
  });
  save();
}
// 필수 5: 완료 처리
function toggleDone(id) {
  const e = state.events.find(x => x.id === id);
  if (e) { e.done = !e.done; save(); }
}
function toggleStar(id) {
  const e = state.events.find(x => x.id === id);
  if (e) { e.important = !e.important; save(); }
}
// 필수 6: 삭제 (실수로 지워도 되돌릴 수 있게 잠깐 보관)
function deleteEvent(id) {
  const idx = state.events.findIndex(x => x.id === id);
  if (idx < 0) return;
  const [removed] = state.events.splice(idx, 1);
  save();
  renderAll();
  toast('일정을 삭제했어요', '되돌리기', () => {
    state.events.push(removed);
    save();
    renderAll();
  });
}
function updateEvent(id, patch) {
  const e = state.events.find(x => x.id === id);
  if (e) { Object.assign(e, patch); save(); }
}

// 정렬: 오늘 이후는 가까운 순, 지난 일정은 최근 순으로 아래에
function groupByDate(list) {
  const today = todayStr();
  const map = new Map();
  list.forEach(e => { if (!map.has(e.date)) map.set(e.date, []); map.get(e.date).push(e); });
  const dates = [...map.keys()];
  const upcoming = dates.filter(d => d >= today).sort();
  const past = dates.filter(d => d < today).sort().reverse();
  return [...upcoming, ...past].map(date => ({
    date,
    items: map.get(date).sort((a, b) =>
      (a.done - b.done) || (b.important - a.important) || (a.createdAt - b.createdAt)),
  }));
}

function filteredEvents() {
  const today = todayStr();
  const q = ui.q.trim().toLowerCase();
  return state.events.filter(e => {
    if (ui.hideDone && e.done) return false;
    if (ui.cat !== 'all' && e.cat !== ui.cat) return false;
    if (ui.range === 'today' && e.date !== today) return false;
    if (ui.range === 'upcoming' && e.date < today) return false;
    if (ui.range === 'past' && e.date >= today) return false;
    if (q && !e.title.toLowerCase().includes(q)) return false;
    return true;
  });
}

/* ---------- 4. 화면 그리기 ---------- */
function applyTheme() {
  const root = document.documentElement;
  root.dataset.theme = state.settings.dark ? 'dark' : 'light';
  root.dataset.size = state.settings.size;
  root.style.setProperty('--accent', state.settings.accent);
}

function renderNav() {
  const html = TABS.map(t =>
    `<button class="nav-btn${ui.tab === t.id ? ' active' : ''}" data-action="goTab" data-tab="${t.id}" ${ui.tab === t.id ? 'aria-current="page"' : ''}>${ICONS[t.id === 'home' ? 'home' : t.id]}<span>${t.label}</span></button>`
  ).join('');
  $('#sideNav').innerHTML = html;
  $('#tabBar').innerHTML = html;
  $('#profileMini').innerHTML = `<span class="avatar">${state.profile.avatar}</span><span><div class="nm">${esc(state.profile.name || '나')}</div><div class="st">${esc(state.profile.status || '프로필 · 설정')}</div></span>`;
}

function setTab(id) {
  ui.tab = id;
  TABS.forEach(t => { $('#tab-' + t.id).hidden = t.id !== id; });
  renderNav();
  renderTab(id);
  window.scrollTo(0, 0);
}
function renderTab(id) {
  if (id === 'home') renderHome();
  if (id === 'calendar') renderCalendar();
  if (id === 'friends') renderFriends();
  if (id === 'settings') renderSettings();
}
function renderAll() { renderNav(); renderTab(ui.tab); }

/* ----- 홈 ----- */
function eventCardHTML(e, { friend } = {}) {
  const cat = catOf(e.cat);
  const today = todayStr();
  const overdue = !friend && !e.done && e.date < today;

  if (friend) {
    return `<article class="ev is-friend" style="--c:${friend.color}">
      <span class="avatar sm" style="--c:${friend.color}">${esc(friend.avatar)}</span>
      <div class="ev-main">
        <div class="ev-title">${esc(e.t)}</div>
        <div class="ev-meta"><span class="pill" style="--c:${friend.color}">${esc(friend.name)}</span><span class="pill" style="--c:${cat.color}">${cat.emoji} ${cat.label}</span>${e.x ? '<span class="pill plain">완료</span>' : ''}</div>
      </div>
    </article>`;
  }
  return `<article class="ev${e.done ? ' done' : ''}${overdue ? ' overdue' : ''}" data-id="${e.id}" style="--c:${cat.color}">
    <input type="checkbox" data-action="toggle" ${e.done ? 'checked' : ''} aria-label="완료 처리: ${esc(e.title)}">
    <div class="ev-main" data-action="edit" title="눌러서 수정">
      <div class="ev-title">${esc(e.title)}</div>
      <div class="ev-meta">
        <span class="pill">${cat.emoji} ${cat.label}</span>
        ${overdue ? '<span class="pill late">기한 지남</span>' : ''}
        ${e.shared ? '<span class="pill plain">🔗 공유 중</span>' : ''}
      </div>
    </div>
    <div class="ev-actions">
      <button class="icon-btn star${e.important ? ' on' : ''}" data-action="star" aria-label="중요 표시" aria-pressed="${e.important}">${e.important ? '★' : '☆'}</button>
      <button class="icon-btn edit" data-action="edit" aria-label="수정">${ICONS.edit}</button>
      <button class="icon-btn del" data-action="delete" aria-label="삭제">${ICONS.trash}</button>
    </div>
  </article>`;
}

function renderHome() {
  const p = state.profile;
  const total = state.events.length;
  const done = state.events.filter(e => e.done).length;
  const remain = total - done; // 필수 7: 남은 일정 개수
  const today = todayStr();
  const todayRemain = state.events.filter(e => !e.done && e.date === today).length;
  const h = new Date().getHours();
  const greet = h < 12 ? '좋은 아침이에요' : h < 18 ? '좋은 오후예요' : '좋은 저녁이에요';

  $('#helloText').textContent = `${p.avatar} ${greet}, ${p.name || '나'}님`;
  $('#remainCount').textContent = remain;
  $('#progressBar').style.width = (total ? Math.round(done / total * 100) : 0) + '%';
  $('#progressText').textContent = total
    ? `오늘 남은 일정 ${todayRemain}개 · 전체 ${total}개 중 ${done}개 완료 (${Math.round(done / total * 100)}%)`
    : '아직 일정이 없어요. 아래에서 첫 일정을 추가해 보세요.';

  // 폼 기본값
  const cats = activeCats();
  const catSel = $('#catInput');
  const prev = catSel.value;
  catSel.innerHTML = cats.map(c => `<option value="${c.id}">${c.emoji} ${c.label}</option>`).join('');
  if (cats.some(c => c.id === prev)) catSel.value = prev;
  if (!$('#dateInput').value) $('#dateInput').value = today;

  // 친구들의 오늘 일정
  const ft = [];
  state.friends.filter(f => f.visible).forEach(f => {
    f.events.filter(e => e.d === today).forEach(e => ft.push({ f, e }));
  });
  $('#friendsToday').innerHTML = ft.length
    ? `<div class="friends-today"><h3>오늘 친구들 일정</h3>${ft.slice(0, 5).map(({ f, e }) =>
        `<div class="ft-row"><span class="avatar sm" style="--c:${f.color}">${esc(f.avatar)}</span><span><b>${esc(f.name)}</b> ${esc(e.t)}</span></div>`).join('')}</div>`
    : '';

  // 필터 칩
  const ranges = [['all', '전체'], ['today', '오늘'], ['upcoming', '예정'], ['past', '지난 일정']];
  $('#rangeChips').innerHTML = ranges.map(([id, label]) =>
    `<button type="button" class="chip${ui.range === id ? ' on' : ''}" data-action="range" data-v="${id}" aria-pressed="${ui.range === id}">${label}</button>`).join('');
  $('#catChips').innerHTML = [`<button type="button" class="chip${ui.cat === 'all' ? ' on' : ''}" data-action="catFilter" data-v="all">모든 카테고리</button>`]
    .concat(cats.map(c => `<button type="button" class="chip${ui.cat === c.id ? ' on' : ''}" data-action="catFilter" data-v="${c.id}">${c.emoji} ${c.label}</button>`)).join('');
  $('#hideDone').checked = ui.hideDone;

  renderList();
}

function renderList() {
  const list = filteredEvents();
  const box = $('#eventList');
  $('#listMeta').textContent = state.events.length ? `${list.length}개의 일정이 보여요` : '';

  if (!list.length) {
    const hasAny = state.events.length > 0;
    box.innerHTML = `<div class="empty"><div class="big">${hasAny ? '🔍' : '🗓️'}</div><b>${hasAny ? '조건에 맞는 일정이 없어요' : '등록된 일정이 없어요'}</b>${hasAny ? '검색어나 필터를 바꿔 보세요.' : '위에 제목과 날짜를 넣고 추가 버튼을 눌러 보세요.'}</div>`;
    return;
  }
  const today = todayStr();
  let pastShown = false;
  box.innerHTML = groupByDate(list).map(g => {
    const n = diffDays(g.date, today);
    const name = n === 0 ? '오늘' : n === 1 ? '내일' : n === -1 ? '어제' : dateLabel(g.date);
    const sub = (n >= -1 && n <= 1) ? `<small>${dateLabel(g.date)}</small>` : '';
    const pastTitle = (n < 0 && !pastShown && (pastShown = true)) ? '<p class="sub-title">지난 일정</p>' : '';
    return `${pastTitle}<section class="day-group"><div class="day-head"><h3>${name}${sub}</h3><span class="dday${n === 0 ? ' today' : n < 0 ? ' past' : ''}">${ddayText(g.date)}</span></div>${g.items.map(e => eventCardHTML(e)).join('')}</section>`;
  }).join('');
}

/* ----- 달력 ----- */
function renderCalendar() {
  const { calYear: y, calMonth: m } = ui;
  $('#calTitle').textContent = `${y}년 ${m + 1}월`;
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const today = todayStr();

  // 날짜별로 어떤 사람(색)의 일정이 있는지 모아요
  const dots = {};
  const mark = (date, color) => { (dots[date] = dots[date] || new Set()).add(color); };
  state.events.forEach(e => mark(e.date, state.settings.accent));
  state.friends.filter(f => f.visible).forEach(f => f.events.forEach(e => mark(e.d, f.color)));

  let html = '';
  for (let i = 0; i < first; i++) html += '<span class="cal-cell empty-cell"></span>';
  for (let d = 1; d <= days; d++) {
    const ds = `${y}-${pad(m + 1)}-${pad(d)}`;
    const dow = (first + d - 1) % 7;
    const cls = ['cal-cell', ds === today ? 'today' : '', ds === ui.selected ? 'selected' : '', dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''].join(' ');
    const dd = dots[ds] ? [...dots[ds]].slice(0, 4).map(c => `<b style="--c:${c}"></b>`).join('') : '';
    html += `<button class="${cls}" data-action="selectDay" data-date="${ds}" aria-label="${m + 1}월 ${d}일"><span>${d}</span><i class="dots">${dd}</i></button>`;
  }
  $('#calGrid').innerHTML = html;

  $('#calLegend').innerHTML = `<span><i style="--c:${state.settings.accent}"></i>나</span>` +
    state.friends.filter(f => f.visible).map(f => `<span><i style="--c:${f.color}"></i>${esc(f.name)}</span>`).join('');

  renderDayPanel();
}

function renderDayPanel() {
  const ds = ui.selected;
  const mine = state.events.filter(e => e.date === ds)
    .sort((a, b) => (a.done - b.done) || (b.important - a.important) || (a.createdAt - b.createdAt));
  const theirs = [];
  state.friends.filter(f => f.visible).forEach(f => f.events.filter(e => e.d === ds).forEach(e => theirs.push({ f, e })));

  $('#dayPanel').innerHTML = `
    <div class="day-panel-head">
      <h3>${dateLabel(ds)} <span class="dday${ds === todayStr() ? ' today' : diffDays(ds, todayStr()) < 0 ? ' past' : ''}">${ddayText(ds)}</span></h3>
      <button class="btn primary small" data-action="addOnDay">+ 이 날 일정 추가</button>
    </div>
    ${mine.length ? mine.map(e => eventCardHTML(e)).join('') : '<p class="muted" style="padding:4px">내 일정이 없어요.</p>'}
    ${theirs.length ? `<p class="sub-title">친구 일정</p>${theirs.map(({ f, e }) => eventCardHTML(e, { friend: f })).join('')}` : ''}`;
}

/* ----- 친구 · 공유 ----- */
function renderFriends() {
  const sharedCount = state.events.filter(e => e.shared).length;
  const share = buildShare();

  // 함께 비는 날 (나 + 보이는 친구 모두 일정이 없는 날, 앞으로 14일)
  const visible = state.friends.filter(f => f.visible);
  const busy = new Set(state.events.map(e => e.date));
  visible.forEach(f => f.events.forEach(e => busy.add(e.d)));
  const free = [];
  for (let i = 0; i < 14; i++) { const d = addDays(todayStr(), i); if (!busy.has(d)) free.push(d); }

  $('#tab-friends').innerHTML = `
    <h1 class="page-title">친구와 일정 공유</h1>

    <div class="card">
      <h2>내 일정 보내기</h2>
      <p class="help">${sharedCount
        ? `'친구에게 공유'를 켠 일정 ${sharedCount}개가 담겨요. 일정을 바꾸면 링크를 다시 보내 주세요.`
        : '아직 공유 중인 일정이 없어요. 일정을 추가할 때 <b>친구에게 공유</b>를 켜 보세요.'}
        서버가 없는 앱이라, 링크나 코드를 메신저로 보내는 방식이에요.</p>
      <div class="row">
        <button class="btn primary" data-action="copyLink">링크 복사</button>
        <button class="btn ghost" data-action="copyCode">코드 복사</button>
        ${navigator.share ? '<button class="btn ghost" data-action="nativeShare">공유하기</button>' : ''}
      </div>
      <textarea class="code-box" readonly aria-label="공유 코드">${esc(share.code)}</textarea>
    </div>

    <div class="card">
      <h2>친구 일정 받기</h2>
      <p class="help">친구가 보낸 링크나 코드를 아래에 붙여넣으세요. 링크를 바로 열어도 추가돼요.</p>
      <textarea id="importInput" class="code-box" placeholder="링크 또는 코드 붙여넣기" aria-label="친구 코드"></textarea>
      <div class="row"><button class="btn primary" data-action="importFromInput">친구 추가</button></div>
    </div>

    <div class="card">
      <h2>친구 ${state.friends.length}명</h2>
      ${state.friends.length ? state.friends.map(f => `
        <div class="friend">
          <span class="avatar" style="--c:${f.color}">${esc(f.avatar)}</span>
          <div class="grow"><div class="nm">${esc(f.name)}</div><div class="st">${f.status ? esc(f.status) + ' · ' : ''}일정 ${f.events.length}개 · ${new Date(f.updatedAt).getMonth() + 1}/${new Date(f.updatedAt).getDate()} 업데이트</div></div>
          <label class="switch" title="달력에 표시"><input type="checkbox" data-action="friendVisible" data-id="${f.id}" ${f.visible ? 'checked' : ''} aria-label="${esc(f.name)} 일정 표시"><i></i></label>
          <button class="icon-btn del" data-action="removeFriend" data-id="${f.id}" aria-label="${esc(f.name)} 삭제">${ICONS.trash}</button>
        </div>`).join('')
        : '<p class="help">아직 추가한 친구가 없어요.</p>'}
    </div>

    <div class="card">
      <h2>함께 비는 날 (앞으로 14일)</h2>
      ${visible.length
        ? (free.length ? `<div class="free-days">${free.slice(0, 10).map(d => `<span>${dateLabel(d)}</span>`).join('')}</div>` : '<p class="help">앞으로 2주 동안 모두 비는 날이 없어요.</p>')
        : '<p class="help">친구를 추가하면 모두의 일정이 없는 날을 찾아 드려요.</p>'}
    </div>`;
}

/* ----- 설정 ----- */
function renderSettings() {
  const p = state.profile, s = state.settings;
  $('#tab-settings').innerHTML = `
    <h1 class="page-title">프로필 · 설정</h1>

    <div class="card">
      <h2>프로필</h2>
      <div class="row"><span class="avatar lg">${p.avatar}</span>
        <div class="grow">
          <label class="lbl" for="nameInput">이름</label>
          <input id="nameInput" class="text-input" maxlength="12" value="${esc(p.name)}" data-action="nameInput">
        </div></div>
      <div><label class="lbl" for="statusInput">상태 메시지 (친구에게 보여요)</label>
        <input id="statusInput" class="text-input" maxlength="30" placeholder="예: 시험기간 ㅠㅠ" value="${esc(p.status)}" data-action="statusInput"></div>
      <div><label class="lbl">캐릭터</label>
        <div class="avatar-grid">${AVATARS.map(a => `<button class="avatar-opt${p.avatar === a ? ' on' : ''}" data-action="setAvatar" data-v="${a}" aria-label="캐릭터 ${a}">${a}</button>`).join('')}</div></div>
    </div>

    <div class="card">
      <h2>이 플래너를 쓰는 목적</h2>
      <p class="help">고른 목적이 일정 카테고리가 돼요. 여러 개 골라도 돼요.</p>
      <div class="chips">${CATS.map(c => `<button class="chip${p.purposes.includes(c.id) ? ' on' : ''}" data-action="togglePurpose" data-v="${c.id}" aria-pressed="${p.purposes.includes(c.id)}">${c.emoji} ${c.label}</button>`).join('')}</div>
    </div>

    <div class="card">
      <h2>화면</h2>
      <div class="row between"><div><b>다크 모드</b><div class="help">눈이 편한 어두운 화면</div></div>
        <label class="switch"><input type="checkbox" data-action="dark" ${s.dark ? 'checked' : ''} aria-label="다크 모드"><i></i></label></div>
      <div><label class="lbl">테마 색상</label>
        <div class="swatches">${ACCENTS.map(c => `<button class="swatch${s.accent === c ? ' on' : ''}" style="--c:${c}" data-action="setAccent" data-v="${c}" aria-label="테마 색 ${c}">${s.accent === c ? '✓' : ''}</button>`).join('')}</div></div>
      <div><label class="lbl">글자 크기</label>
        <div class="seg">${[['sm', '작게'], ['md', '보통'], ['lg', '크게']].map(([v, l]) => `<button class="${s.size === v ? 'on' : ''}" data-action="setSize" data-v="${v}">${l}</button>`).join('')}</div></div>
    </div>

    <div class="card">
      <h2>데이터</h2>
      <p class="help">일정은 이 브라우저(localStorage)에만 저장돼요. 다른 기기와는 공유 탭의 링크로 주고받아요.</p>
      <div class="row">
        <button class="btn ghost" data-action="replayOnboarding">시작 화면 다시 보기</button>
        <button class="btn danger" data-action="resetAll">모든 데이터 지우기</button>
      </div>
    </div>`;
}

/* ----- 모달 · 토스트 ----- */
function openModal(html) {
  closeModal();
  $('#modalRoot').innerHTML = `<div class="modal-backdrop" data-action="backdrop"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  const first = $('#modalRoot input, #modalRoot button');
  if (first) first.focus();
}
function closeModal() { $('#modalRoot').innerHTML = ''; }

function openEditModal(id) {
  const e = state.events.find(x => x.id === id);
  if (!e) return;
  const cats = activeCats().some(c => c.id === e.cat) ? activeCats() : activeCats().concat(catOf(e.cat));
  openModal(`
    <h2>일정 수정</h2>
    <form id="editForm" data-id="${e.id}" autocomplete="off" style="display:flex;flex-direction:column;gap:12px">
      <div><label class="lbl" for="editTitle">제목</label><input id="editTitle" class="text-input" maxlength="60" value="${esc(e.title)}" required></div>
      <div class="row">
        <div class="grow"><label class="lbl" for="editDate">날짜</label><input id="editDate" type="date" class="text-input" value="${e.date}" required></div>
        <div class="grow"><label class="lbl" for="editCat">카테고리</label><select id="editCat" class="text-input">${cats.map(c => `<option value="${c.id}"${c.id === e.cat ? ' selected' : ''}>${c.emoji} ${c.label}</option>`).join('')}</select></div>
      </div>
      <label class="check-inline"><input type="checkbox" id="editImportant" ${e.important ? 'checked' : ''}> ★ 중요한 일정</label>
      <label class="check-inline"><input type="checkbox" id="editShared" ${e.shared ? 'checked' : ''}> 친구에게 공유</label>
      <div class="actions">
        <button type="button" class="btn ghost" data-action="closeModal">취소</button>
        <button type="submit" class="btn primary">저장</button>
      </div>
    </form>`);
}

let toastTimer;
function toast(msg, actionLabel, onAction) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${actionLabel ? `<button type="button">${esc(actionLabel)}</button>` : ''}`;
  t.hidden = false;
  if (actionLabel) {
    $('button', t).onclick = () => { t.hidden = true; clearTimeout(toastTimer); onAction && onAction(); };
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, actionLabel ? 6000 : 2600);
}

/* ---------- 5. 공유 (서버 없이: 일정을 글자(코드)로 바꿔서 주고받아요) ---------- */
function encodePayload(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodePayload(code) {
  let b = code.replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  const bin = atob(b);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
function buildShare() {
  const p = state.profile;
  const payload = {
    v: 1, id: p.id, n: p.name || '친구', a: p.avatar, k: state.settings.accent, m: p.status,
    e: state.events.filter(e => e.shared).map(e => ({ t: e.title, d: e.date, c: e.cat, x: e.done })),
  };
  const code = encodePayload(payload);
  const base = location.protocol === 'file:' ? location.href.split('#')[0] : location.origin + location.pathname;
  return { code, link: `${base}#share=${code}` };
}
function extractCode(text) {
  const t = text.trim();
  const i = t.indexOf('#share=');
  return (i >= 0 ? t.slice(i + 7) : t).replace(/\s+/g, '');
}
// 받은 코드가 올바른지 검사하고 안전한 형태로 정리해요
function sanitizeShare(p) {
  if (!p || p.v !== 1 || typeof p.id !== 'string' || !Array.isArray(p.e)) return null;
  return {
    id: p.id.slice(0, 40),
    name: String(p.n || '친구').slice(0, 12),
    avatar: AVATARS.includes(p.a) ? p.a : '🙂',
    color: /^#[0-9a-f]{6}$/i.test(p.k) ? p.k : ACCENTS[1],
    status: String(p.m || '').slice(0, 30),
    events: p.e.slice(0, 300)
      .filter(x => x && typeof x.t === 'string' && typeof x.d === 'string' && isValidDate(x.d))
      .map(x => ({ t: x.t.slice(0, 60), d: x.d, c: CATS.some(c => c.id === x.c) ? x.c : 'personal', x: !!x.x })),
  };
}
function parseShareInput(text) {
  try { return sanitizeShare(decodePayload(extractCode(text))); } catch (e) { return null; }
}
function openImportModal(share) {
  if (share.id === state.profile.id) { toast('내가 보낸 코드예요'); return; }
  const exists = state.friends.some(f => f.id === share.id);
  openModal(`
    <h2>${exists ? '친구 일정 업데이트' : '친구 추가'}</h2>
    <div class="row"><span class="avatar lg" style="--c:${share.color}">${share.avatar}</span>
      <div><b style="font-size:1.1rem">${esc(share.name)}</b><div class="help muted">${share.status ? esc(share.status) + '<br>' : ''}일정 ${share.events.length}개</div></div></div>
    <p class="help muted">${exists ? '이미 추가한 친구예요. 최신 일정으로 바꿀까요?' : '이 친구의 일정을 내 달력에 함께 표시할까요?'}</p>
    <div class="actions">
      <button class="btn ghost" data-action="closeModal">취소</button>
      <button class="btn primary" data-action="confirmImport">${exists ? '업데이트' : '추가'}</button>
    </div>`);
  pendingShare = share;
}
function importFriend(share) {
  const old = state.friends.find(f => f.id === share.id);
  if (old) {
    Object.assign(old, { name: share.name, avatar: share.avatar, status: share.status, events: share.events, updatedAt: Date.now() });
  } else {
    // 다른 사람과 색이 겹치지 않게 고르기
    const used = [state.settings.accent, ...state.friends.map(f => f.color)].map(c => c.toLowerCase());
    let color = share.color;
    if (used.includes(color.toLowerCase())) color = ACCENTS.find(c => !used.includes(c.toLowerCase())) || color;
    state.friends.push({ id: share.id, name: share.name, avatar: share.avatar, color, status: share.status, events: share.events, visible: true, updatedAt: Date.now() });
  }
  save();
}
function copyText(text, okMsg) {
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { /* 무시 */ }
    ta.remove();
    toast(ok ? okMsg : '복사하지 못했어요. 아래 칸을 길게 눌러 복사해 주세요');
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => toast(okMsg), fallback);
  } else fallback();
}

/* ---------- 6. 시작 화면(온보딩) ---------- */
const ob = { step: 0, name: '', avatar: AVATARS[0], purposes: [] };
const OB_LAST = 3;

function startOnboarding() {
  ob.step = 0; ob.name = state.profile.name; ob.avatar = state.profile.avatar; ob.purposes = state.profile.purposes.slice();
  $('#app').hidden = true;
  $('#onboarding').hidden = false;
  renderOnboarding();
}
function renderOnboarding() {
  const box = $('#onboarding');
  const top = ob.step === 0 ? '<div class="ob-top"></div>' : `<div class="ob-top">
      <button class="ob-back" data-action="obBack" aria-label="이전">‹</button>
      <div class="ob-bar"><i style="width:${ob.step / OB_LAST * 100}%"></i></div>
      <span class="ob-count">${ob.step}/${OB_LAST}</span></div>`;
  let body = '';

  if (ob.step === 0) {
    body = `<div class="ob-body ob-welcome">
        <div class="ob-logo">▦</div>
        <h1>나만의 플래너,<br>3가지만 알려 주세요</h1>
        <p class="help">이름, 사용 목적, 테마 색을 고르면 바로 시작할 수 있어요. 30초면 끝나요.</p>
      </div>
      <button class="btn primary block" data-action="obNext">시작하기</button>`;
  } else if (ob.step === 1) {
    body = `<div class="ob-body">
        <h1>뭐라고 불러 드릴까요?</h1>
        <p class="help">친구에게 일정을 공유할 때도 이 이름이 보여요.</p>
        <input id="obName" class="text-input" maxlength="12" placeholder="이름 또는 닉네임" value="${esc(ob.name)}" aria-label="이름">
        <div><label class="lbl">나를 닮은 캐릭터</label>
          <div class="avatar-grid">${AVATARS.map(a => `<button class="avatar-opt${ob.avatar === a ? ' on' : ''}" data-action="obAvatar" data-v="${a}" aria-label="캐릭터 ${a}">${a}</button>`).join('')}</div></div>
      </div>
      <button id="obContinue" class="btn primary block" data-action="obNext" ${ob.name.trim() ? '' : 'disabled'}>계속</button>`;
  } else if (ob.step === 2) {
    body = `<div class="ob-body">
        <h1>어떤 용도로 쓰실 건가요?</h1>
        <p class="help">여러 개 골라도 돼요. 고른 목적이 일정 카테고리가 돼요.</p>
        <div class="purpose-list">${CATS.map(c => `<button class="purpose${ob.purposes.includes(c.id) ? ' on' : ''}" data-action="obPurpose" data-v="${c.id}" aria-pressed="${ob.purposes.includes(c.id)}">
          <span class="em">${c.emoji}</span><span><div class="t">${c.label}</div><div class="d">${c.desc}</div></span><span class="tick">✓</span></button>`).join('')}</div>
      </div>
      <button id="obContinue" class="btn primary block" data-action="obNext" ${ob.purposes.length ? '' : 'disabled'}>계속</button>`;
  } else {
    body = `<div class="ob-body">
        <h1>마음에 드는 색을<br>골라 보세요</h1>
        <p class="help">나중에 설정에서 언제든 바꿀 수 있어요.</p>
        <div class="swatches">${ACCENTS.map(c => `<button class="swatch${state.settings.accent === c ? ' on' : ''}" style="--c:${c}" data-action="obAccent" data-v="${c}" aria-label="테마 색 ${c}">${state.settings.accent === c ? '✓' : ''}</button>`).join('')}</div>
        <div class="row between card" style="padding:14px 16px;border-radius:14px"><div><b>다크 모드</b></div>
          <label class="switch"><input type="checkbox" data-action="obDark" ${state.settings.dark ? 'checked' : ''} aria-label="다크 모드"><i></i></label></div>
      </div>
      <button class="btn primary block" data-action="obFinish">플래너 시작하기</button>`;
  }
  box.innerHTML = `<div class="ob-wrap">${top}${body}</div>`;
  const nameInput = $('#obName');
  if (nameInput) nameInput.focus();
}
function finishOnboarding() {
  state.profile.name = ob.name.trim();
  state.profile.avatar = ob.avatar;
  state.profile.purposes = ob.purposes.slice();
  state.onboarded = true;
  save();
  $('#onboarding').hidden = true;
  $('#app').hidden = false;
  applyTheme();
  setTab('home');
  if (pendingShare) openImportModal(pendingShare);
}

/* ---------- 7. 이벤트 연결 · 시작 ---------- */
function setStarButton(on) {
  ui.newStar = on;
  const b = $('#starBtn');
  b.setAttribute('aria-pressed', on);
  b.textContent = on ? '★' : '☆';
}

// 일정 추가 폼
$('#addForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const titleEl = $('#titleInput');
  const title = titleEl.value.trim();
  const date = $('#dateInput').value;
  if (!title) { toast('일정 제목을 입력해 주세요'); titleEl.focus(); return; }
  if (!date) { toast('날짜를 선택해 주세요'); $('#dateInput').focus(); return; }
  addEvent({ title, date, cat: $('#catInput').value, important: ui.newStar, shared: $('#shareInput').checked });
  titleEl.value = '';
  setStarButton(false);
  $('#shareInput').checked = catOf($('#catInput').value).share;
  renderAll();
  titleEl.focus();
});
$('#starBtn').addEventListener('click', () => setStarButton(!ui.newStar));
$('#catInput').addEventListener('change', e => { $('#shareInput').checked = catOf(e.target.value).share; });

// 검색 · 완료 숨기기
$('#searchInput').addEventListener('input', e => { ui.q = e.target.value; renderList(); });
$('#hideDone').addEventListener('change', e => { ui.hideDone = e.target.checked; renderList(); });

// 클릭 처리 (data-action 으로 어떤 버튼인지 구분해요)
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  const card = el.closest('[data-id]');
  const id = card ? card.dataset.id : el.dataset.id;

  switch (a) {
    case 'goTab': setTab(el.dataset.tab); break;
    case 'range': ui.range = el.dataset.v; renderHome(); break;
    case 'catFilter': ui.cat = el.dataset.v; renderHome(); break;
    case 'star': toggleStar(id); renderAll(); break;
    case 'edit': openEditModal(id); break;
    case 'delete': deleteEvent(id); break;

    case 'prevMonth': ui.calMonth--; if (ui.calMonth < 0) { ui.calMonth = 11; ui.calYear--; } renderCalendar(); break;
    case 'nextMonth': ui.calMonth++; if (ui.calMonth > 11) { ui.calMonth = 0; ui.calYear++; } renderCalendar(); break;
    case 'thisMonth': { const d = new Date(); ui.calYear = d.getFullYear(); ui.calMonth = d.getMonth(); ui.selected = todayStr(); renderCalendar(); break; }
    case 'selectDay': ui.selected = el.dataset.date; renderCalendar(); break;
    case 'addOnDay':
      $('#dateInput').value = ui.selected;
      setTab('home');
      $('#titleInput').focus();
      toast(`${dateLabel(ui.selected)}에 추가할 일정을 입력하세요`);
      break;

    case 'copyLink': copyText(buildShare().link, '링크를 복사했어요'); break;
    case 'copyCode': copyText(buildShare().code, '코드를 복사했어요'); break;
    case 'nativeShare':
      navigator.share({ title: `${state.profile.name}님의 플래너`, text: '내 일정을 공유해요', url: buildShare().link }).catch(() => {});
      break;
    case 'importFromInput': {
      const text = $('#importInput').value;
      if (!text.trim()) { toast('링크나 코드를 붙여넣어 주세요'); break; }
      const share = parseShareInput(text);
      if (!share) { toast('올바른 코드가 아니에요. 다시 확인해 주세요'); break; }
      openImportModal(share);
      break;
    }
    case 'confirmImport':
      if (pendingShare) {
        const name = pendingShare.name;
        importFriend(pendingShare);
        pendingShare = null;
        closeModal();
        renderAll();
        toast(`${name}님의 일정을 추가했어요`);
      }
      break;
    case 'removeFriend': {
      const f = state.friends.find(x => x.id === id);
      if (f && confirm(`${f.name}님을 친구 목록에서 지울까요?`)) {
        state.friends = state.friends.filter(x => x.id !== id);
        save(); renderAll();
      }
      break;
    }

    case 'setAvatar': state.profile.avatar = el.dataset.v; save(); renderNav(); renderSettings(); break;
    case 'togglePurpose': {
      const list = state.profile.purposes, v = el.dataset.v;
      if (list.includes(v) && list.length === 1) { toast('목적은 하나 이상 골라야 해요'); break; }
      state.profile.purposes = list.includes(v) ? list.filter(x => x !== v) : list.concat(v);
      if (!activeCats().some(c => c.id === ui.cat)) ui.cat = 'all';
      save(); renderSettings(); break;
    }
    case 'setAccent': state.settings.accent = el.dataset.v; save(); applyTheme(); renderSettings(); break;
    case 'setSize': state.settings.size = el.dataset.v; save(); applyTheme(); renderSettings(); break;
    case 'replayOnboarding': startOnboarding(); break;
    case 'resetAll':
      if (confirm('모든 일정과 설정을 지울까요? 되돌릴 수 없어요.')) {
        localStorage.removeItem(STORAGE_KEY);
        state = defaultState();
        applyTheme();
        startOnboarding();
      }
      break;

    case 'closeModal': closeModal(); break;
    case 'backdrop': if (ev.target === el) closeModal(); break;

    // 시작 화면
    case 'obNext': ob.step++; renderOnboarding(); break;
    case 'obBack': ob.step--; renderOnboarding(); break;
    case 'obAvatar': ob.avatar = el.dataset.v; renderOnboarding(); break;
    case 'obPurpose': {
      const v = el.dataset.v;
      ob.purposes = ob.purposes.includes(v) ? ob.purposes.filter(x => x !== v) : ob.purposes.concat(v);
      renderOnboarding(); break;
    }
    case 'obAccent': state.settings.accent = el.dataset.v; applyTheme(); renderOnboarding(); break;
    case 'obFinish': finishOnboarding(); break;
  }
});

// 체크박스 / 스위치 / 입력칸
document.addEventListener('change', ev => {
  const el = ev.target;
  const a = el.dataset && el.dataset.action;
  if (!a) return;
  if (a === 'toggle') {
    const id = el.closest('[data-id]').dataset.id;
    toggleDone(id);
    renderAll();
  } else if (a === 'friendVisible') {
    const f = state.friends.find(x => x.id === el.dataset.id);
    if (f) { f.visible = el.checked; save(); }
  } else if (a === 'dark') {
    state.settings.dark = el.checked; save(); applyTheme();
  } else if (a === 'obDark') {
    state.settings.dark = el.checked; applyTheme();
  }
});
document.addEventListener('input', ev => {
  const el = ev.target;
  if (el.id === 'obName') {
    ob.name = el.value;
    const btn = $('#obContinue');
    if (btn) btn.disabled = !ob.name.trim();
  } else if (el.dataset && el.dataset.action === 'nameInput') {
    state.profile.name = el.value.trim() || state.profile.name; save(); renderNav();
  } else if (el.dataset && el.dataset.action === 'statusInput') {
    state.profile.status = el.value; save(); renderNav();
  }
});
document.addEventListener('submit', ev => {
  if (ev.target.id !== 'editForm') return;
  ev.preventDefault();
  const title = $('#editTitle').value.trim();
  const date = $('#editDate').value;
  if (!title || !date) { toast('제목과 날짜를 입력해 주세요'); return; }
  updateEvent(ev.target.dataset.id, {
    title, date, cat: $('#editCat').value,
    important: $('#editImportant').checked, shared: $('#editShared').checked,
  });
  closeModal();
  renderAll();
  toast('일정을 수정했어요');
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && $('#modalRoot').firstChild) closeModal();
});

// 링크로 들어온 친구 일정 (#share=...)
function checkShareLink() {
  if (!location.hash.startsWith('#share=')) return;
  const share = parseShareInput(location.hash);
  history.replaceState(null, '', location.pathname + location.search);
  if (!share) { setTimeout(() => toast('공유 링크를 읽지 못했어요'), 300); return; }
  pendingShare = share;
}

function init() {
  applyTheme();
  checkShareLink();
  if (state.onboarded) {
    $('#app').hidden = false;
    setTab('home');
    if (pendingShare) openImportModal(pendingShare);
  } else {
    startOnboarding();
  }
}
init();