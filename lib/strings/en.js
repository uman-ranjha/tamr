// English: the master list. Every other language file uses the same keys; anything missing falls back to this.
// {p} = prayer name, {n} = number, {t} = time or duration, {at} = clock time. Arrays are picked from at random.
export default {
  // names
  tamr: 'Tamr', miswak: 'Miswak',
  p_fajr: 'Fajr', p_dhuhr: 'Dhuhr', p_asr: 'Asr', p_maghrib: 'Maghrib', p_isha: 'Isha', p_jumuah: 'Jumuʿah', sunrise: 'Sunrise',
  dur_hm: '{h}h {m}m', dur_m: '{m}m',

  // new tab
  greet_night: 'Peaceful night', greet_morning: 'Good morning', greet_afternoon: 'Good afternoon', greet_evening: 'Good evening', greet_late: 'Good night',
  search_ph: 'Search the web or type a URL', search_btn: 'Search',
  pill_due: '{p} is in', pill_left: '{t} left', pill_left_sun: '{t} left · sunrise {at}', pill_next: '{p} in {t}',
  aria_prayers: 'Prayer times', aria_due: '{p} is in, {t} left. Show all prayers', aria_next: '{p} in {t}, at {at}. Show all prayers',
  mark: 'Mark {p} as prayed', unmark: 'Unmark {p}', sunset: 'Sunset {t}', prayed_btn: 'Prayed {p} ✓',
  tab_verse: 'Verse', tab_dua: 'Dua', tab_name: 'Name of Allah',
  read_surah: 'Read the surah', another: 'Another verse', good_for: 'Good {when}', as_in: 'As in {ref}', see_verse: 'See the verse',
  shortcuts: 'Shortcuts', add: 'Add', add_title: 'Add shortcut', f_name: 'Name', f_url: 'URL', cancel: 'Cancel', remove: 'Remove {name}',
  customize: 'Customize', c_name: 'Your name', c_name_ph: 'Shown in the greeting', c_show: 'Show on the page',
  c_glinks: 'Gmail & Images links', c_prayer: 'Prayer line', c_shortcuts: 'Shortcuts', c_daily: 'Verse / Dua / Name card',
  c_miswak: 'Miswak', c_hideseek: 'Miswak plays hide & seek', c_hidenow: 'Hide now', c_h24: '24-hour clock',
  c_bg: 'Background', sky_auto: 'Follows the sky', sky_dawn: 'Always dawn', sky_day: 'Always day', sky_golden: 'Always golden hour', sky_night: 'Always night',
  c_lang: 'Language', lang_auto: 'Same as Chrome', c_saved: 'Changes save right away.', done: 'Done',
  hs_found: 'You found me! That\'s {n} this month.', hs_count: 'Found him {n} this month', hs_none: 'Not found yet this month',
  tip_fajr_far: 'Fajr in {n} min. Tahajjud time, or a little more sleep?', tip_fajr_near: 'Fajr in {n} min. Time to get up and make wudu.',
  tip_jumuah: 'Jumuʿah in {n} min. Head out early.', tip_maghrib: 'Maghrib in {n} min. The sun\'s almost down.',
  tip_isha: 'Isha in {n} min. Last one of the day.', tip_next: '{p} in {n} min. Good time to wrap up.',
  tip_morning: 'Morning adhkar? Five calm minutes.', tip_kahf: 'It\'s Friday. Al-Kahf today?', tip_late: 'It\'s late. Sleep soon so Fajr\'s easier.',
  idle: ['Bismillah. Let\'s get to it.', 'Drink some water.', 'Shoulders down. Breathe.', 'Have you made dua today?',
    'A smile is charity.', 'Small and steady beats big and rare.', 'Stretch for a second?', 'SubhanAllah, look how far you\'ve come.'],

  // dua: when it's good for
  when_20_114: 'before class or studying', when_2_201: 'for good in both worlds', when_3_8: 'for a steady heart', when_7_23: 'when you slip up',
  when_25_74: 'for family', when_14_40: 'to keep up the prayer', when_14_41: 'for parents and believers', when_17_24: 'for your parents',
  when_21_87: 'when things feel heavy', when_28_24: 'when you need provision', when_20_25: 'before something stressful',
  when_18_10: 'for guidance', when_23_118: 'for forgiveness',

  // popup
  pop_chill: '{p} is in. There\'s time, but let\'s not leave it too late.', pop_worried: 'We\'re halfway through {p}\'s time.',
  pop_panic: '{p} ends in {n} minutes. Now\'s the time.', pop_left_for: 'left for {p}', pop_left_sun: 'left until sunrise ({at})', sun_note: 'Sunrise is at {at}.', row_in: 'in {t}', sun_at: 'sunrise {at}',
  missed: 'missed?', settings: 'Settings',

  // walk-on cards, notifications, toolbar
  bg_ends: '{p} ends in {t}', bg_next: 'Next: {p} at {at}',
  btn_onit: 'On it 👍', thanks_wudu: 'See you at the adhan.', btn_prayed: 'Prayed {p} ✓', thanks_prayed: 'MashaAllah. See you at the next one.',
  btn_done: 'Done ✓', thanks_m: 'May it be accepted.', n_prayed: 'Prayed it ✅', n_done: 'Done ✅', snooze5: 'Snooze 5 min', snooze5s: 'Snooze 5m',
  test_thanks: 'That was just a test 👋', cant_walk: '{who} couldn\'t walk on',
  cant_walk_msg: 'Switch to a regular website tab (like google.com) within 5 seconds of pressing the test button.',
  ov_pause: 'Don\'t show up on this site', ov_dismiss: 'Dismiss', ov_letgo: 'Click to let Tamr go',
  l_wudu: ['{p} is coming up soon. Good time to make wudu.', 'A few minutes until {p}. Want to get wudu out of the way?'],
  l_fajr: ['Fajr has come in. Prayer is better than sleep.', 'It\'s Fajr time. Rise and shine.'],
  l_start: ['It\'s time for {p}.', '{p} has come in. Whenever you\'re ready.'],
  l_half: ['Half of {p}\'s time has passed. Let\'s not leave it too late.', 'Just a heads up, we\'re halfway through {p}.'],
  l_late: ['About 20 minutes left for {p}. Now\'s the time.', '{p} is ending soon. Let\'s pray before it\'s out.'],
  l_jumuah: ['Jumuʿah is in about 45 minutes. Time to get ready.', 'It\'s Friday. Jumuʿah soon, so head out early if you can.'],
  l_snooze: ['Back again. {p} is still waiting for you.', 'Checking in on {p}.'],
  m_morning: ['Morning adhkar? Five calm minutes. I\'ll wait.', 'Breathe. Start the day with your morning adhkar.'],
  m_evening: ['Evening adhkar whenever you\'re ready.', 'The day\'s winding down. Evening adhkar time.'],
  m_kahf: ['It\'s Friday. Surah Al-Kahf, whenever you\'re ready.', 'Friday reminder: Al-Kahf. Find a quiet corner.'],
  m_quran: ['One page of Qur\'an today? Just one. Small and steady.', 'Your daily page is waiting for you.'],

  // settings page
  o_title: 'Tamr · Settings', o_intro: 'Set your location and method so the times match your masjid.',
  o_loc: 'Location', o_auto: 'Update my location automatically', o_auto_note: 'When you travel, the times follow you. Checked at most every few hours, from the new tab.',
  o_locate: 'Use my current location', o_finding: 'Finding you…', o_loc_err: 'Couldn\'t get your location ({e}). Search for your city instead.',
  o_find: 'Find a city', o_find_ph: 'Cairo, Jakarta, Lahore…', o_nomatch: 'No matches. Try another spelling.', o_offline: 'Search needs an internet connection.',
  o_coords: 'Coordinates', o_place: 'Place name', o_coords_l: 'Coordinates', o_privacy: 'City names come from BigDataCloud and Open-Meteo. Only the city you type, or your coordinates, are sent.',
  o_times: 'Prayer times', o_method: 'Calculation method', o_automatic: 'Automatic ({x})', o_asr: 'Asr', o_standard: 'Standard', o_hanafi: 'Hanafi',
  o_isha: 'Isha counts as late after', o_midnight: 'Islamic midnight', o_fajr: 'Fajr',
  o_lang: 'Language',
  o_nudges_h: 'Tamr\'s nudges', o_nudges: 'Nudges on', o_overlay: 'Walk onto the page (off = regular notifications)',
  o_backup: 'Desktop notification when Chrome isn\'t in front, and for the last 20 min', o_doze: 'Tamr dozes on the page for a minute after you pray', o_wudu: 'Wudu reminder (minutes before)',
  o_paused_h: 'Sites where Tamr stays off the page', o_paused_none: 'None. Pause a site from Tamr\'s card when he shows up.', o_unpause: 'Unpause',
  o_miswak_h: 'Miswak', o_adhkar: 'Morning & evening adhkar', o_kahf: 'Surah Al-Kahf on Fridays', o_quran: 'Daily Qur\'an page', o_qtime: 'Qur\'an reminder time',
  o_try: 'Try it', o_try_note: 'Press a button, then switch to any normal website tab. The character walks on after 5 seconds. Tests don\'t mark anything as prayed.',
  o_t_wudu: 'Wudu reminder', o_t_adhan: 'Adhan', o_t_half: 'Halfway', o_t_late: '20 min left', o_t_oops: 'Kufi slip', o_t_madhkar: 'Miswak: adhkar', o_t_mquran: 'Miswak: Qur\'an',
  o_switch: 'Switch to a website tab now… {n}', o_here: 'Here they come!',
  o_save: 'Save', o_saved: 'Saved. Tamr has rescheduled everything.', o_check: 'Check the coordinates.',
};
