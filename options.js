import { getSettings, cleanSettings, methodFor, madhabFor, migrateToSync } from './lib/core.js';
import { here, cityAt, searchCity } from './lib/place.js';
import { t, localize, LANGS, lang } from './lib/i18n.js';
import { tamr } from './lib/art.js';

const $ = id => document.getElementById(id);
const FIELDS = ['lang', 'auto', 'cc', 'place', 'lat', 'lng', 'method', 'madhab', 'ishaEnd', 'nudges', 'overlay', 'desktopBackup', 'doze', 'wuduMin', 'adhkar', 'kahf', 'quran', 'quranTime'];
$('tamr').innerHTML = tamr('happy');

await migrateToSync();
const s = await getSettings();
localize();
$('lang').innerHTML = `<option value="auto">${t('lang_auto')}</option>` + LANGS.map(l => `<option value="${l.code}" lang="${l.code}">${l.name}</option>`).join('');
for (const f of FIELDS) { const el = $(f); el.type === 'checkbox' ? (el.checked = !!s[f]) : (el.value = s[f]); }

const METHOD_NAMES = Object.fromEntries([...$('method').options].map(o => [o.value, o.textContent]));
function showPlace() {
  const cc = $('cc').value;
  $('placeNow').textContent = $('place').value || '—';
  const lat = parseFloat($('lat').value), lng = parseFloat($('lng').value);
  $('placeMeta').textContent = Number.isFinite(lat) && Number.isFinite(lng) ? ` · ${lat.toFixed(2)}, ${lng.toFixed(2)}` : '';
  $('methodAuto').textContent = t('o_automatic', { x: METHOD_NAMES[methodFor(cc)] });
  $('madhabAuto').textContent = t('o_automatic', { x: t(madhabFor(cc) === 'hanafi' ? 'o_hanafi' : 'o_standard') });
}
function setPlace(p) {
  $('place').value = p.place; $('lat').value = p.lat; $('lng').value = p.lng; $('cc').value = p.cc || '';
  showPlace(); $('save').click();
}
showPlace();
for (const f of ['place', 'lat', 'lng']) $(f).addEventListener('input', showPlace);

$('locate').onclick = async () => {
  $('locnote').textContent = t('o_finding');
  try {
    const p = await here();
    // Lookup failed? Keep the country you had, so the calculation method doesn't silently change.
    const c = await cityAt(p.lat, p.lng, lang()).catch(() => ({ place: `${p.lat}, ${p.lng}`, cc: $('cc').value }));
    setPlace({ ...p, ...c }); $('locnote').textContent = '';
  } catch (err) { $('locnote').textContent = t('o_loc_err', { e: err.message }); }
};

let searchT = 0;
$('city').addEventListener('input', () => {
  clearTimeout(searchT);
  const q = $('city').value.trim();
  if (q.length < 2) { $('results').innerHTML = ''; return; }
  searchT = setTimeout(async () => {
    try {
      const list = await searchCity(q, lang());
      $('results').innerHTML = '';
      if (!list.length) { $('results').innerHTML = `<li class="note">${t('o_nomatch')}</li>`; return; }
      for (const r of list) {
        const li = document.createElement('li'), b = document.createElement('button');
        b.className = 'pick'; b.innerHTML = '<b></b> <span class="note"></span>';
        b.querySelector('b').textContent = r.place; b.querySelector('span').textContent = r.detail;
        b.onclick = () => { setPlace(r); $('city').value = ''; $('results').innerHTML = ''; };
        li.append(b); $('results').append(li);
      }
    } catch { $('results').innerHTML = `<li class="note">${t('o_offline')}</li>`; }
  }, 300);
});

$('save').onclick = async () => {
  const out = {};
  for (const f of FIELDS) { const el = $(f); out[f] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value; }
  out.lat = $('lat').value.trim() === '' ? NaN : Number(out.lat); out.lng = $('lng').value.trim() === '' ? NaN : Number(out.lng);
  if (!isFinite(out.lat) || !isFinite(out.lng) || Math.abs(out.lat) > 90 || Math.abs(out.lng) > 180) { $('saved').textContent = t('o_check'); return; }
  // Same checks every screen uses when reading: anything out of range (e.g. a 999-minute wudu reminder) falls back to its default.
  const clean = cleanSettings(out);
  for (const f of FIELDS) { const el = $(f); if (el.type !== 'checkbox') el.value = clean[f]; }
  await chrome.storage.sync.set({ settings: clean });
  $('saved').textContent = t('o_saved');
  if ((clean.lang || 'auto') !== (s.lang || 'auto')) location.reload();
};


async function renderPaused() {
  const { pausedSites = [] } = await chrome.storage.sync.get('pausedSites');
  $('paused').innerHTML = pausedSites.length ? '' : `<li class="note">${t('o_paused_none')}</li>`;
  for (const h of pausedSites) {
    const li = document.createElement('li'); li.textContent = h;
    const b = document.createElement('button'); b.className = 'link'; b.textContent = t('o_unpause');
    b.onclick = async () => { await chrome.storage.sync.set({ pausedSites: pausedSites.filter(x => x !== h) }); renderPaused(); };
    li.append(b); $('paused').append(li);
  }
}
renderPaused();

document.querySelector('.tests').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  chrome.runtime.sendMessage({ type: 'test', who: b.dataset.who, stage: b.dataset.stage });
  let n = 5; $('testnote').textContent = t('o_switch', { n });
  const t = setInterval(() => { n--; $('testnote').textContent = n > 0 ? t('o_switch', { n }) : t('o_here'); if (n <= 0) clearInterval(t); }, 1000);
});
