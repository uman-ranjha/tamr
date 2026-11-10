import { migrateToSync, getSettings, getLog, setDone, windowsFor, allWindows, status, urgency, dayKey, isFriday, fmtLeft, fmtClock, hijriLabel } from './lib/core.js';
import { miswak, walker } from './lib/art.js';
import { VERSES, DUAS, NAMES, SURAH_AR } from './lib/daily.js';
import { here, cityAt, km } from './lib/place.js';
import { t, num, lang, locale, localize, isRtl, LANGS } from './lib/i18n.js';

const $ = id => document.getElementById(id);
const DEFAULT_SHOW = { glinks: true, prayer: true, shortcuts: true, daily: true, miswak: true, h24: false, hideseek: true };
// Starter shortcuts for new installs. Once someone edits theirs, the saved list (synced) is used instead.
const DEFAULT_SHORTCUTS = [
  { name: 'Google', url: 'https://www.google.com/' },
  { name: 'YouTube', url: 'https://www.youtube.com/' },
  { name: 'Gmail', url: 'https://mail.google.com/' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org/' },
  { name: 'Quran.com', url: 'https://quran.com/' },
];

let nt = { show: { ...DEFAULT_SHOW }, name: '', sky: 'auto', tab: 'verse', shortcuts: DEFAULT_SHORTCUTS, shuffle: 0, shuffleDay: '' };
// Only plain web links are allowed, both when adding and when loading (a synced list could hold anything).
const webUrl = u => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };
const cleanShortcuts = list => (Array.isArray(list) ? list : [])
  .filter(sc => sc && typeof sc.name === 'string' && sc.name.trim() && webUrl(sc.url))
  .map(sc => ({ name: sc.name.trim().slice(0, 40), url: webUrl(sc.url) })).slice(0, 14);
const save = () => chrome.storage.sync.set({ newtab: nt });
const pick = a => a[Math.floor(Math.random() * a.length)];

// ---------- clock & greeting ----------
function renderClock(now) {
  const h = now.getHours(), m = String(now.getMinutes()).padStart(2, '0');
  if (lang() === 'en') {
    if (nt.show.h24) { $('time').textContent = `${String(h).padStart(2, '0')}:${m}`; $('ampm').textContent = ''; }
    else { $('time').textContent = `${h % 12 || 12}:${m}`; $('ampm').textContent = h < 12 ? 'am' : 'pm'; }
  } else {   // the language's own digits and its own word for am/pm
    const parts = new Intl.DateTimeFormat(locale(), { hour: 'numeric', minute: '2-digit', hour12: !nt.show.h24 }).formatToParts(now);
    $('time').textContent = parts.filter(p => p.type !== 'dayPeriod').map(p => p.value).join('').trim();
    $('ampm').textContent = parts.find(p => p.type === 'dayPeriod')?.value || '';
  }
  const part = t(h < 5 ? 'greet_night' : h < 12 ? 'greet_morning' : h < 17 ? 'greet_afternoon' : h < 21 ? 'greet_evening' : 'greet_late');
  $('greet').textContent = nt.name ? `${part}، ${nt.name}`.replace('،', isRtl() ? '،' : ',') : part;
  $('date').textContent = `${now.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })} · ${hijriLabel(now)}`;
}

// Time of day, by prayer times: morning (Fajr→Dhuhr), day (→Maghrib), evening (→2h after Isha), night.
function slotFor(now, s) {
  const ws = windowsFor(now, s);
  if (now >= ws[0].start && now < ws[1].start) return 'morning';
  if (now >= ws[1].start && now < ws[3].start) return 'day';
  if (now >= ws[3].start && now < +ws[4].start + 120 * 60000) return 'evening';
  return 'night';
}

// ---------- sky: the backdrop follows the prayer times ----------
// Tokens for each sky; cards and lines blend along with the backdrop so text stays readable.
const SKY = {
  night:  { bg: '#0a2429', card: '#0f3134', card2: '#0d2d30', line: '#1d4a4c', muted: '#9fb9b6' },
  dawn:   { bg: '#1a3c48', card: '#183c46', card2: '#163843', line: '#2c5a62', muted: '#c2d3cf' },
  day:    { bg: '#13504f', card: '#144a49', card2: '#124443', line: '#2a6c69', muted: '#b9d3cf' },
  golden: { bg: '#26403b', card: '#24403b', card2: '#213b36', line: '#4a5a48', muted: '#c9d2c8' },
};
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mixAll = (w, k) => '#' + [0, 1, 2].map(i => Math.round(Object.entries(w).reduce((t, [l, x]) => t + x * hex(SKY[l][k])[i], 0)).toString(16).padStart(2, '0')).join('');

// How much of each sky is showing right now. Crossfades between keyframes:
// Fajr → night into dawn, sunrise → dawn into day, mid-afternoon → day into golden, Maghrib → golden into night by Isha.
function skyWeights(now, s) {
  const [f, , a, m, i] = windowsFor(now, s), sr = f.end, MIN = 60000;
  const K = [
    [+f.start - 10 * MIN, 'night'], [+f.start + (sr - f.start) * .45, 'dawn'], [+sr + 10 * MIN, 'dawn'], [+sr + 50 * MIN, 'day'],
    [+a.start, 'day'], [+a.start + (m.start - a.start) * .55, 'golden'], [+m.start + 8 * MIN, 'golden'], [+i.start, 'night'],
  ];
  const t = +now, w = { night: 0, dawn: 0, day: 0, golden: 0 };
  if (t <= K[0][0] || t >= K[K.length - 1][0]) { w.night = 1; return w; }
  for (let j = 0; j < K.length - 1; j++) {
    const [t0, l0] = K[j], [t1, l1] = K[j + 1];
    if (t >= t0 && t < t1) { const x = (t - t0) / (t1 - t0); w[l0] += 1 - x; w[l1] += x; return w; }
  }
  w.night = 1; return w;
}

function renderSky(now, s) {
  const w = nt.sky && nt.sky !== 'auto' ? { night: 0, dawn: 0, day: 0, golden: 0, [nt.sky]: 1 } : skyWeights(now, s);
  for (const el of document.querySelectorAll('#sky .layer')) el.style.opacity = w[el.dataset.l].toFixed(3);
  const r = document.documentElement.style;
  for (const k of ['bg', 'card', 'card2', 'line', 'muted']) r.setProperty('--' + k, mixAll(w, k));
}

// ---------- prayer line + Tamr ----------
// The prayer line refreshes every 15 s; only touch the DOM when something actually changed, so a click or
// keyboard focus on a check button isn't lost to a rebuild.
const setHTML = (el, html) => { if (el.__html !== html) { el.innerHTML = html; el.__html = html; } };
const esc = x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let open = false, tamrState = '';
function renderPrayer(s, log, now) {
  const { current, next } = status(now, s);
  const pending = current && !log[current.day]?.[current.key];
  const pill = $('pill'), ring = $('ring'), C = 72.26;
  pill.classList.remove('worried', 'late');
  let frac = 0, text = '', aria = t('aria_prayers'), mood = 'chill';
  if (pending) {
    mood = urgency(current, now);
    const left = (current.end - now) / 60000;
    frac = (now - current.start) / (current.end - current.start);
    if (mood !== 'chill') pill.classList.add(mood === 'panic' ? 'late' : 'worried');
    text = `<span class="now">${t('pill_due', { p: current.name })}</span><span class="sub"> · ${current.key === 'fajr' ? t('pill_left_sun', { t: fmtLeft(left), at: fmtClock(current.end) }) : t('pill_left', { t: fmtLeft(left) })}</span>`;
    aria = t('aria_due', { p: current.name, t: fmtLeft(left) });
  } else if (next) {
    const prev = [...allWindows(now, s)].reverse().find(w => w.start <= now);
    frac = prev ? (now - prev.start) / (next.start - prev.start) : 0;
    text = `<span class="now">${t('pill_next', { p: next.name, t: fmtLeft((next.start - now) / 60000) })}</span><span class="sub"> · ${fmtClock(next.start)}</span>`;
    aria = t('aria_next', { p: next.name, t: fmtLeft((next.start - now) / 60000), at: fmtClock(next.start) });
  }
  ring.setAttribute('stroke', mood === 'panic' ? '#ff8a73' : mood === 'worried' ? '#f0a64a' : '#e0b75a');
  ring.setAttribute('stroke-dashoffset', String(C * (1 - Math.min(1, Math.max(0, frac)))));
  setHTML($('pilltext'), text);
  pill.setAttribute('aria-label', aria);

  const today = windowsFor(now, s);
  const state = w => log[w.day]?.[w.key] ? 'done' : (current && w.key === current.key && w.day === current.day) ? 'cur' : w.end < now ? 'missed' : 'up';
  setHTML($('dots'), today.map(w => `<i class="${state(w)}"></i>`).join(''));
  setHTML($('plist'), today.map(w => {
    const st = state(w), done = st === 'done';
    return `<div class="prow ${st}"><span class="pn">${w.name}</span><span class="pt">${fmtClock(w.start)}</span>
      <button class="chk ${done ? 'on' : ''}" data-day="${w.day}" data-key="${w.key}" data-val="${!done}" aria-label="${t(done ? 'unmark' : 'mark', { p: w.name })}" ${w.start > now ? 'disabled' : ''}>${done ? '✓' : ''}</button></div>`
      + (w.key === 'fajr' ? `<div class="prow sun"><span class="pn">${t('sunrise')}</span><span class="pt">${fmtClock(w.end)}</span><span></span></div>` : '');
  }).join('') + `<div class="pfoot"><span>${esc(s.place)}</span><span>${t('sunset', { t: fmtClock(today[3].start) })}</span></div>`);

  // Tamr comes to the prayer line while a prayer is due.
  const tb = $('tbuddy'), pr = $('prayed');
  if (pending) {
    const key = `${current.day}|${current.key}|${mood === 'chill' ? 'chill' : 'worried'}`;
    if (tamrState !== key) {
      const fresh = !tamrState.startsWith(`${current.day}|${current.key}`);
      tamrState = key;
      const m = mood === 'chill' ? 'chill' : 'worried', W = globalThis.TamrWalk;
      tb.innerHTML = walker('tamr', m);
      tb.hidden = false; tb.className = 'tbuddy';
      if (fresh && W) {
        // Walks up to the prayer line. Now and then (calm times only) his kufi slips off on the way.
        tb.style.opacity = 0;
        const go = m === 'chill' && Math.random() < 1 / 6
          ? W.oops(tb, { from: -190, to: 0, fade: 'in' })
          : W.walk(tb, { from: -170, to: 0, gait: m === 'chill' ? 'stroll' : 'hurry', fade: 'in' });
        go.then(() => { tb.style.opacity = ''; });
      } else if (!fresh) { tb.style.transform = 'none'; }
      pr.hidden = false; pr.textContent = t('prayed_btn', { p: current.name });
      pr.onclick = async () => {
        setDone(current.day, current.key, true);
        pr.hidden = true; tb.style.transform = 'none'; tb.style.opacity = '';
        tb.innerHTML = walker('tamr', 'happy'); tb.className = 'tbuddy cheer';
        await new Promise(r => setTimeout(r, 1400));
        tb.className = 'tbuddy leave';
        if (W) await W.walk(tb, { from: 0, to: -220, gait: 'bouncy', easeIn: true, easeOut: false, fade: 'out' });
        tb.hidden = true;
      };
    }
  } else if (tamrState && !tb.classList.contains('cheer') && !tb.classList.contains('leave')) {
    tamrState = ''; tb.hidden = true; pr.hidden = true;
  } else if (!pending) { tamrState = ''; pr.hidden = true; }
  return { current, next, pending };
}
$('pill').onclick = () => { open = !open; $('plist').hidden = !open; $('pill').setAttribute('aria-expanded', String(open)); };
document.addEventListener('click', e => {
  const b = e.target.closest('.chk'); if (b) { setDone(b.dataset.day, b.dataset.key, b.dataset.val === 'true'); return; }
  if (open && !e.target.closest('#prayer')) $('pill').click();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) $('pill').click(); });

// ---------- search ----------
$('search').onsubmit = e => {
  e.preventDefault();
  const text = $('q').value.trim(); if (!text) return;
  // Typed a web address? Go there (http/https only). Anything else goes to your default search engine.
  const hasScheme = /^https?:\/\//i.test(text);
  const looksLikeUrl = hasScheme || /^[^\s:/]+\.[a-z]{2,}(:\d+)?(\/\S*)?$/i.test(text);
  const url = looksLikeUrl && webUrl(hasScheme ? text : `https://${text}`);
  if (url) location.href = url;
  else chrome.search.query({ text, disposition: 'CURRENT_TAB' });
};

// ---------- shortcuts ----------
const TINTS = [['#1f5f5c', '#9fe0d4'], ['#5a3a22', '#f2cd6b'], ['#4a2a3a', '#f4a6b8'], ['#2d3f6a', '#b4cbf4'], ['#3f4a2a', '#d3e6a0'], ['#5e2a24', '#ffb8a6']];
const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
function initials(name) {
  const words = name.split(/[\s._-]+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  const w = words[0] || '?', cap = [...w].findIndex((c, i) => i > 0 && c >= 'A' && c <= 'Z');
  return cap > 0 ? (w[0] + w[cap]).toUpperCase() : w[0].toUpperCase() + (w[1] || '').toLowerCase();
}
const faviconUrl = url => `/_favicon/?pageUrl=${encodeURIComponent(url)}&size=64`;
function pixels(src) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 16, 16); res(c.toDataURL()); } catch { res(null); } };
    img.onerror = () => res(null); img.src = src;
  });
}
let defaultIcon = null; // Chrome's generic globe, used to spot sites it has no icon for
async function setIcon(ic, sc) {
  if (/quran\.com/i.test(sc.url)) { ic.textContent = 'ق'; ic.classList.add('qaf'); return; }
  const [bg, fg] = TINTS[hash(sc.name) % TINTS.length];
  ic.textContent = initials(sc.name); ic.style.background = bg; ic.style.color = fg; ic.style.borderColor = 'transparent';
  if (defaultIcon === null) defaultIcon = await pixels(faviconUrl('https://tamr-no-icon.invalid/'));
  const mine = await pixels(faviconUrl(sc.url));
  if (mine && mine !== defaultIcon) {
    ic.textContent = ''; ic.style.background = ''; ic.style.color = ''; ic.style.borderColor = '';
    const img = new Image(); img.alt = ''; img.src = faviconUrl(sc.url); ic.append(img);
  }
}
function renderShortcuts() {
  const box = $('shortcuts'); box.innerHTML = '';
  nt.shortcuts.forEach((sc, i) => {
    const a = document.createElement('a'); a.className = 'sc'; a.href = sc.url;
    const ic = document.createElement('span'); ic.className = 'ic'; setIcon(ic, sc);
    const lbl = document.createElement('span'); lbl.className = 'lbl'; lbl.textContent = sc.name;
    const rm = document.createElement('button'); rm.className = 'rm'; rm.textContent = '×'; rm.setAttribute('aria-label', t('remove', { name: sc.name }));
    rm.onclick = e => { e.preventDefault(); nt.shortcuts.splice(i, 1); save(); renderShortcuts(); };
    a.append(ic, lbl, rm); box.append(a);
  });
  if (nt.shortcuts.length < 14) {
    const add = document.createElement('button'); add.className = 'sc add';
    add.innerHTML = `<span class="ic" aria-hidden="true">+</span><span class="lbl">${t('add')}</span>`;
    add.onclick = () => { $('a-name').value = ''; $('a-url').value = ''; $('adddlg').showModal(); };
    box.append(add);
  }
}
$('adddlg').addEventListener('close', () => {
  if ($('adddlg').returnValue !== 'ok') return;
  const name = $('a-name').value.trim(); let url = $('a-url').value.trim();
  if (!name || !url) return;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = 'https://' + url;
  url = webUrl(url); if (!url) return;
  nt.shortcuts.push({ name: name.slice(0, 40), url }); save(); renderShortcuts();
});

// ---------- daily card ----------
// "Al-Muzzammil 73:8", with the surah's Arabic name and local digits for Arabic-script languages.
const ARABIC_SCRIPT = ['ar'];
const refOf = it => ARABIC_SCRIPT.includes(lang()) && SURAH_AR[it.s]
  ? `${SURAH_AR[it.s]} ${num(it.s)}:${num(it.a)}${it.a2 ? '–' + num(it.a2) : ''}` : it.ref;
const dayNum = now => Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 864e5);
let curSlot = 'day';
function renderDaily(now, animate = false) {
  const n = dayNum(now) + nt.shuffle;
  for (const b of document.querySelectorAll('.tabs button')) b.setAttribute('aria-selected', String(b.dataset.tab === nt.tab));
  let ar = '', tr = '', en = '', meta = '';
  // English readers get the translation under the Arabic; Arabic readers just get the verse.
  const q = item => lang() === 'en' ? item.en : '';
  const quote = x => x ? `“${x}”` : '';
  const qlink = (s, a) => `https://quran.com/${s}/${a}`;
  if (nt.tab === 'verse') {
    const list = VERSES[curSlot], v = list[n % list.length];
    ar = v.ar; en = quote(q(v));
    meta = `<span>${refOf(v)}</span><span class="sep"></span><a href="${qlink(v.s, v.a)}">${t('read_surah')}</a><button id="another">${t('another')}</button>`;
  } else if (nt.tab === 'dua') {
    const d = DUAS[(n * 5) % DUAS.length];
    ar = d.ar; en = quote(q(d));
    meta = `<span>${refOf(d)}</span><span class="sep"></span><span>${t('good_for', { when: t(`when_${d.s}_${d.a}`) })}</span>`;
  } else {
    const nm = NAMES[(n * 7) % NAMES.length];
    ar = nm.ar; tr = nm.tr; en = lang() === 'en' ? nm.en : '';
    meta = `<span>${t('as_in', { ref: refOf(nm) })}</span><span class="sep"></span><a href="${qlink(nm.s, nm.a)}">${t('see_verse')}</a>`;
  }
  $('ar').textContent = ar; $('ar').classList.toggle('big', nt.tab === 'name');
  $('tr').textContent = tr; $('en').textContent = en; $('meta').innerHTML = meta;
  $('tr').hidden = !tr; $('en').hidden = !en;
  const another = $('another'); if (another) another.onclick = () => { nt.shuffle++; nt.shuffleDay = dayKey(new Date()); save(); renderDaily(new Date(), true); };
  if (animate) { const c = document.querySelector('.card'); c.classList.remove('swap'); void c.offsetWidth; c.classList.add('swap'); }
}
for (const b of document.querySelectorAll('.tabs button')) b.onclick = () => { nt.tab = b.dataset.tab; save(); renderDaily(new Date(), true); };

// ---------- Miswak ----------
const IDLE_LINES = () => t('idle');  // a random one each time
let tipTimer = null, shownTip = '', hiding = false;
function miswakTip(s, log, now, info) {
  const { next, pending } = info;
  if (pending) return '';                       // Tamr has the prayer line covered
  const today = dayKey(now), ws = windowsFor(now, s);
  if (next) {
    const mins = Math.max(1, Math.round((next.start - now) / 60000));
    if (mins <= 60) {
      const n = num(mins);
      if (next.key === 'fajr') return t(mins > 20 ? 'tip_fajr_far' : 'tip_fajr_near', { n });
      if (next.key === 'dhuhr' && isFriday(next.day)) return t('tip_jumuah', { n });
      if (next.key === 'maghrib') return t('tip_maghrib', { n });
      if (next.key === 'isha') return t('tip_isha', { n });
      return t('tip_next', { p: next.name, n });
    }
  }
  if (s.adhkar && log[today]?.fajr && !log[today]?.morning && now >= ws[0].end && now < +ws[0].end + 3 * 3600e3) return t('tip_morning');
  if (isFriday(today) && s.kahf && !log[today]?.kahf && now < ws[3].start) return t('tip_kahf');
  if (now.getHours() >= 23 || (now.getHours() < 4 && now < ws[0].start)) return t('tip_late');
  return '';
}
function showBubble(text, ms = 0) {
  const b = $('bubble');
  if (!text || !nt.show.miswak || hiding) { b.hidden = true; return; }
  if (b.hidden || b.textContent !== text) { b.textContent = text; b.hidden = false; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }
  clearTimeout(tipTimer);
  if (ms) tipTimer = setTimeout(() => { shownTip = ''; tick(); }, ms);
}
function bounceMiswak() {
  const m = $('miswak'); m.classList.remove('hop'); void m.offsetWidth; m.classList.add('hop');
  m.innerHTML = miswak('happy'); setTimeout(() => { m.innerHTML = miswak('calm'); }, 1400);
}
$('miswak').innerHTML = miswak('calm');
$('miswak').onclick = () => { bounceMiswak(); shownTip = IDLE_LINES(); showBubble(shownTip, 5000); };

// ---------- hide & seek ----------
// Places Miswak can peek from. None are inside a button or link (a button inside those is invalid HTML).
const HIDE_SPOTS = ['search', 'left', 'right', 'bottom'];
const monthKey = d => dayKey(d).slice(0, 7);
async function maybeHide(info) {
  if (!nt.show.hideseek || !nt.show.miswak || !nt.show.daily || info.pending) return;
  const { hs } = await chrome.storage.local.get('hs');
  const last = hs?.lastHide || 0;
  if (Date.now() - last < 20 * 60000 || Math.random() > .22) return;  // roughly 1 in 5 new tabs, not back-to-back
  hide(pick(HIDE_SPOTS));
  chrome.storage.local.set({ hs: { ...(hs || {}), lastHide: Date.now() } });
}
function hide(spot) {
  hiding = true; $('miswak').classList.add('away'); $('bubble').hidden = true;
  const p = document.createElement('button');
  p.className = `peek ${spot}`; p.setAttribute('aria-label', 'Someone is hiding here');
  p.innerHTML = `<span class="peekwin">${miswak('calm')}</span>`;
  if (spot === 'left' || spot === 'right') { p.style.top = `${30 + Math.random() * 40}%`; document.body.append(p); }
  else if (spot === 'bottom') { p.style.left = `${15 + Math.random() * 70}%`; document.body.append(p); }
  else {
    const host = $('search');
    host.classList.add('peekhost'); p.style.left = `${18 + Math.random() * 64}%`;
    host.append(p);
  }
  p.onclick = async e => {
    e.preventDefault(); e.stopPropagation();
    const { hs = {} } = await chrome.storage.local.get('hs');
    const mk = monthKey(new Date()), count = (hs.month === mk ? hs.count || 0 : 0) + 1;
    chrome.storage.local.set({ hs: { ...hs, month: mk, count } });
    p.classList.add('found');
    setTimeout(() => {
      p.remove(); hiding = false; $('miswak').classList.remove('away'); bounceMiswak();
      shownTip = t('hs_found', { n: num(count) });
      showBubble(shownTip, 6000);
    }, 700);
  };
}

// ---------- visibility + customize ----------
function applyShow() {
  const S = nt.show;
  $('glinks').classList.toggle('hide', !S.glinks);
  $('prayer').classList.toggle('hide', !S.prayer);
  $('shortcuts').classList.toggle('hide', !S.shortcuts);
  $('daily').classList.toggle('hide', !S.daily);
  $('miswak').classList.toggle('hide', !S.miswak);
  if (!S.miswak) $('bubble').hidden = true;
}
$('custbtn').onclick = async () => {
  $('c-name').value = nt.name;
  $('c-sky').value = nt.sky || 'auto';
  const s = await getSettings();
  $('c-lang').innerHTML = `<option value="auto">${t('lang_auto')}</option>` + LANGS.map(l => `<option value="${l.code}" lang="${l.code}">${l.name}</option>`).join('');
  $('c-lang').value = s.lang || 'auto';
  for (const c of document.querySelectorAll('#panel [data-k]')) c.checked = !!nt.show[c.dataset.k];
  const { hs = {} } = await chrome.storage.local.get('hs');
  const n = hs.month === monthKey(new Date()) ? hs.count || 0 : 0;
  $('hscount').textContent = n ? t('hs_count', { n: num(n) }) : t('hs_none');
  $('panel').showModal();
};
$('hidenow').onclick = () => {
  $('panel').close();
  if (hiding || !nt.show.miswak || !nt.show.daily) return;
  hide(pick(HIDE_SPOTS));
};
$('c-sky').onchange = async e => { nt.sky = e.target.value; save(); document.body.classList.remove('ease'); renderSky(new Date(), await getSettings()); requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ease'))); };
$('c-lang').onchange = async e => {
  const s = await getSettings();
  await chrome.storage.sync.set({ settings: { ...s, lang: e.target.value } });
  location.reload();
};
$('c-name').oninput = e => { nt.name = e.target.value.trim(); save(); renderClock(new Date()); };
for (const c of document.querySelectorAll('#panel [data-k]')) c.onchange = () => { nt.show[c.dataset.k] = c.checked; save(); applyShow(); tick(); };

// ---------- follow your location (Settings: "Update my location automatically") ----------
async function followLocation() {
  const s = await getSettings();
  if (!s.auto || !navigator.geolocation) return;
  const { lastLocate = 0 } = await chrome.storage.local.get('lastLocate');
  if (Date.now() - lastLocate < 3 * 3600e3) return;
  await chrome.storage.local.set({ lastLocate: Date.now() });
  try {
    const p = await here();
    if (km(p, s) < 30 && s.cc) return;
    const c = await cityAt(p.lat, p.lng);
    await chrome.storage.sync.set({ settings: { ...s, ...p, place: c.place, cc: c.cc } });
  } catch { /* no permission or offline: keep the saved place */ }
}

// ---------- main loop ----------
async function tick() {
  const now = new Date();
  renderClock(now);
  const s = await getSettings(), log = await getLog();
  renderSky(now, s);
  const slot = slotFor(now, s);
  if (slot !== curSlot) { curSlot = slot; renderDaily(now); }
  const info = renderPrayer(s, log, now);
  if (!shownTip) showBubble(miswakTip(s, log, now, info));
  return info;
}

(async function init() {
  await migrateToSync();   // never throws
  let newtab = null;
  try { ({ newtab } = await chrome.storage.sync.get('newtab')); } catch (e) { console.warn('Tamr: new tab settings unreadable', e); }
  if (newtab && typeof newtab === 'object') nt = { ...nt, ...newtab, show: { ...DEFAULT_SHOW, ...(newtab.show || {}) } };
  nt.shortcuts = newtab?.shortcuts ? cleanShortcuts(nt.shortcuts) : DEFAULT_SHORTCUTS;
  if (nt.shuffleDay !== dayKey(new Date())) nt.shuffle = 0;
  const s0 = await getSettings();   // also sets the language
  localize();
  curSlot = slotFor(new Date(), s0);
  applyShow(); renderShortcuts(); renderDaily(new Date());
  const info = await tick();
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ease')));
  maybeHide(info);
  followLocation();
  setInterval(tick, 15000);
  let lastDay = dayKey(new Date());
  setInterval(() => { const d = dayKey(new Date()); if (d !== lastDay) { lastDay = d; nt.shuffle = 0; renderDaily(new Date()); } }, 60000);
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== 'sync') return;
    if (ch.settings && (ch.settings.oldValue?.lang || 'auto') !== (ch.settings.newValue?.lang || 'auto')) return location.reload();  // language changed elsewhere
    if (ch.settings || Object.keys(ch).some(k => k.startsWith('log-'))) tick();
  });
})().catch(e => console.error('Tamr: new tab failed to start', e));
