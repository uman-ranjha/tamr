import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes, Madhab, HighLatitudeRule, PolarCircleResolution } from './adhan.js';
import { t, setLang, locale, num, lang } from './i18n.js';

export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
// Prayer names in the current language.
export const NAMES = new Proxy({}, { get: (_, k) => PRAYERS.includes(k) ? t('p_' + k) : undefined });

export const DEFAULTS = {
  lat: 40.6782, lng: -73.9442, place: 'Brooklyn, NY', cc: 'US', auto: true,
  method: 'auto', madhab: 'auto', ishaEnd: 'midnight', lang: 'auto',
  wuduMin: 10, nudges: true, overlay: true, desktopBackup: true, doze: true,
  adhkar: true, kahf: true, quran: true, quranTime: '21:00',
};

// Settings, new-tab choices, paused sites and the prayer log live in Chrome sync, so they follow you to any
// computer signed into the same Chrome profile. The log is split by month ('log-2026-11') to stay under sync's
// 8 KB-per-item limit, and months older than half a year are pruned.
export const SYNCED = ['settings', 'newtab', 'pausedSites'];
const LOG_MONTHS_KEPT = 6;
export const monthOf = day => 'log-' + day.slice(0, 7);

// Every stored value is checked and anything missing, malformed or out of range falls back to the default,
// so one bad value in sync (an old version, a manual edit) can't stop reminders from being scheduled.
const isNum = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const oneOf = (v, list) => list.includes(v);
const CHECKS = {
  lat: v => isNum(v, -90, 90), lng: v => isNum(v, -180, 180),
  place: v => typeof v === 'string' && v.length <= 120, cc: v => typeof v === 'string' && /^([A-Za-z]{2})?$/.test(v),
  method: v => v === 'auto' || (typeof v === 'string' && Object.hasOwn(CalculationMethod, v)),
  madhab: v => oneOf(v, ['auto', 'shafi', 'hanafi']), ishaEnd: v => oneOf(v, ['midnight', 'fajr']),
  lang: v => oneOf(v, ['auto', 'en', 'ar']), wuduMin: v => Number.isInteger(v) && v >= 0 && v <= 60,
  quranTime: v => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
};
export function cleanSettings(raw) {
  const s = { ...DEFAULTS };
  if (raw && typeof raw === 'object') for (const k in DEFAULTS) {
    const v = raw[k];
    if (v === undefined) continue;
    if (CHECKS[k] ? CHECKS[k](v) : typeof v === typeof DEFAULTS[k]) s[k] = v;
  }
  // Coordinates only make sense as a pair.
  if (!CHECKS.lat(raw?.lat) || !CHECKS.lng(raw?.lng)) Object.assign(s, { lat: DEFAULTS.lat, lng: DEFAULTS.lng, place: DEFAULTS.place, cc: DEFAULTS.cc });
  return s;
}

export async function getSettings() {
  let settings;
  try { ({ settings } = await chrome.storage.sync.get('settings')); } catch (e) { console.warn('Tamr: settings unreadable', e); }
  const s = cleanSettings(settings);
  setLang(s.lang);   // every screen reads settings first, so this keeps the language current everywhere
  return s;
}
export async function getLog() {
  const all = await chrome.storage.sync.get(null);
  const log = {};
  for (const k in all) if (k.startsWith('log-')) Object.assign(log, all[k]);
  return log;
}
export async function setDone(day, key, val) {
  const mk = monthOf(day);
  const { [mk]: month = {} } = await chrome.storage.sync.get(mk);
  month[day] = { ...(month[day] || {}), [key]: val };
  await chrome.storage.sync.set({ [mk]: month });
  return getLog();
}
// Merge the old/new day maps from a storage change event (any 'log-YYYY-MM' keys).
export function logChange(ch) {
  const o = {}, n = {}; let any = false;
  for (const k in ch) if (k.startsWith('log-')) { any = true; Object.assign(o, ch[k].oldValue || {}); Object.assign(n, ch[k].newValue || {}); }
  return any ? { oldValue: o, newValue: n } : null;
}
// One-time move from this computer's local storage into sync, then prune old log months.
// Several screens call this on open; within one page it runs once, and it never throws (a failure is logged and
// the screen carries on with whatever is in sync).
let migrating = null;
export function migrateToSync() {
  return migrating ||= doMigrate().catch(e => { console.error('Tamr: sync migration failed', e); migrating = null; });
}
async function doMigrate() {
  const local = await chrome.storage.local.get([...SYNCED, 'log', 'syncedAt']);
  const sync = await chrome.storage.sync.get(null);
  const out = {};
  if (!local.syncedAt) {
    for (const k of SYNCED) if (local[k] !== undefined && sync[k] === undefined) out[k] = local[k];
    for (const day in local.log || {}) {
      const mk = monthOf(day);
      out[mk] = out[mk] || { ...(sync[mk] || {}) };
      out[mk][day] = { ...(local.log[day] || {}), ...(out[mk][day] || {}) };
    }
  }
  const months = Object.keys({ ...sync, ...out }).filter(k => k.startsWith('log-')).sort();
  const old = months.slice(0, Math.max(0, months.length - LOG_MONTHS_KEPT));
  for (const k of old) delete out[k];
  if (Object.keys(out).length) await chrome.storage.sync.set(out);
  if (old.length) await chrome.storage.sync.remove(old);
  if (!local.syncedAt) await chrome.storage.local.set({ syncedAt: Date.now() });
}

const pad = n => String(n).padStart(2, '0');
export const dayKey = d => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
export const isFriday = day => new Date(day + 'T12:00').getDay() === 5;

// The calculation method most people use in each country, and where Hanafi Asr is the norm.
const METHOD_BY_COUNTRY = {
  NorthAmerica: 'US CA',
  MoonsightingCommittee: 'GB IE',
  UmmAlQura: 'SA YE',
  Dubai: 'AE OM',
  Qatar: 'QA BH',
  Kuwait: 'KW',
  Singapore: 'SG MY ID BN',
  Turkey: 'TR AZ',
  Tehran: 'IR',
  Karachi: 'PK IN BD AF NP LK',
  Egyptian: 'EG SD SS LY SY LB JO PS IQ MA DZ TN NG NE ML SN BF TD GN SO ET ER DJ KE TZ UG MR GM GH CI CM',
};
const HANAFI = new Set('PK IN BD AF NP LK TR UZ KZ KG TJ TM BA AL XK MK RU'.split(' '));
export function methodFor(cc = '') {
  cc = cc.toUpperCase();
  for (const [m, list] of Object.entries(METHOD_BY_COUNTRY)) if (list.split(' ').includes(cc)) return m;
  return 'MuslimWorldLeague';
}
export const madhabFor = (cc = '') => HANAFI.has(cc.toUpperCase()) ? 'hanafi' : 'shafi';
export const resolved = s => ({
  method: s.method === 'auto' ? methodFor(s.cc) : s.method,
  madhab: s.madhab === 'auto' ? madhabFor(s.cc) : s.madhab,
});

function params(s) {
  const r = resolved(s);
  const p = (CalculationMethod[r.method] || CalculationMethod.MuslimWorldLeague)();
  p.madhab = r.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  // Far north/south, the sun barely sets in summer; use the standard high-latitude rule so Fajr and Isha stay sane.
  // (adhan-js's own HighLatitudeRule.recommended() only checks latitude > 48, i.e. the north; this covers both.)
  if (Math.abs(s.lat) > 48) p.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
  // Inside the polar circles the sun may not rise or set at all. Borrow times from the nearest latitude where it does.
  p.polarCircleResolution = PolarCircleResolution.AqrabBalad;
  return p;
}
const ok = d => d instanceof Date && !isNaN(d);



// The five prayer windows for one calendar day (start → when that prayer's time ends).
export function windowsFor(date, s) {
  const ws = computeWindows(date, s);
  // Safety net: if a time still can't be worked out (extreme latitude), use the times from the nearest
  // latitude that works rather than ever showing "Invalid Date" or skipping alarms.
  if (ws.every(w => ok(w.start) && ok(w.end))) return ws;
  return computeWindows(date, { ...s, lat: Math.sign(s.lat) * 65 });
}
function computeWindows(date, s) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const c = new Coordinates(s.lat, s.lng);
  const pt = new PrayerTimes(c, d, params(s));
  const tomorrow = new Date(d); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextFajr = new PrayerTimes(c, tomorrow, params(s)).fajr;
  const midnight = new SunnahTimes(pt).middleOfTheNight;
  const day = dayKey(d);
  const fri = d.getDay() === 5;
  // Polar night: sunrise/sunset are borrowed from a lower latitude but noon is real, so Asr can land before Dhuhr.
  // Keep Asr between Dhuhr and Maghrib in that case (halfway, the usual fallback).
  if (!(pt.asr > pt.dhuhr && pt.asr < pt.maghrib) && pt.maghrib > pt.dhuhr) pt.asr = new Date((+pt.dhuhr + +pt.maghrib) / 2);
  return [
    { key: 'fajr', name: t('p_fajr'), start: pt.fajr, end: pt.sunrise },
    { key: 'dhuhr', name: fri ? t('p_jumuah') : t('p_dhuhr'), start: pt.dhuhr, end: pt.asr },
    { key: 'asr', name: t('p_asr'), start: pt.asr, end: pt.maghrib },
    { key: 'maghrib', name: t('p_maghrib'), start: pt.maghrib, end: pt.isha },
    { key: 'isha', name: t('p_isha'), start: pt.isha, end: s.ishaEnd === 'fajr' ? nextFajr : midnight },
  ].map(w => ({ ...w, day, nudgeEnd: w.end }));   // reminders follow the same end you chose in Settings
}

export function allWindows(now, s) {
  const out = [];
  for (const o of [-1, 0, 1]) { const d = new Date(now); d.setDate(d.getDate() + o); out.push(...windowsFor(d, s)); }
  return out;
}

export function status(now, s) {
  const ws = allWindows(now, s);
  return {
    current: ws.find(w => w.start <= now && now < w.end) || null,
    next: ws.find(w => w.start > now) || null,
  };
}

export function urgency(w, now) {
  const end = w.nudgeEnd < w.end && now < w.nudgeEnd ? w.nudgeEnd : w.end;
  const left = (end - now) / 60000, frac = (now - w.start) / (end - w.start);
  if (left <= 20) return 'panic';
  if (frac >= 0.5 || left <= 45) return 'worried';
  return 'chill';
}

export const fmtTime = d => d.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' });
export const fmtLeft = m => { m = Math.max(0, Math.round(m)); return m >= 60 ? t('dur_hm', { h: num(Math.floor(m / 60)), m: num(m % 60) }) : t('dur_m', { m: num(m) }); };

// Hijri date with the commonly used month names ("27 Jumada al-Ula 1448").
const HIJRI_MONTHS = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'];
export function hijriLabel(d) {
  if (lang() !== 'en') return new Intl.DateTimeFormat(locale() + '-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(d).replace(/\s?(AH|هـ)$/, '');
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(d).map(x => [x.type, x.value]));
  return `${p.day} ${HIJRI_MONTHS[+p.month - 1]} ${String(p.year).replace(/\D/g, '')}`;
}
// "5:16 am" — lowercase to match the clock.
export const fmtClock = d => lang() === 'en' ? fmtTime(d).replace(/\s?([AP])M/i, (_, a) => ` ${a.toLowerCase()}m`) : fmtTime(d);
