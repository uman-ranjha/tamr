// Tamr and Miswak. Oval body, dot eyes, warm colors, posture does the acting.
// Tamr moods: chill | worried | happy ('panic' is an alias of worried). Miswak moods: calm | happy.
const FACE = '#3a1d12', ARM = '#7a3218';

export function tamrBody(sit = false) {
  return `
  ${sit ? '' : '<rect x="44" y="100" width="12" height="13" rx="6" fill="#6a2812"/><rect x="64" y="100" width="12" height="13" rx="6" fill="#6a2812"/>'}
  <ellipse cx="60" cy="68" rx="30" ry="38" fill="#9b4523"/>
  <path d="M60 30 A30 38 0 0 1 60 106 A13 38 0 0 0 60 30Z" fill="#7a3218"/>
  <ellipse cx="45" cy="52" rx="4.5" ry="9" fill="#bd6a3d" transform="rotate(-18 45 52)"/>
  <path d="M38 40 Q39 16 60 15 Q81 16 82 40 Q60 46 38 40Z" fill="#f6eedd"/>
  <path d="M62 15 Q81 17 82 40 Q74 43 66 43 Q74 28 62 15Z" fill="#e3d3b4"/>
  <path d="M39 35 Q60 41 81 35" stroke="#e0b75a" stroke-width="4" fill="none" stroke-linecap="round"/>
  <ellipse cx="43" cy="73" rx="5" ry="3" fill="#e88a6e" opacity=".6"/><ellipse cx="77" cy="73" rx="5" ry="3" fill="#e88a6e" opacity=".6"/>
  ${sit ? '<ellipse cx="45" cy="106" rx="9" ry="5.5" fill="#6a2812"/><ellipse cx="75" cy="106" rx="9" ry="5.5" fill="#6a2812"/>' : ''}`;
}

// Faces in Tamr's body coordinates.
export const TFACE = {
  dots: `<circle cx="50" cy="64" r="3.4" fill="#3a1d12"/><circle cx="70" cy="64" r="3.4" fill="#3a1d12"/>
    <path d="M56 76 Q60 79.5 64 76" stroke="#3a1d12" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  up: `<circle cx="51" cy="61" r="3.4" fill="#3a1d12"/><circle cx="71" cy="61" r="3.4" fill="#3a1d12"/>
    <ellipse cx="60" cy="76" rx="2.6" ry="3" fill="#3a1d12"/>`,
  closed: `<path d="M45 65 Q49.5 61 54 65 M66 65 Q70.5 61 75 65" stroke="#3a1d12" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <path d="M55 74 Q60 79 65 74" stroke="#3a1d12" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  sleep: `<path d="M45 65 H54 M66 65 H75" stroke="#3a1d12" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M57 76 Q60 78 63 76" stroke="#3a1d12" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  happy: `<path d="M45 65 Q49.5 60.5 54 65 M66 65 Q70.5 60.5 75 65" stroke="#3a1d12" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <path d="M54 73 Q60 81 66 73" stroke="#3a1d12" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
};

const arms = d => `<path d="${d}" stroke="${ARM}" stroke-width="7" fill="none" stroke-linecap="round"/>`;

export function tamr(mood = 'chill') {
  if (mood === 'panic') mood = 'worried';
  let inner;
  if (mood === 'doze') {
    inner = `
    <ellipse cx="60" cy="117" rx="34" ry="4.5" fill="#0a2a29" opacity=".45"/>
    <g transform="translate(0 6)">
      ${tamrBody(true)}
      ${arms('M33 84 q4 8 14 8 M87 84 q-4 8 -14 8')}
      ${TFACE.sleep}
    </g>
    <text x="90" y="40" font-family="system-ui, sans-serif" font-size="15" font-weight="800" fill="#5f9690">z</text>
    <text x="100" y="27" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#5f9690">z</text>`;
  } else if (mood === 'worried') {
    inner = `
    <ellipse cx="60" cy="118" rx="28" ry="4.5" fill="#0a2a29" opacity=".45"/>
    <g transform="rotate(5 60 112)">
      ${tamrBody()}
      ${arms('M33 82 q4 8 15 8 M87 82 q-4 8 -15 8')}
      <path d="M44 57 L53 54.5 M67 54.5 L76 57" stroke="${FACE}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="50" cy="65" r="3.2" fill="${FACE}"/><circle cx="70" cy="65" r="3.2" fill="${FACE}"/>
      <path d="M56 78 Q60 75.5 64 78" stroke="${FACE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    </g>
    <path d="M96 36 q-4.5 7 0 10 q4.5 -3 0 -10z" fill="#8fd0f0"/>`;
  } else if (mood === 'happy') {
    inner = `
    <ellipse cx="60" cy="119" rx="20" ry="3.5" fill="#0a2a29" opacity=".4"/>
    <g transform="translate(0 -9)">
      ${arms('M33 66 q-10 -6 -11 -18 M87 64 q10 -6 11 -18')}
      ${tamrBody()}
      <path d="M45 65 Q49.5 60.5 54 65 M66 65 Q70.5 60.5 75 65" stroke="${FACE}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
      <path d="M54 73 Q60 81 66 73" stroke="${FACE}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    </g>
    <path d="M106 22 l1.8 4.4 4.4 1.8 -4.4 1.8 -1.8 4.4 -1.8 -4.4 -4.4 -1.8 4.4 -1.8z" fill="#e0b75a"/>`;
  } else {
    inner = `
    <ellipse cx="60" cy="118" rx="28" ry="4.5" fill="#0a2a29" opacity=".45"/>
    ${arms('M31 76 q-7 5 -8 12 M88 70 q10 -6 12 -19')}
    ${tamrBody()}
    <circle cx="50" cy="64" r="3.4" fill="${FACE}"/><circle cx="70" cy="64" r="3.4" fill="${FACE}"/>
    <path d="M56 76 Q60 79.5 64 76" stroke="${FACE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }
  return `<svg viewBox="0 0 120 125" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tamr, ${mood}">${inner}</svg>`;
}

// Simplified Tamr for the 16/32px toolbar icon.
// Miswak's top: an upward fan of fibres behind (MFAN), and a frayed cream cap in front (MCAP) whose fringe
// comes down over his forehead, so the fibres grow from his whole head rather than sitting behind a bare dome.
const MFAN = `<g stroke-width="3.4" stroke-linecap="round" fill="none">
    <path d="M47.0 46.0 Q43.3 34.5 34.1 29.5" stroke="#e3d3b4"/>
    <path d="M49.2 45.5 Q45.4 31.7 36.0 24.1" stroke="#efe4cc"/>
    <path d="M51.3 45.0 Q48.3 31.2 40.6 22.3" stroke="#f6eedd"/>
    <path d="M53.5 44.5 Q51.3 31.1 45.6 21.5" stroke="#efe4cc"/>
    <path d="M55.7 44.0 Q53.8 27.4 49.0 14.5" stroke="#e3d3b4"/>
    <path d="M57.8 43.5 Q56.9 27.3 54.6 14.3" stroke="#e3d3b4"/>
    <path d="M60.0 43.0 Q60.0 26.5 60.0 13.0" stroke="#efe4cc"/>
    <path d="M62.2 43.5 Q63.0 27.6 65.4 14.8" stroke="#f6eedd"/>
    <path d="M64.3 44.0 Q66.0 28.5 70.5 16.4" stroke="#efe4cc"/>
    <path d="M66.5 44.5 Q68.9 29.8 75.2 19.1" stroke="#e3d3b4"/>
    <path d="M68.7 45.0 Q71.9 30.1 80.3 20.5" stroke="#e3d3b4"/>
    <path d="M70.8 45.5 Q73.9 34.1 81.7 27.9" stroke="#efe4cc"/>
    <path d="M73.0 46.0 Q76.7 34.5 85.9 29.5" stroke="#e3d3b4"/>
  </g>`;
const MCAP = `<path d="M44 57 Q43 42 52 39 Q60 36.5 68 39 Q77 42 76 57 Q74.5 61.5 72.5 57.5 Q70.5 62 68.5 57.5 Q66.5 62 64.5 57.5 Q62.5 62 60.5 57.5 Q58.5 62 56.5 57.5 Q54.5 62 52.5 57.5 Q50.5 62 48.5 57.5 Q46.5 62 44 57Z" fill="#efe4cc"/>
  <path d="M68 39 Q77 42 76 57 Q74.5 61.5 72.5 57.5 Q70.5 62 68.5 57.5 Q71 50 68 39Z" fill="#e3d3b4"/>
  <g stroke-width="3" stroke-linecap="round" fill="none" stroke="#f6eedd"><path d="M50 43 Q47 36 45 31 M55 40 Q54 33 53 28 M60 39 V28 M65 40 Q66 33 67 28 M70 43 Q73 36 75 31"/></g>`;

export function miswakBody() {
  return `
  <rect x="51" y="106" width="8" height="10" rx="4" fill="#7a5426"/><rect x="62" y="106" width="8" height="10" rx="4" fill="#7a5426"/>
  ${MFAN}
  <rect x="45" y="40" width="30" height="70" rx="15" fill="#c9965a"/>
  <path d="M66 41 Q75 44 75 56 V95 Q75 108 64 110 Q69 100 69 90 V54 Q69 46 66 41Z" fill="#a4763b"/>
  <ellipse cx="51" cy="68" rx="2.6" ry="5" fill="#dcae74"/>
  ${MCAP}
  <ellipse cx="49" cy="77" rx="3.6" ry="2.4" fill="#e88a6e" opacity=".6"/><ellipse cx="71" cy="77" rx="3.6" ry="2.4" fill="#e88a6e" opacity=".6"/>`;
}
export const MFACE = {
  dots: `<circle cx="54" cy="70" r="3" fill="#3a1d12"/><circle cx="66" cy="70" r="3" fill="#3a1d12"/>
    <path d="M57 79 Q60 81.5 63 79" stroke="#3a1d12" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  up: `<circle cx="55" cy="67" r="3" fill="#3a1d12"/><circle cx="67" cy="67" r="3" fill="#3a1d12"/>
    <path d="M57 79 Q60 81.5 63 79" stroke="#3a1d12" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  closed: `<path d="M50 70 Q54 74 58 70 M62 70 Q66 74 70 70" stroke="#3a1d12" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M57 79 Q60 81.5 63 79" stroke="#3a1d12" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  happy: `<path d="M50 70 Q54 66 58 70 M62 70 Q66 66 70 70" stroke="#3a1d12" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M55 78 Q60 84 65 78" stroke="#3a1d12" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
};

export function miswak(mood = 'calm') {
  const face = mood === 'happy'
    ? `<path d="M50 70 Q54 66 58 70 M62 70 Q66 66 70 70" stroke="${FACE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
       <path d="M55 78 Q60 84 65 78" stroke="${FACE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : `<circle cx="54" cy="70" r="3" fill="${FACE}"/><circle cx="66" cy="70" r="3" fill="${FACE}"/>
       <path d="M57 79 Q60 81.5 63 79" stroke="${FACE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 120 125" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Miswak">
  <ellipse cx="60" cy="118" rx="20" ry="4" fill="#0a2a29" opacity=".45"/>
  <path d="M45 82 q-8 3 -10 11 M75 82 q8 3 10 11" stroke="#a4763b" stroke-width="6" fill="none" stroke-linecap="round"/>
  <rect x="51" y="106" width="8" height="10" rx="4" fill="#7a5426"/><rect x="62" y="106" width="8" height="10" rx="4" fill="#7a5426"/>
  ${MFAN}
  <rect x="45" y="40" width="30" height="70" rx="15" fill="#c9965a"/>
  <path d="M66 41 Q75 44 75 56 V95 Q75 108 64 110 Q69 100 69 90 V54 Q69 46 66 41Z" fill="#a4763b"/>
  <ellipse cx="51" cy="68" rx="2.6" ry="5" fill="#dcae74"/>
  ${MCAP}
  <ellipse cx="49" cy="77" rx="3.6" ry="2.4" fill="#e88a6e" opacity=".6"/><ellipse cx="71" cy="77" rx="3.6" ry="2.4" fill="#e88a6e" opacity=".6"/>
  ${face}
</svg>`;
}

// ---------- Walkable versions (jointed for lib/walk.js) ----------
// Parts are <g class="w-…"> groups the walk engine moves: shadow, hop, legL, legR, body, armL, armR, top
// (kufi / bristles), the faces (w-f-main, w-f-up, w-f-oops) and w-loose (Tamr's kufi once it has fallen off).
const KUFI = `<path d="M38 40 Q39 16 60 15 Q81 16 82 40 Q60 46 38 40Z" fill="#f6eedd"/>
  <path d="M62 15 Q81 17 82 40 Q74 43 66 43 Q74 28 62 15Z" fill="#e3d3b4"/>
  <path d="M39 35 Q60 41 81 35" stroke="#e0b75a" stroke-width="4" fill="none" stroke-linecap="round"/>`;
const T_FACES = {
  chill: `<circle cx="50" cy="64" r="3.4" fill="${FACE}"/><circle cx="70" cy="64" r="3.4" fill="${FACE}"/>
    <path d="M56 76 Q60 79.5 64 76" stroke="${FACE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  worried: `<path d="M44 57 L53 54.5 M67 54.5 L76 57" stroke="${FACE}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="50" cy="65" r="3.2" fill="${FACE}"/><circle cx="70" cy="65" r="3.2" fill="${FACE}"/>
    <path d="M56 78 Q60 75.5 64 78" stroke="${FACE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M94 34 q-4.5 7 0 10 q4.5 -3 0 -10z" fill="#8fd0f0"/>`,
  happy: `<path d="M45 65 Q49.5 60.5 54 65 M66 65 Q70.5 60.5 75 65" stroke="${FACE}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <path d="M54 73 Q60 81 66 73" stroke="${FACE}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
};
// "Huh?" (looking up at where the kufi was) and "heh, oops" (eyes squeezed, wobbly grin, big blush, sweat drop).
const T_UP = `<circle cx="51" cy="60" r="3.6" fill="${FACE}"/><circle cx="71" cy="60" r="3.6" fill="${FACE}"/>
  <ellipse cx="60" cy="77" rx="2.8" ry="3.4" fill="${FACE}"/>`;
const T_OOPS = `<ellipse cx="43" cy="72" rx="7.5" ry="4.5" fill="#e8705a" opacity=".85"/><ellipse cx="77" cy="72" rx="7.5" ry="4.5" fill="#e8705a" opacity=".85"/>
  <path d="M45 62 L52 65 L45 68 M75 62 L68 65 L75 68" stroke="${FACE}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M54 77 q2 -2.5 4 0 t4 0 t4 0" stroke="${FACE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M90 30 q-4.5 7 0 10 q4.5 -3 0 -10z" fill="#8fd0f0"/>`;
const hide = 'style="display:none"';

export function walker(who = 'tamr', mood = 'chill') {
  if (who === 'miswak') {
    const face = mood === 'happy' ? MFACE.happy : MFACE.dots;
    return `<svg viewBox="0 0 120 125" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Miswak" overflow="visible">
  <ellipse class="w-shadow" cx="60" cy="118" rx="20" ry="4" fill="#0a2a29" opacity=".45"/>
  <g class="w-hop">
    <g class="w-legL"><rect x="51" y="106" width="8" height="10" rx="4" fill="#7a5426"/></g>
    <g class="w-legR"><rect x="62" y="106" width="8" height="10" rx="4" fill="#7a5426"/></g>
    <g class="w-body">
      <g class="w-armL"><path d="M45 82 q-6 6 -6 14" stroke="#a4763b" stroke-width="6" fill="none" stroke-linecap="round"/></g>
      <g class="w-armR"><path d="M75 82 q6 6 6 14" stroke="#a4763b" stroke-width="6" fill="none" stroke-linecap="round"/></g>
      <g class="w-top">${MFAN}</g>
      <rect x="45" y="40" width="30" height="70" rx="15" fill="#c9965a"/>
      <path d="M66 41 Q75 44 75 56 V95 Q75 108 64 110 Q69 100 69 90 V54 Q69 46 66 41Z" fill="#a4763b"/>
      <ellipse cx="51" cy="68" rx="2.6" ry="5" fill="#dcae74"/>
      ${MCAP}
      <ellipse cx="49" cy="77" rx="3.6" ry="2.4" fill="#e88a6e" opacity=".6"/><ellipse cx="71" cy="77" rx="3.6" ry="2.4" fill="#e88a6e" opacity=".6"/>
      <g class="w-f-main">${face}</g>
    </g>
  </g>
</svg>`;
  }
  if (mood === 'panic') mood = 'worried';
  const leg = x => `<rect x="${x}" y="100" width="12" height="13" rx="6" fill="#6a2812"/>`;
  return `<svg viewBox="0 0 120 125" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tamr, ${mood}" overflow="visible">
  <ellipse class="w-shadow" cx="60" cy="118" rx="26" ry="4.5" fill="#0a2a29" opacity=".45"/>
  <g class="w-hop">
    <g class="w-legL">${leg(44)}</g><g class="w-legR">${leg(64)}</g>
    <g class="w-body">
      <g class="w-armL"><path d="M33 78 q-7 9 -5 18" stroke="${ARM}" stroke-width="7" fill="none" stroke-linecap="round"/></g>
      <g class="w-armR"><path d="M87 78 q7 9 5 18" stroke="${ARM}" stroke-width="7" fill="none" stroke-linecap="round"/></g>
      <ellipse cx="60" cy="68" rx="30" ry="38" fill="#9b4523"/>
      <path d="M60 30 A30 38 0 0 1 60 106 A13 38 0 0 0 60 30Z" fill="#7a3218"/>
      <ellipse cx="45" cy="52" rx="4.5" ry="9" fill="#bd6a3d" transform="rotate(-18 45 52)"/>
      <ellipse cx="43" cy="73" rx="5" ry="3" fill="#e88a6e" opacity=".6"/><ellipse cx="77" cy="73" rx="5" ry="3" fill="#e88a6e" opacity=".6"/>
      <g class="w-top">${KUFI}</g>
      <g class="w-f-main">${T_FACES[mood] || T_FACES.chill}</g>
      <g class="w-f-up" ${hide}>${T_UP}</g>
      <g class="w-f-oops" ${hide}>${T_OOPS}</g>
    </g>
  </g>
  <g class="w-loose" ${hide}>${KUFI}</g>
</svg>`;
}
