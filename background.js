import { getSettings, getLog, setDone, windowsFor, status, urgency, dayKey, isFriday, NAMES, fmtLeft, fmtTime, logChange, migrateToSync } from './lib/core.js';
import { t, isRtl } from './lib/i18n.js';
import { tamr, walker } from './lib/art.js';

const M = 60000, H = 60 * M;
const MISWAK_SETTING = { morning: 'adhkar', evening: 'adhkar', kahf: 'kahf', quran: 'quran' };
const MOOD = { half: 'worried', late: 'panic', snooze: 'worried' };

// Rebuild every alarm. Wrapped so a bad day (or bad data) can never leave you with no reminders and no error:
// the 'tick' and 'daily' alarms are always recreated first, and each day is scheduled on its own.
async function schedule() {
  try { await scheduleAll(); }
  catch (e) { console.error('Tamr: scheduling failed', e); }
}
async function scheduleAll() {
  await chrome.alarms.clearAll();
  chrome.alarms.create('tick', { periodInMinutes: 1 });
  const midnight = new Date(); midnight.setDate(midnight.getDate() + 1); midnight.setHours(0, 5, 0, 0);
  chrome.alarms.create('daily', { when: +midnight });

  const s = await getSettings(), now = Date.now();
  const add = (name, t) => { if (t > now && t < now + 30 * H) chrome.alarms.create(name, { when: t }); };

  for (const o of [-1, 0, 1]) try {
    const d = new Date(); d.setDate(d.getDate() + o);
    const ws = windowsFor(d, s);
    const find = k => ws.find(w => w.key === k);
    for (const w of ws) {
      const st = +w.start, en = +w.nudgeEnd;
      add(`p|${w.day}|${w.key}|wudu`, st - s.wuduMin * M);
      add(`p|${w.day}|${w.key}|start`, st);
      add(`p|${w.day}|${w.key}|half`, st + (en - st) / 2);
      add(`p|${w.day}|${w.key}|late`, en - 20 * M);
      if (w.key === 'dhuhr' && isFriday(w.day)) add(`p|${w.day}|dhuhr|jumuah`, st - 45 * M);
    }
    const fajr = find('fajr'), maghrib = find('maghrib'), day = dayKey(d);
    if (fajr) add(`m|${day}|morning|fallback`, +fajr.end + 30 * M);
    if (maghrib) add(`m|${day}|evening|fallback`, +maghrib.start - 50 * M);
    if (isFriday(day)) { const k = new Date(d); k.setHours(10, 30, 0, 0); add(`m|${day}|kahf|fallback`, +k); }
    const [h, mn] = s.quranTime.split(':').map(Number);
    const q = new Date(d); q.setHours(h, mn, 0, 0); add(`m|${day}|quran|fallback`, +q);
  } catch (e) { console.error('Tamr: could not schedule day', o, e); }
  await badge();
}

async function badge() {
  const s = await getSettings(), log = await getLog(), now = new Date();
  const { current, next } = status(now, s);
  const mood = current && !log[current.day]?.[current.key] ? urgency(current, now) : null;
  if (mood) {
    const left = (current.end - now) / M;
    chrome.action.setBadgeText({ text: left >= 60 ? `${Math.floor(left / 60)}h` : `${Math.round(left)}m` });
    chrome.action.setBadgeBackgroundColor({ color: { chill: '#2e7d4f', worried: '#d98b1b', panic: '#c62828' }[mood] });
    chrome.action.setTitle({ title: t('bg_ends', { p: current.name, t: fmtLeft(left) }) });
  } else {
    chrome.action.setBadgeText({ text: current ? '✓' : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#2e7d4f' });
    chrome.action.setTitle({ title: next ? t('bg_next', { p: next.name, at: fmtTime(next.start) }) : t('tamr') });
  }
  const icon = mood || 'happy';
  chrome.action.setIcon({ path: { 16: `img/tamr-${icon}-16.png`, 32: `img/tamr-${icon}-32.png` } });
}

function miswakRelevant(day, key, s) {
  const now = new Date(), w = k => windowOf(day, k, s)?.start;
  const before = k => { const t0 = w(k); return t0 ? now < t0 : dayKey(now) === day; };
  if (key === 'morning') return before('dhuhr');     // before Dhuhr
  if (key === 'evening') return before('isha');      // before Isha
  if (key === 'kahf') return before('maghrib');      // Friday, before Maghrib
  return dayKey(now) === day;
}

// Have the character walk onto the page you're looking at. Returns true if they showed up.
async function runOn(msg) {
  try {
    const win = await chrome.windows.getLastFocused();
    if (!win?.focused) return false;                       // you're in another app
    const [tab] = await chrome.tabs.query({ active: true, windowId: win.id });
    if (!tab?.id || !/^https?:/.test(tab.url || '')) return false;
    // The page script is only injected when a reminder is actually due (nothing runs on pages otherwise).
    // overlay.js guards against loading twice, so a tab that already has it just gets the message.
    try { return !!(await chrome.tabs.sendMessage(tab.id, msg))?.shown; }
    catch {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['lib/walk.js', 'overlay.js'] });
      return !!(await chrome.tabs.sendMessage(tab.id, msg))?.shown;
    }
  } catch { return false; }
}

// The on-page card's fixed labels, in the current language.
const ui = () => ({ dir: isRtl() ? 'rtl' : 'ltr', l_snooze: t('snooze5s'), l_pause: t('ov_pause'), l_dismiss: t('ov_dismiss'), l_letgo: t('ov_letgo') });

function buildNudge(kind, day, key, stage, s) {
  if (kind === 'p') {
    const sunriseAt = key === 'fajr' && s ? windowsFor(day === 'test' ? new Date() : new Date(day + 'T12:00'), s)[0].end : null;
    const name = key === 'dhuhr' && isFriday(day) ? t('p_jumuah') : NAMES[key];
    const set = key === 'fajr' && stage === 'start' ? 'fajr' : stage;
    const mood = MOOD[stage] || 'chill';
    return { type: 'buddy', who: t('tamr'), kind, day, key, stage, mood, name, ...ui(),
      text: t(['wudu', 'fajr', 'start', 'half', 'late', 'jumuah', 'snooze'].includes(set) ? 'l_' + set : 'l_start', { p: name })
        + (key === 'fajr' && stage !== 'wudu' && sunriseAt ? ' ' + t('sun_note', { at: fmtTime(sunriseAt) }) : ''),
      ...(['wudu', 'jumuah'].includes(stage)
        ? { done: t('btn_onit'), thanks: t('thanks_wudu'), markDone: false }
        : { done: t('btn_prayed', { p: name }), thanks: t('thanks_prayed'), markDone: true }),
      svg: walker('tamr', mood), happySvg: walker('tamr', 'happy'), walkSvg: walker('tamr', 'chill'), icon: `tamr-${mood}`,
      gait: mood === 'chill' ? 'stroll' : 'hurry', oops: mood === 'chill' && Math.random() < 1 / 6 };
  }
  return { type: 'buddy', who: t('miswak'), kind, day, key, stage, mood: 'calm', name: key, ...ui(),
    text: t('m_' + key), done: t('btn_done'), markDone: true, thanks: t('thanks_m'),
    svg: walker('miswak', 'calm'), happySvg: walker('miswak', 'happy'), walkSvg: walker('miswak', 'calm'), icon: 'miswak', gait: 'stroll', walker: 'miswak' };
}

function systemNotify(n) {
  const prefix = `${n.kind}|${n.day}|${n.key}`;
  chrome.notifications.create(`${prefix}|${Date.now()}`, {
    type: 'basic', iconUrl: `img/${n.icon}.png`, title: n.who, message: n.text,
    priority: 2, requireInteraction: true,
    buttons: [{ title: n.kind === 'p' ? t('n_prayed') : t('n_done') }, { title: t('snooze5') }],
  });
}

// The character walks on. If Chrome isn't in front (or the tab can't show him), you get a desktop notification
// right away so nothing is missed, and he still walks on when you come back if it hasn't been done by then.
async function notify(kind, day, key, stage) {
  const s = await getSettings(), n = buildNudge(kind, day, key, stage, s);
  if (kind === 'm') {                                       // Miswak: once per reminder per day, however it was triggered
    const id = `${day}|${key}`, { mSent = {} } = await chrome.storage.local.get('mSent');
    if (mSent[id]) return;
    for (const k in mSent) if (k.slice(0, 10) < dayKey(Date.now() - 2 * 24 * H)) delete mSent[k];
    await chrome.storage.local.set({ mSent: { ...mSent, [id]: Date.now() } });
  }
  if (s.doze && kind === 'p' && n.markDone) n.dozeSvg = tamr('doze');
  if (s.overlay && await runOn(n)) {
    await chrome.storage.local.remove('pending');
    if (stage === 'late' && s.desktopBackup) systemNotify(n);
    return;
  }
  if (s.overlay) await chrome.storage.local.set({ pending: n });
  if (!s.overlay || s.desktopBackup) systemNotify(n);
}

async function stillValid(n) {
  const s = await getSettings(), log = await getLog();
  if (log[n.day]?.[n.key]) return false;
  return n.kind === 'p' ? +windowOf(n.day, n.key, s)?.end > Date.now() : miswakRelevant(n.day, n.key, s);
}

async function deliverPending() {
  const { pending } = await chrome.storage.local.get('pending');
  if (!pending) return;
  if (!(await stillValid(pending))) return chrome.storage.local.remove('pending');
  if (await runOn(pending)) {
    chrome.storage.local.remove('pending');
    clearNotes(pending.day, pending.key);                  // he's here now; the desktop notification can go
  }
}
async function clearNotes(day, key) {
  for (const id of Object.keys(await chrome.notifications.getAll())) {
    const [, d, k] = id.split('|');
    if (d === day && k === key) chrome.notifications.clear(id);
  }
}
chrome.windows.onFocusChanged.addListener(w => { if (w !== chrome.windows.WINDOW_ID_NONE) setTimeout(deliverPending, 800); });
chrome.tabs.onActivated.addListener(() => setTimeout(deliverPending, 500));
chrome.tabs.onUpdated.addListener((_id, info, tab) => { if (info.status === 'complete' && tab.active) setTimeout(deliverPending, 800); });

const LATE = 3 * M; // an alarm firing this late means the laptop was asleep
const windowOf = (day, key, s) => windowsFor(new Date(day + 'T12:00'), s).find(w => w.key === key);

// Clear notifications for prayers whose time is over or that are already checked off.
async function cleanup() {
  const s = await getSettings(), log = await getLog(), now = Date.now();
  for (const id of Object.keys(await chrome.notifications.getAll())) {
    const [kind, day, key] = id.split('|');
    if (log[day]?.[key]) { chrome.notifications.clear(id); continue; }
    if (kind === 'p' && !(+windowOf(day, key, s)?.end > now)) chrome.notifications.clear(id);
    if (kind === 'm' && !miswakRelevant(day, key, s)) chrome.notifications.clear(id);
  }
  const { pending } = await chrome.storage.local.get('pending');
  if (pending && !(await stillValid(pending))) await chrome.storage.local.remove('pending');
}

// After waking up: one nudge for the current prayer only (if it's pending and getting late), nothing else.
async function catchUp() {
  const { lastCatchUp = 0 } = await chrome.storage.local.get('lastCatchUp');
  if (Date.now() - lastCatchUp < 2 * M) return;
  await chrome.storage.local.set({ lastCatchUp: Date.now() });
  await cleanup();
  const s = await getSettings(), log = await getLog(), now = new Date();
  if (!s.nudges) return;
  const { current } = status(now, s);
  if (!current || log[current.day]?.[current.key]) return;
  const mood = urgency(current, now);
  if (mood !== 'chill') notify('p', current.day, current.key, mood === 'panic' ? 'late' : 'half');
}

chrome.alarms.onAlarm.addListener(async a => {
  const late = Date.now() - a.scheduledTime > LATE;
  if (a.name === 'tick') { await cleanup(); if (late) await catchUp(); return badge(); }
  if (a.name === 'daily') return schedule();
  if (late) return catchUp();                               // stale backlog from sleep → skip it
  const [kind, day, key, stage] = a.name.split('|');
  const s = await getSettings(), log = await getLog();
  if (!s.nudges || log[day]?.[key]) return;
  if (kind === 'p') {
    if (!(+windowOf(day, key, s)?.end > Date.now())) return;   // prayer time already over (or unknown)
    return notify(kind, day, key, stage);
  }
  if (kind === 'm' && s[MISWAK_SETTING[key]] && miswakRelevant(day, key, s)) return notify(kind, day, key, stage);
});

// Only these ever get written to the log or turned into alarms (messages and notification ids are checked against them).
const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'], MISWAK_KEYS = Object.keys(MISWAK_SETTING);
const validRef = (kind, day, key) => /^\d{4}-\d{2}-\d{2}$/.test(day) &&
  ((kind === 'p' && PRAYER_KEYS.includes(key)) || (kind === 'm' && MISWAK_KEYS.includes(key)));

const snooze = (kind, day, key) => { if (validRef(kind, day, key)) chrome.alarms.create(`${kind}|${day}|${key}|snooze`, { when: Date.now() + 5 * M }); };

chrome.notifications.onButtonClicked.addListener(async (id, i) => {
  const [kind, day, key] = id.split('|');
  chrome.notifications.clear(id);
  if (!validRef(kind, day, key)) return;
  if (i === 0) await setDone(day, key, true); else snooze(kind, day, key);
});
chrome.notifications.onClicked.addListener(id => {
  chrome.notifications.clear(id);
  chrome.action.openPopup?.().catch(() => {});
});

// Test mode from Settings: walk on a sample reminder after a short delay (nothing gets saved).
async function runTest(who, stage) {
  const s = await getSettings(), { current, next } = status(new Date(), s);
  const w = current || next;
  const n = who === 'miswak' ? buildNudge('m', 'test', stage, 'test') : buildNudge('p', 'test', w.key, stage, s);
  if (who !== 'miswak' && w.name !== NAMES[w.key]) n.text = n.text.replaceAll(NAMES[w.key], w.name);
  Object.assign(n, { markDone: false, thanks: t('test_thanks') });
  if (stage === 'oops') Object.assign(n, { oops: true, svg: walker('tamr', 'chill'), gait: 'stroll', mood: 'chill' });
  if (who !== 'miswak' && s.doze && !['wudu', 'jumuah'].includes(stage)) n.dozeSvg = tamr('doze');
  if (!(await runOn(n))) chrome.notifications.create(`test|${Date.now()}`, {
    type: 'basic', iconUrl: `img/${n.icon}.png`, title: t('cant_walk', { who: n.who }),
    message: t('cant_walk_msg'),
  });
}

// Buttons on the on-page character, and the test buttons in Settings. Only our own extension can send these,
// and day/key are checked before anything is written.
const TEST_STAGES = ['wudu', 'start', 'half', 'late', 'oops', 'morning', 'evening', 'kahf', 'quran'];
chrome.runtime.onMessage.addListener((m, sender) => {
  if (sender.id !== chrome.runtime.id || !m || typeof m !== 'object') return;
  const kind = m.kind === 'm' ? 'm' : 'p';
  if (m.type === 'test' && ['tamr', 'miswak'].includes(m.who) && TEST_STAGES.includes(m.stage)) setTimeout(() => runTest(m.who, m.stage), 5000);
  if (m.type === 'done' && validRef(kind, m.day, m.key)) setDone(m.day, m.key, true);
  if (m.type === 'snooze') snooze(kind, m.day, m.key);
});

chrome.storage.onChanged.addListener(async (ch, area) => {
  if (area !== 'sync') return;
  if (ch.settings) schedule();
  const lc = logChange(ch);
  if (!lc) return;
  badge();
  const o = lc.oldValue, n = lc.newValue;
  const notes = Object.keys(await chrome.notifications.getAll());
  for (const day in n) for (const key in n[day]) {
    if (!n[day][key] || o[day]?.[key]) continue;
    notes.filter(id => id.split('|')[1] === day && id.split('|')[2] === key).forEach(id => chrome.notifications.clear(id));
    const follow = { fajr: 'morning', asr: 'evening' }[key];
    if (follow && !n[day][follow] && day === dayKey(new Date())) chrome.alarms.create(`m|${day}|${follow}|after`, { when: Date.now() + M });
  }
});

const safeMigrate = () => migrateToSync().catch(e => console.error('Tamr: sync migration failed', e));
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await safeMigrate();
  const { installAt } = await chrome.storage.local.get('installAt');
  if (!installAt) await chrome.storage.local.set({ installAt: Date.now() });
  await schedule();
  if (reason === 'install') chrome.runtime.openOptionsPage();
});
chrome.runtime.onStartup.addListener(async () => { await safeMigrate(); await schedule(); await cleanup().catch(() => {}); });
