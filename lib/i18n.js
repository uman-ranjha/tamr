// Languages and translation. t('key', { p: 'Fajr' }) returns the string in the chosen language, falling back to English.
// The chosen language is Settings › Language, or Chrome's own language when that's "auto".
import STRINGS from './strings/index.js';

// English and Arabic. (English readers get the Saheeh International translation under verses; Arabic readers the verse itself.)
export const LANGS = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية', rtl: true },
];
const BY = Object.fromEntries(LANGS.map(l => [l.code, l]));

let cur = 'en';
export const lang = () => cur;
export const isRtl = (c = cur) => !!BY[c]?.rtl;

// 'auto' → Chrome's UI language if we have it ('en-US' → 'en', 'ar-EG' → 'ar'), else English.
export function resolveLang(pref) {
  if (pref && pref !== 'auto' && BY[pref]) return pref;
  let ui = 'en';
  try { ui = (chrome.i18n?.getUILanguage?.() || navigator.language || 'en').toLowerCase(); } catch { /* not in an extension */ }
  const base = ui.split(/[-_]/)[0];
  return BY[base] ? base : 'en';
}
export function setLang(pref) { cur = resolveLang(pref); return cur; }

export function t(key, vars = {}) {
  let v = STRINGS[cur]?.[key] ?? STRINGS.en[key];
  if (v === undefined) { console.warn('Tamr: missing string', key); return ''; }   // never show a raw key to people
  if (Array.isArray(v)) v = v[Math.floor(Math.random() * v.length)];
  return String(v).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

// Locale for dates, times and numbers. Arabic-script languages get their own digits from Intl.
export const locale = () => cur;
export const num = n => new Intl.NumberFormat(cur).format(n);

// Fill in static text marked in HTML: data-i18n (text), data-i18n-ph (placeholder), data-i18n-aria, data-i18n-title.
export function localize(root = document) {
  const d = root.documentElement || document.documentElement;
  d.lang = cur; d.dir = isRtl() ? 'rtl' : 'ltr';
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-ph]')) el.placeholder = t(el.dataset.i18nPh);
  for (const el of root.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
}
