[![CI](https://github.com/uman-ranjha/tamr/actions/workflows/ci.yml/badge.svg)](https://github.com/uman-ranjha/tamr/actions/workflows/ci.yml)

# Tamr

Version 3.8.0.

Tamr is a Chrome extension (Manifest V3) that reminds you of salah. Tamr himself is a little date character in a kufi. When a prayer time comes up, he walks onto whatever page you are on.

He shows up four times per prayer window. First for wudu. Then at adhan. Again halfway through the window. And once more when there are 20 minutes left.

Miswak is the second character. He lives on the new tab page, with a daily verse, dua, or Name of Allah, plus adhkar, Al-Kahf, and daily Qur'an reminders.

Chrome Web Store: coming soon (in review).

Privacy policy: https://uman-ranjha.github.io/tamr-privacy/

## Features

- Location is picked up automatically. The calculation method and Hanafi Asr are picked by country.
- Prayer times still work far from the equator. High latitudes are handled.
- Sunrise is shown, so you know when Fajr ends.
- The popup has animated scenes and today's checklist.
- English and Arabic, with full RTL support.
- Settings and your prayer log sync across Chrome.
- You can pause Tamr per site, so he does not show up where you do not want him.

## Install (dev)

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Click Load unpacked.
4. Pick this folder.

## Tests

Run `npm test`. You need Node 18 or newer, and there are no dependencies to install.

It checks prayer times at normal, high, and polar latitudes, plus settings validation and the daily data files. `package.json` and `tests/` exist only for that check. They are not part of the Web Store zip.

## Project layout

```
manifest.json       MV3 manifest (name/description come from _locales)
_locales/en, /ar    extension name + description (Chrome's built-in i18n)
background.js       service worker: alarms, scheduling, building nudges
overlay.js          content script: Tamr walks onto the page
popup.*             toolbar popup
newtab.*            new tab page (Miswak, prayer pill, shortcuts, sky backgrounds)
options.*           settings page
lib/core.js         settings, sync storage, prayer windows, method/madhab by country
lib/adhan.js        prayer time calculation (adhan-js, MIT)
lib/walk.js         walk animation engine (TamrWalk)
lib/art.js          character SVGs
lib/scenes.js       popup scenes
lib/place.js        geolocation + city search
lib/i18n.js, lib/strings/   UI translations (en, ar)
lib/daily.js        verses / duas / names data
package.json        only so `npm test` can run, not part of the store zip
tests/run.js        Node checks for prayer times, settings, and data files
fonts/, img/        assets
```

## Privacy

No accounts, no analytics. Your location stays in Chrome storage. City lookups only go to BigDataCloud for reverse geocoding and Open-Meteo for search, and only when you actually use them.

## Credits

- adhan-js (MIT) for prayer time calculation.
- Fonts: Inter, Newsreader, Amiri Quran (SIL OFL, see `fonts/LICENSE.txt`).
- Qur'an translation: Saheeh International.

## Author

Uman Ranjha
