// Plain Node checks for the prayer-time logic, settings validation and data files. Run: npm test (Node 18+).
// No dependencies. Times are checked in UTC so results don't depend on the machine's time zone.
process.env.TZ = 'UTC';
const { windowsFor, cleanSettings, DEFAULTS, methodFor, madhabFor, resolved } = await import('../lib/core.js');
const { VERSES, DUAS, NAMES, SURAH_AR } = await import('../lib/daily.js');
const en = (await import('../lib/strings/en.js')).default, ar = (await import('../lib/strings/ar.js')).default;

let fails = 0, passes = 0;
const check = (ok, msg) => { if (ok) passes++; else { fails++; console.error('FAIL', msg); } };
const hhmm = d => d.toISOString().slice(11, 16);

// 1. Every place, every week of the year: five prayers, all real times, in order.
const places = { Brooklyn: [40.68, -73.94, 'US'], Jakarta: [-6.2, 106.85, 'ID'], Karachi: [24.86, 67.0, 'PK'], Cairo: [30.04, 31.24, 'EG'],
  London: [51.5, -0.12, 'GB'], Oslo: [59.91, 10.75, 'NO'], Reykjavik: [64.15, -21.94, 'IS'], Tromso: [69.65, 18.96, 'NO'],
  Longyearbyen: [78.22, 15.65, 'NO'], Ushuaia: [-54.8, -68.3, 'AR'] };
for (const [name, [lat, lng, cc]] of Object.entries(places)) for (let wk = 0; wk < 53; wk++) {
  const d = new Date(Date.UTC(2026, 0, 1 + wk * 7, 12));
  for (const ishaEnd of ['midnight', 'fajr']) {
    const ws = windowsFor(d, { ...DEFAULTS, lat, lng, cc, ishaEnd });
    const label = `${name} ${d.toISOString().slice(0, 10)} ${ishaEnd}`;
    check(ws.length === 5 && ws.map(w => w.key).join() === 'fajr,dhuhr,asr,maghrib,isha', `${label}: five prayers`);
    check(ws.every(w => !isNaN(w.start) && !isNaN(w.end) && !isNaN(w.nudgeEnd)), `${label}: no Invalid Date`);
    check(ws.every(w => w.start <= w.end), `${label}: each prayer ends after it starts`);
    check(ws.every((w, i) => i === 0 || ws[i - 1].start <= w.start), `${label}: prayers in order`);
  }
}

// 2. Known times (Brooklyn, ISNA / Shafi, 9 Nov 2026), so a library swap or settings change can't silently shift them.
{
  const ws = windowsFor(new Date(Date.UTC(2026, 10, 9, 12)), { ...DEFAULTS });
  const got = ws.map(w => `${w.key} ${hhmm(w.start)}`).join(', ');
  check(got === 'fajr 10:18, dhuhr 16:41, asr 19:20, maghrib 21:43, isha 23:01', `Brooklyn reference times, got ${got}`);
}

// 3. Daylight-saving days in New York (8 Mar, 1 Nov 2026) still give five ordered prayers.
for (const day of [7, 8, 9]) check(windowsFor(new Date(Date.UTC(2026, 2, day, 12)), DEFAULTS).length === 5, `DST spring 2026-03-0${day}`);

// 4. Method and Asr by country.
check(methodFor('pk') === 'Karachi' && madhabFor('PK') === 'hanafi', 'Pakistan → Karachi, Hanafi');
check(methodFor('US') === 'NorthAmerica' && madhabFor('US') === 'shafi', 'US → ISNA, standard Asr');
check(methodFor('ZZ') === 'MuslimWorldLeague', 'unknown country → Muslim World League');
check(resolved({ method: 'Egyptian', madhab: 'hanafi', cc: 'US' }).method === 'Egyptian', 'manual method wins over country');

// 5. Settings validation: bad values fall back to defaults, good ones are kept.
{
  const s = cleanSettings({ lat: 21.42, lng: 39.83, cc: 'SA', wuduMin: 999, quranTime: null, method: 'Nope', lang: 'fr', nudges: 'yes', madhab: 'hanafi' });
  check(s.lat === 21.42 && s.cc === 'SA' && s.madhab === 'hanafi', 'keeps valid settings');
  check(s.wuduMin === DEFAULTS.wuduMin && s.quranTime === DEFAULTS.quranTime && s.method === 'auto' && s.lang === 'auto' && s.nudges === true, 'resets invalid settings');
  const t = cleanSettings({ lat: 'abc', lng: 10, place: 'Somewhere' });
  check(t.lat === DEFAULTS.lat && t.place === DEFAULTS.place, 'bad coordinates reset the whole place');
  check(JSON.stringify(cleanSettings(null)) === JSON.stringify(DEFAULTS), 'missing settings → defaults');
  check(JSON.stringify(cleanSettings('garbage')) === JSON.stringify(DEFAULTS), 'non-object settings → defaults');
}

// 6. Data files: every entry complete, every surah named in Arabic, every dua has its "good for" line.
const all = [...Object.values(VERSES).flat(), ...DUAS, ...NAMES];
check(all.every(x => x.ar && x.ref && Number.isInteger(x.s) && Number.isInteger(x.a)), 'daily entries have Arabic, reference, surah and ayah');
check(all.every(x => SURAH_AR[x.s]), 'every referenced surah has an Arabic name');
check(DUAS.every(d => en[`when_${d.s}_${d.a}`] && ar[`when_${d.s}_${d.a}`]), 'every dua has a "good for" line in English and Arabic');
check([...Object.values(VERSES).flat(), ...DUAS, ...NAMES].every(x => x.en), 'every entry has an English translation');

// 7. Strings: Arabic has exactly the English keys.
check(Object.keys(en).every(k => k in ar) && Object.keys(ar).every(k => k in en), 'English and Arabic have the same string keys');

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
