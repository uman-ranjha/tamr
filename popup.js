import { migrateToSync, getSettings, getLog, setDone, status, urgency, windowsFor, fmtTime, fmtLeft } from './lib/core.js';
import { tamr } from './lib/art.js';
import { pickScene } from './lib/scenes.js';
import { t, num, localize } from './lib/i18n.js';

let scene = null; // picked once per popup open

const app = document.getElementById('app');

async function render() {
  const s = await getSettings(), log = await getLog();
  localize();
  const now = new Date();
  const { current, next } = status(now, s);
  const pending = current && !log[current.day]?.[current.key];

  let mood, line, big, label;
  if (pending) {
    mood = urgency(current, now);
    const left = (current.end - now) / 60000;
    line = {
      chill: t('pop_chill', { p: current.name }),
      worried: t('pop_worried', { p: current.name }),
      panic: t('pop_panic', { p: current.name, n: num(Math.round(left)) }),
    }[mood];
    big = fmtLeft(left); label = current.key === 'fajr' ? t('pop_left_sun', { at: fmtTime(current.end) }) : t('pop_left_for', { p: current.name });
  }

  const ws = windowsFor(now, s);
  if (!pending && !scene) {
    const night = now >= ws[3].start || now < ws[0].end;
    const { lastScene } = await chrome.storage.session.get('lastScene').catch(() => ({}));
    scene = pickScene(night, lastScene);
    chrome.storage.session.set({ lastScene: scene.id }).catch(() => {});
  }

  // Highlighted row: the prayer that's in now (still to pray), otherwise the next one. Its countdown lives in the row.
  const same = (a, b) => a && b && a.key === b.key && a.day === b.day;
  const focus = pending ? current : next;
  const rows = ws.map(w => {
    const done = !!log[w.day]?.[w.key];
    const state = done ? 'done' : same(w, current) ? 'current' : w.end < now ? 'missed' : 'upcoming';
    const hot = same(w, focus) && !done;
    const when = hot && !pending ? `<span class="pin">${t('row_in', { t: fmtLeft((w.start - now) / 60000) })}</span>` : '<span></span>';
    return `<li class="row ${state}${hot ? ' hot' : ''}">
      <span class="pname">${w.name}${state === 'missed' ? ` <em>${t('missed')}</em>` : ''}</span>
      ${when}
      <span class="ptime">${fmtTime(w.start)}</span>
      <button class="check" data-day="${w.day}" data-key="${w.key}" data-val="${!done}" aria-label="${t(done ? 'unmark' : 'mark', { p: w.name })}" ${w.start > now ? 'disabled' : ''}>${done ? '✓' : ''}</button>
    </li>` + (w.key === 'fajr' ? `<li class="sunline" aria-label="${t('sunrise')} ${fmtTime(w.end)}"><span>${t('sun_at', { at: fmtTime(w.end) })}</span></li>` : '');
  }).join('');
  // Right side of the line under the scene: the next prayer's countdown when it isn't in today's list (after Isha), else what's just been prayed.
  const nextShown = ws.some(w => same(w, next));
  const side = !pending && next && !nextShown ? t('pill_next', { p: next.name, t: fmtLeft((next.start - now) / 60000) })
    : current && log[current.day]?.[current.key] ? `${current.name} ✓` : '';


  if (!document.getElementById('hero')) app.innerHTML = `<div id="hero"></div><div id="rest"></div><button class="gear" id="opts" aria-label="${t('settings')}" title="${t('settings')}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>`;
  const hero = document.getElementById('hero');
  if (pending) {
    hero.dataset.key = '';
    hero.innerHTML = `<section class="hero mood-${mood}">
    <div class="who">${tamr(mood)}</div>
    <div class="talk">
      <p class="bubble">${line}</p>
      <div class="big">${big}</div>
      <div class="label">${label}</div>
      <button class="pray" data-day="${current.day}" data-key="${current.key}" data-val="true">${t('btn_prayed', { p: current.name })}</button>
    </div>
  </section>`;
  } else if (hero.dataset.key !== scene.id) {
    // Build the animated scene once; later refreshes only touch the text so the animation keeps playing.
    hero.dataset.key = scene.id;
    hero.innerHTML = `<section class="hero scene">
    <div class="scene-art">${scene.svg()}</div>
    <div class="scene-row"><span class="side"></span></div>
  </section>`;
  }
  if (!pending) {
    hero.querySelector('.side').textContent = side;
    hero.querySelector('.scene-row').hidden = !side;
  }
  document.getElementById('rest').innerHTML = `
  <ul class="list">${rows}</ul>
`;
}

app.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'opts') return chrome.runtime.openOptionsPage();
  if (b.dataset.key) await setDone(b.dataset.day, b.dataset.key, b.dataset.val === 'true');
});

// One render at a time: the 20 s refresh and a sync change can't interleave. If one is asked for while another
// is running, a single follow-up render runs after it.
let running = null, again = false;
async function safeRender() {
  if (running) { again = true; return running; }
  running = (async () => {
    await migrateToSync();   // never throws
    do {
      again = false;
      try { await render(); }
      catch (e) {
        console.error('Tamr popup:', e);   // details go to the console, not to the person
        if (!document.getElementById('hero')) app.innerHTML = '<p style="padding:16px">Tamr couldn\'t load right now. Try reopening the popup.</p>';
      }
    } while (again);
  })();
  try { await running; } finally { running = null; }
}
chrome.storage.onChanged.addListener((_c, area) => { if (area === 'sync') safeRender(); });
safeRender();
setInterval(safeRender, 20000);
