// Animated scenes of Tamr & Miswak hanging out, shown in the popup when nothing is due.
// Pure SVG + SMIL animation (no scripts), viewBox 240×140.
import { tamrBody, TFACE, miswakBody, MFACE } from './art.js';

const FACE = '#3a1d12';

// ---------- animation helpers ----------
const R = (cx, cy, angles, dur, keyTimes = '', begin = '0s') =>
  `<animateTransform attributeName="transform" type="rotate" values="${angles.map(a => `${a} ${cx} ${cy}`).join(';')}"${keyTimes ? ` keyTimes="${keyTimes}"` : ''} dur="${dur}s" begin="${begin}" repeatCount="indefinite"/>`;
const TR = (pts, dur, keyTimes = '', begin = '0s') =>
  `<animateTransform attributeName="transform" type="translate" values="${pts.join(';')}"${keyTimes ? ` keyTimes="${keyTimes}"` : ''} dur="${dur}s" begin="${begin}" repeatCount="indefinite"/>`;
const OP = (values, dur, keyTimes = '', begin = '0s') =>
  `<animate attributeName="opacity" values="${values}"${keyTimes ? ` keyTimes="${keyTimes}"` : ''} dur="${dur}s" begin="${begin}" repeatCount="indefinite"/>`;
const D = (values, dur, keyTimes = '', begin = '0s') =>
  `<animate attributeName="d" values="${values.join(';')}"${keyTimes ? ` keyTimes="${keyTimes}"` : ''} dur="${dur}s" begin="${begin}" repeatCount="indefinite"/>`;
const bob = (dy, dur, begin = '0s') => TR(['0 0', `0 ${dy}`, '0 0'], dur, '', begin);
const twinkle = (x, y, r, dur, begin) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f3ead2">${OP('1;.25;1', dur, '', `${begin}s`)}</circle>`;
const steam = (x, y, begin) => `<path d="M${x} ${y} q-3 -4 0 -8 q3 -4 0 -8" stroke="#f3ead2" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0">
  ${OP('0;.6;0', 3, '', `${begin}s`)}${TR(['0 2', '0 -8'], 3, '', `${begin}s`)}</path>`;

// ---------- characters ----------
const TLIDS = { dots: [[50, 64], [70, 64]], up: [[51, 61], [71, 61]] };
const MLIDS = { dots: [[54, 70], [66, 70]], up: [[55, 67], [67, 67]] };
const lids = (pts, color, dur) => pts ? `<g opacity="0">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.4" fill="${color}"/><path d="M${x - 3.5} ${y + .5} h7" stroke="${FACE}" stroke-width="2.2" stroke-linecap="round"/>`).join('')}
  ${OP('0;0;1;0', dur, '0;.93;.96;1')}</g>` : '';

// face: 'dots' or [{f:'dots', o:'1;1;0;1', k:'0;.4;.5;1', dur:4}, ...] for swapping expressions over time
function faces(face, set, lidPts, lidColor, blink) {
  if (typeof face === 'string') return set[face] + lids(lidPts[face], lidColor, blink);
  return face.map(({ f, o, k, dur }) => `<g>${set[f]}${OP(o, dur, k)}</g>`).join('');
}

const arm = (d, color, w, held = '', anim = '') => `<g>${anim}<path d="${d}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/>${held}</g>`;
const tArm = (d, held = '', anim = '') => arm(d, '#7a3218', 7, held, anim);
const mArm = (d, held = '', anim = '') => arm(d, '#a4763b', 6, held, anim);

function T({ x, y, s = .6, flip = false, sit = false, face = 'dots', back = '', front = '', anim = bob(-1.2, 2.6), blink = 4.3, breathe = false }) {
  let inner = `${back}${tamrBody(sit)}${faces(face, TFACE, TLIDS, '#9b4523', blink)}${front}`;
  if (breathe) inner = `<g transform="translate(60 110)"><g>${`<animateTransform attributeName="transform" type="scale" values="1 1;1.025 .97;1 1" dur="3.4s" repeatCount="indefinite"/>`}<g transform="translate(-60 -110)">${inner}</g></g></g>`;
  return `<g transform="translate(${x} ${y}) scale(${s})${flip ? ' translate(120 0) scale(-1 1)' : ''}"><g>${anim}${inner}</g></g>`;
}
function M({ x, y, s = .6, flip = false, face = 'dots', back = '', front = '', anim = bob(-1.2, 2.9, '.6s'), blink = 5.1 }) {
  return `<g transform="translate(${x} ${y}) scale(${s})${flip ? ' translate(120 0) scale(-1 1)' : ''}"><g>${anim}
    ${back}${miswakBody()}${faces(face, MFACE, MLIDS, '#c9965a', blink)}${front}</g></g>`;
}

// ---------- props ----------
const lantern = (x, y, len) => `<g>${R(x, y - len, [-4, 4, -4], 4.5)}
  <path d="M${x} ${y - len} V${y}" stroke="#a07c35" stroke-width="1"/>
  <circle cx="${x}" cy="${y + 12}" r="18" fill="#f2cd6b" opacity=".12">${OP('.08;.2;.08', 3)}</circle>
  <path d="M${x - 4} ${y} h8 l2 3 h-12z" fill="#c99a3b"/>
  <path d="M${x - 6} ${y + 3} h12 l3 7 -3 11 h-12 l-3 -11z" fill="#e0b75a"/>
  <path d="M${x - 3.5} ${y + 6} h7 l1.5 4.5 -1.5 7 h-7 l-1.5 -7z" fill="#fff3c4">${OP('.85;1;.85', 1.7)}</path>
  <path d="M${x} ${y + 3} V${y + 21} M${x - 7.5} ${y + 10} H${x + 7.5}" stroke="#a07c35" stroke-width=".8"/>
  <path d="M${x - 5} ${y + 21} h10 l-5 5z" fill="#c99a3b"/></g>`;
const teaGlass = (x, y) => `<g><ellipse cx="${x}" cy="${y + 11}" rx="7" ry="1.8" fill="#e0b75a"/>
  <path d="M${x - 4.5} ${y} h9 q-1.5 5 0 10 h-9 q1.5 -5 0 -10z" fill="#c8452c" opacity=".9"/>
  <path d="M${x - 4.5} ${y} h9" stroke="#e0b75a" stroke-width="1.2"/><path d="M${x - 2.5} ${y + 2} v6" stroke="#fff" stroke-width=".8" opacity=".5"/></g>`;
const cloud = (x, y, s, dur, begin) => `<g opacity=".85">${TR([`${-60} 0`, `${300} 0`], dur, '', `${begin}s`)}
  <g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="14" ry="6" fill="#d9ece8"/><ellipse cx="-8" cy="2" rx="9" ry="5" fill="#d9ece8"/><ellipse cx="7" cy="-3" rx="8" ry="6" fill="#eef7f4"/></g></g>`;
const bird = (y, dur, begin) => `<path d="M0 0 q3 -3 6 0 q3 -3 6 0" stroke="#0f3a39" stroke-width="1.2" fill="none" stroke-linecap="round">
  ${D(['M0 0 q3 -3 6 0 q3 -3 6 0', 'M0 0 q3 2 6 0 q3 2 6 0', 'M0 0 q3 -3 6 0 q3 -3 6 0'], .5)}${TR([`-20 ${y}`, `260 ${y - 14}`], dur, '', `${begin}s`)}</path>`;
const wall = (fill = '#16504d') => `<rect width="240" height="140" fill="${fill}"/>`;
const starBand = (id, y) => `<defs><pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse">
  <path d="M7 1 l1.6 3.8 3.8 1.6 -3.8 1.6 -1.6 3.8 -1.6 -3.8 -3.8 -1.6 3.8 -1.6z" fill="none" stroke="#e0b75a" stroke-width=".7"/></pattern></defs>
  <rect y="${y}" width="240" height="14" fill="url(#${id})" opacity=".22"/>
  <path d="M0 ${y} H240 M0 ${y + 14} H240" stroke="#e0b75a" stroke-width=".6" opacity=".35"/>`;
const archWindow = (x, y, w, h, sky, extra = '') => `<path d="M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h}Z" fill="${sky}"/>
  ${extra}
  <path d="M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h}Z M${x + w / 2} ${y} V${y + h} M${x} ${y + h * .62} H${x + w}" fill="none" stroke="#0f3a39" stroke-width="2.4"/>
  <rect x="${x - 3}" y="${y + h}" width="${w + 6}" height="3" rx="1" fill="#0f3a39"/>`;
const wrap = inner => `<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

// ---------- scenes ----------
const SCENES = [
  { id: 'pingpong', when: 'any', svg: () => wrap(`
    ${wall()}${starBand('ppBand', 18)}
    ${archWindow(176, 40, 34, 52, '#2b7f78', '<circle cx="200" cy="58" r="6" fill="#f2cd6b" opacity=".8"/>')}
    <g><rect x="16" y="40" width="44" height="26" rx="3" fill="#0f3a39"/>
      <rect x="20" y="44" width="16" height="18" rx="2" fill="#164b49"/><rect x="40" y="44" width="16" height="18" rx="2" fill="#164b49"/>
      <text x="28" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#e0b75a">7</text>
      <text x="48" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#e0b75a">6</text>
      <path d="M36 44 V62" stroke="#0f3a39" stroke-width="1"/></g>
    <rect y="112" width="240" height="28" fill="#0f3a39"/>
    <path d="M0 122 H240 M0 132 H240 M30 112 V122 M90 122 V132 M150 112 V122 M210 122 V132 M60 132 V140 M180 132 V140" stroke="#164b49" stroke-width=".8"/>
    <ellipse cx="120" cy="125" rx="74" ry="4" fill="#0a2a29" opacity=".7"/>
    <rect x="58" y="100" width="3" height="24" fill="#0a2a29"/><rect x="179" y="100" width="3" height="24" fill="#0a2a29"/>
    <rect x="76" y="100" width="2" height="18" fill="#0a2a29"/><rect x="162" y="100" width="2" height="18" fill="#0a2a29"/>
    <path d="M58 90 L182 90 L192 100 L48 100Z" fill="#2a8a6a"/>
    <path d="M48 100 L192 100 L192 103.5 L48 103.5Z" fill="#1f6e55"/>
    <path d="M58 90 L182 90 L192 100 L48 100Z M120 90 V100" fill="none" stroke="#f3ead2" stroke-width=".9"/>
    <path d="M114 101 L126 89 L126 81 L114 93Z" fill="#f3ead2" opacity=".28"/>
    <path d="M114 93 L126 81" stroke="#f3ead2" stroke-width="1.4"/>
    <path d="M117 98 L117 90 M120 95 L120 87 M123 92 L123 84 M114 97 L126 85" stroke="#f3ead2" stroke-width=".4" opacity=".6"/>
    <rect x="18" y="114" width="5" height="10" rx="1.5" fill="#2d5f9a"/><rect x="18.5" y="112" width="4" height="2.5" rx="1" fill="#f3ead2"/>
    <circle cx="214" cy="122" r="2.6" fill="#f3ead2"/>
    ${T({ x: 0, y: 56, anim: bob(-1.5, .9), front: tArm('M88 70 q12 -2 18 -10',
      '<ellipse cx="110" cy="56" rx="8" ry="9" fill="#c8452c" stroke="#8e2a1a" stroke-width="1.5"/><rect x="103" y="62" width="4" height="10" rx="2" fill="#6a3b1f" transform="rotate(35 105 67)"/>',
      R(88, 70, [-28, 0, 0, 22, -28], 1.8, '0;.15;.7;.9;1')), back: tArm('M31 76 q-7 5 -8 12') })}
    ${M({ x: 164, y: 54, flip: true, anim: bob(-1.5, .9, '.45s'), back: mArm('M45 82 q-8 3 -10 11'),
      front: mArm('M75 80 q10 -6 14 -14', '<ellipse cx="92" cy="62" rx="7" ry="8" fill="#2d5f9a" stroke="#1d3f6a" stroke-width="1.5"/><rect x="86" y="67" width="3.6" height="9" rx="1.8" fill="#6a3b1f" transform="rotate(30 88 71)"/>',
      R(75, 80, [0, 0, 24, -26, 0], 1.8, '0;.3;.42;.5;.65')) })}
    <circle r="2.7" fill="#fff"><animateMotion path="M66 86 Q96 50 152 96 Q166 80 178 86 Q146 48 88 96 Q76 80 66 86" dur="1.8s" repeatCount="indefinite"/></circle>`) },

  { id: 'chai', when: 'any', svg: () => wrap(`
    ${wall()}${starBand('chBand', 14)}
    ${archWindow(103, 34, 34, 44, '#e8a14a', '<rect x="103" y="62" width="34" height="16" fill="#c8452c" opacity=".55"/><circle cx="120" cy="66" r="7" fill="#f6e27a"/>')}
    ${lantern(56, 22, 22)}${lantern(184, 20, 20)}
    <rect x="6" y="78" width="228" height="26" rx="8" fill="#7a1f1f"/>
    <path d="M10 84 H230 M10 98 H230" stroke="#e0b75a" stroke-width="1" opacity=".7"/>
    <path d="M14 91 ${'h6 l3 -3 3 3 '.repeat(18)}" stroke="#e0b75a" stroke-width=".8" fill="none" opacity=".6"/>
    <g fill="#2a8a6a"><rect x="8" y="94" width="18" height="12" rx="6"/><rect x="214" y="94" width="18" height="12" rx="6"/></g>
    <path d="M12 96 v8 M17 95 v10 M22 96 v8 M218 96 v8 M223 95 v10 M228 96 v8" stroke="#e0b75a" stroke-width=".8"/>
    <rect x="4" y="102" width="232" height="10" rx="4" fill="#5e1717"/>
    <rect y="112" width="240" height="28" fill="#1d3557"/>
    <rect x="8" y="114" width="224" height="24" rx="2" fill="none" stroke="#e0b75a" stroke-width="1.2"/>
    <path d="M12 118 ${'l5 0 l2.5 -2.5 2.5 2.5 '.repeat(22)}" stroke="#c8452c" stroke-width=".9" fill="none"/>
    <ellipse cx="120" cy="128" rx="24" ry="6" fill="none" stroke="#e0b75a" stroke-width=".9" opacity=".7"/>
    <path d="M104 132 L112 122 M136 132 L128 122" stroke="#8a5a33" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="120" cy="121" rx="25" ry="5.5" fill="#d6a843"/><ellipse cx="120" cy="120" rx="21" ry="4" fill="#e8c46a"/>
    <g><path d="M134 108 q9 -1 12 -9" stroke="#d6a843" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M113 104 q-6 4 0 9" stroke="#b8902e" stroke-width="2" fill="none"/>
      <path d="M114 118 q-2 -11 6 -14 q8 3 6 14z" fill="#d6a843"/><path d="M116 104 q4 -6 8 0z" fill="#e8c46a"/>
      <circle cx="120" cy="100" r="1.8" fill="#e8c46a"/><path d="M114 112 h12" stroke="#b8902e" stroke-width=".8"/></g>
    ${steam(146, 97, 0)}${steam(148, 97, 1.5)}
    ${teaGlass(102, 108)}${teaGlass(138, 108)}
    <g fill="#f6eedd"><rect x="128" y="115" width="2.6" height="2.6" rx=".4"/><rect x="131" y="116" width="2.6" height="2.6" rx=".4"/></g>
    ${T({ x: 24, y: 41, sit: true, back: tArm('M31 80 q-6 4 -6 10'),
      face: [{ f: 'dots', o: '1;1;0;0;1;1', k: '0;.47;.5;.78;.81;1', dur: 5 }, { f: 'closed', o: '0;0;1;1;0;0', k: '0;.47;.5;.78;.81;1', dur: 5 }],
      front: `<path d="M88 78 q10 2 14 -6" stroke="#7a3218" stroke-width="7" fill="none" stroke-linecap="round">${D(['M88 78 q10 2 14 -6', 'M88 78 q10 2 14 -6', 'M88 77 q-4 -8 -14 -10', 'M88 77 q-4 -8 -14 -10', 'M88 78 q10 2 14 -6', 'M88 78 q10 2 14 -6'], 5, '0;.45;.55;.75;.85;1')}</path>
        <g>${TR(['0 0', '0 0', '-26 -4', '-26 -4', '0 0', '0 0'], 5, '0;.45;.55;.75;.85;1')}${teaGlass(102, 60)}</g>` })}
    ${M({ x: 154, y: 38, flip: true, back: mArm('M45 82 q-8 3 -10 11'),
      front: mArm('M75 80 q9 2 13 -8', teaGlass(90, 62), R(75, 80, [0, -6, 0, 4, 0], 3.2)) })}
    ${steam(141, 62, .8)}`) },

  { id: 'quran', when: 'any', svg: () => wrap(`
    ${wall('#14494a')}
    <g><rect x="10" y="26" width="56" height="74" rx="2" fill="#5a3a22"/><rect x="13" y="29" width="50" height="68" fill="#3f2816"/>
      <path d="M13 52 H63 M13 75 H63" stroke="#5a3a22" stroke-width="3"/>
      <g><rect x="15" y="34" width="5" height="17" fill="#2a8a6a"/><rect x="21" y="36" width="4" height="15" fill="#c8452c"/><rect x="26" y="33" width="6" height="18" fill="#e0b75a"/><rect x="33" y="37" width="4" height="14" fill="#2d5f9a"/><rect x="38" y="35" width="5" height="16" fill="#f6eedd"/><path d="M45 51 l8 -14 3 1.5 -8 14z" fill="#8e3a20"/>
      <rect x="15" y="60" width="7" height="14" fill="#c8452c"/><rect x="23" y="58" width="5" height="16" fill="#2a8a6a"/><rect x="29" y="61" width="5" height="13" fill="#e0b75a"/>
      <path d="M44 74 q0 -8 7 -8 q7 0 7 8z" fill="#c8452c"/><path d="M51 66 q-4 -6 0 -10 q4 4 0 10" fill="#3fa86e"/>
      <rect x="15" y="82" width="20" height="13" fill="#2d5f9a"/><rect x="37" y="84" width="6" height="11" fill="#f6eedd"/><rect x="45" y="81" width="5" height="14" fill="#2a8a6a"/></g></g>
    ${archWindow(186, 30, 34, 50, '#0a2230', `<path d="M205 44 a7 7 0 1 0 6 11 a5.5 5.5 0 1 1 -6 -11z" fill="#f3e6b0"/>${twinkle(194, 60, .8, 2.2, 0)}${twinkle(212, 66, .7, 3, 1)}`)}
    ${lantern(120, 16, 16)}
    <rect y="114" width="240" height="26" fill="#0f3a39"/>
    <path d="M20 140 V124 Q20 114 32 114 H208 Q220 114 220 124 V140Z" fill="#2a8a6a"/>
    <path d="M26 140 V126 Q26 119 34 119 H206 Q214 119 214 126 V140" fill="none" stroke="#e0b75a" stroke-width="1"/>
    <path d="M104 140 V130 Q120 118 136 130 V140" fill="none" stroke="#e0b75a" stroke-width="1"/>
    <g><path d="M206 116 h10 l-1.5 8 h-7z" fill="#a07c35"/><path d="M205 116 h12" stroke="#c99a3b" stroke-width="1.6"/>
      ${steam(209, 112, 0)}${steam(212, 112, 1.4)}</g>
    <path d="M108 124 L132 94 M132 124 L108 94" stroke="#8a5a33" stroke-width="4" stroke-linecap="round"/>
    <path d="M100 95 Q120 88 120 97 Q120 88 140 95 L140 103 Q120 95 120 104 Q120 95 100 103Z" fill="#fbf5e6" stroke="#1f6e55" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M104 96 q7 -2 13 0 M104 99 q7 -2 13 0 M123 96 q7 -2 13 0 M123 99 q7 -2 13 0" stroke="#3a1d12" stroke-width=".5" opacity=".6"/>
    <g transform="translate(120 0)"><path d="M0 97 Q8 89 19 95 L19 102 Q8 96 0 104Z" fill="#fbf5e6" stroke="#d9ccb0" stroke-width=".5" opacity="0">
      <animateTransform attributeName="transform" type="scale" values="1 1;1 1;-1 1;-1 1" keyTimes="0;.82;.92;1" dur="7s" repeatCount="indefinite"/>${OP('0;0;1;1;0', 7, '0;.81;.82;.92;.93')}</path></g>
    ${T({ x: 28, y: 46, sit: true, face: 'closed', anim: R(60, 110, [-2, 2, -2], 3.6), back: tArm('M33 84 q4 8 14 8'), front: tArm('M88 80 q8 0 12 4') })}
    ${M({ x: 150, y: 44, flip: true, face: 'closed', anim: R(60, 112, [2, -2, 2], 3.6, '', '1s'), back: mArm('M45 84 q4 6 12 6'),
      front: mArm('M75 82 q8 0 10 6', `<g>${R(85, 88, [-8, 8, -8], 2.4)}<path d="M85 88 q-3 10 0 18 q3 -8 0 -18" fill="none" stroke="#3a1d12" stroke-width=".6"/>
        <g fill="#2a8a6a">${[90, 93, 96, 99, 102, 105].map((yy, i) => `<circle cx="${85 + (i % 2 ? 1.2 : -1.2)}" cy="${yy}" r="1.3"/>`).join('')}</g><circle cx="85" cy="108" r="1.8" fill="#e0b75a"/></g>`) })}`) },

  { id: 'carrom', when: 'any', svg: () => wrap(`
    ${wall()}${starBand('caBand', 22)}
    ${archWindow(26, 42, 30, 44, '#2b7f78', '<circle cx="48" cy="56" r="5" fill="#f2cd6b" opacity=".8"/>')}
    <g><rect x="190" y="74" width="30" height="4" rx="1" fill="#8a5a33"/><rect x="194" y="78" width="3" height="34" fill="#6a3b1f"/><rect x="213" y="78" width="3" height="34" fill="#6a3b1f"/>
      <path d="M198 74 q0 -14 7 -16 q7 2 7 16z" fill="#2a8a6a"/><path d="M205 58 q-6 -8 -2 -14 M205 58 q5 -9 2 -15 M205 58 q-1 -10 0 -16" stroke="#3fa86e" stroke-width="2" fill="none" stroke-linecap="round"/></g>
    <rect y="112" width="240" height="28" fill="#0f3a39"/>
    <rect x="14" y="116" width="212" height="22" rx="3" fill="#7a2a2a"/><rect x="18" y="119" width="204" height="16" rx="2" fill="none" stroke="#e0b75a" stroke-width=".8"/>
    <ellipse cx="120" cy="124" rx="62" ry="5" fill="#0a2a29" opacity=".55"/>
    <path d="M66 96 L174 96 L190 122 L50 122Z" fill="#6a3b1f"/>
    <path d="M72 99 L168 99 L182 119.5 L58 119.5Z" fill="#e6c58e"/>
    <g fill="#1a1a1a"><circle cx="75" cy="101" r="2.6"/><circle cx="165" cy="101" r="2.6"/><circle cx="179" cy="117" r="3"/><circle cx="61" cy="117" r="3"/></g>
    <path d="M82 116 H158 M86 102 H154" stroke="#9a2a2a" stroke-width=".7"/>
    <ellipse cx="120" cy="109" rx="13" ry="5" fill="none" stroke="#9a2a2a" stroke-width=".8"/>
    <g><ellipse cx="116" cy="108" rx="2.6" ry="1.5" fill="#3a1d12"/><ellipse cx="124" cy="110.5" rx="2.6" ry="1.5" fill="#f6eedd"/><ellipse cx="114" cy="111" rx="2.6" ry="1.5" fill="#f6eedd"/><ellipse cx="126" cy="107" rx="2.6" ry="1.5" fill="#3a1d12"/><ellipse cx="120" cy="109" rx="2.4" ry="1.4" fill="#c8452c"/></g>
    <ellipse cx="0" cy="0" rx="2.6" ry="1.5" fill="#f6eedd">${TR(['121 106', '121 106', '163 101.5', '163 101.5', '121 106'], 4, '0;.32;.46;.9;1')}<animateTransform attributeName="transform" type="scale" additive="sum" values="1;1;1;.2;.2;1" keyTimes="0;.32;.44;.48;.9;1" dur="4s" repeatCount="indefinite"/>${OP('1;1;1;0;0;1', 4, '0;.32;.45;.48;.95;1')}</ellipse>
    <ellipse cx="0" cy="0" rx="2.6" ry="1.5" fill="#3a1d12">${TR(['112 106.5', '112 106.5', '96 104', '96 104', '112 106.5'], 4, '0;.32;.44;.9;1')}</ellipse>
    <ellipse cx="0" cy="0" rx="3.6" ry="2.1" fill="#2d5f9a" stroke="#1d3f6a" stroke-width=".6">${TR(['152 115', '152 115', '124 109', '133 112', '133 112', '152 115'], 4, '0;.2;.32;.45;.9;1')}</ellipse>
    ${T({ x: 6, y: 41, sit: true, back: tArm('M31 80 q-6 4 -6 10'),
      face: [{ f: 'dots', o: '1;1;0;0;1', k: '0;.46;.5;.8;1', dur: 4 }, { f: 'happy', o: '0;0;1;1;0', k: '0;.46;.5;.8;1', dur: 4 }],
      front: `<path d="M88 76 q10 6 14 14" stroke="#7a3218" stroke-width="7" fill="none" stroke-linecap="round">${D(['M88 76 q10 6 14 14', 'M88 76 q10 6 14 14', 'M88 72 q10 -6 12 -18', 'M88 72 q10 -6 12 -18', 'M88 76 q10 6 14 14'], 4, '0;.46;.52;.78;.86')}</path>` })}
    ${M({ x: 160, y: 38, flip: true, face: 'dots', back: mArm('M45 82 q-8 3 -10 11'),
      front: mArm('M75 82 q8 4 12 12', '', R(75, 82, [0, 0, -14, 10, 0, 0], 4, '0;.12;.18;.22;.3;1')) })}`) },

  { id: 'football', when: 'day', svg: () => wrap(`
    <rect width="240" height="140" fill="#2b7f78"/><rect y="70" width="240" height="30" fill="#3a8f86"/>
    <g>${R(30, 26, [0, 360], 40)}<g fill="#f6e27a" opacity=".5"><path d="M30 8 v6 M30 38 v6 M12 26 h6 M42 26 h6 M17 13 l4 4 M39 35 l4 4 M43 13 l-4 4 M21 35 l-4 4" stroke="#f6e27a" stroke-width="2" stroke-linecap="round"/></g></g>
    <circle cx="30" cy="26" r="9" fill="#f6e27a"/>
    ${cloud(60, 22, 1, 38, -10)}${cloud(150, 34, .7, 30, -22)}
    <path d="M0 88 Q30 76 60 86 T120 84 T180 82 T240 86 V100 H0Z" fill="#1f6a64"/>
    <g fill="#1a5a55"><rect x="146" y="58" width="5" height="30"/><path d="M144 58 h9 l-1 -4 h-7z"/><path d="M146 54 q2.5 -8 5 0z"/><circle cx="148.5" cy="45" r="1.2" fill="#e0b75a"/>
      <path d="M100 84 q8 -14 16 0z M164 84 q10 -16 20 0z"/></g>
    <rect y="100" width="240" height="40" fill="#2f8a54"/>
    <path d="M0 100 H40 L30 140 H0Z M80 100 H120 L116 140 H76Z M160 100 H200 L204 140 H164Z" fill="#34955b"/>
    <path d="M0 112 Q120 104 240 112" stroke="#f3ead2" stroke-width="1" fill="none" opacity=".5"/>
    <path d="M14 132 v-8 M14 124 l8 3 -8 3" stroke="#f3ead2" stroke-width="1" fill="#e0b75a">${D(['M14 132 v-8 M14 124 l8 3 -8 3', 'M14 132 v-8 M14 124 l8 1 -8 5', 'M14 132 v-8 M14 124 l8 3 -8 3'], 1.2)}</path>
    <g><path d="M190 120 L190 74 L236 74 L236 120" stroke="#f3ead2" stroke-width="3" fill="none"/>
      <path d="M194 74 L198 116 M202 74 L206 116 M210 74 L214 116 M218 74 L222 116 M226 74 L230 116 M190 86 L234 86 M191 98 L234 98 M192 110 L235 110" stroke="#f3ead2" stroke-width=".6" opacity=".45">
        ${TR(['0 0', '0 0', '3 0', '0 0', '0 0'], 3, '0;.58;.64;.75;1')}</path></g>
    ${M({ x: 172, y: 50, flip: true, back: mArm('M45 74 q-10 -6 -12 -18'), front: mArm('M75 74 q10 -6 12 -18'),
      anim: `${R(60, 116, [0, 0, -55, -55, 0, 0], 3, '0;.42;.56;.75;.9;1')}${TR(['0 0', '0 0', '0 -8', '0 4', '0 4', '0 0'], 3, '0;.42;.5;.56;.75;1').replace('<animateTransform', '<animateTransform additive="sum"')}` })}
    <g>${TR(['0 0', '0 0', '0 0', '0 0'], 3)}
    ${T({ x: 22, y: 56, anim: R(60, 112, [0, -6, 8, 0, 0, 0], 3, '0;.24;.32;.4;.9;1'),
      face: [{ f: 'dots', o: '1;1;0;0;1', k: '0;.6;.63;.92;1', dur: 3 }, { f: 'happy', o: '0;0;1;1;0', k: '0;.6;.63;.92;1', dur: 3 }],
      back: `<path d="M31 76 q-8 -4 -10 -14" stroke="#7a3218" stroke-width="7" fill="none" stroke-linecap="round">${D(['M31 76 q-8 4 -10 12', 'M31 76 q-8 4 -10 12', 'M31 70 q-10 -6 -11 -18', 'M31 70 q-10 -6 -11 -18', 'M31 76 q-8 4 -10 12'], 3, '0;.6;.64;.9;1')}</path>`,
      front: `<path d="M88 72 q8 4 10 12" stroke="#7a3218" stroke-width="7" fill="none" stroke-linecap="round">${D(['M88 72 q8 4 10 12', 'M88 72 q8 4 10 12', 'M89 68 q10 -6 11 -18', 'M89 68 q10 -6 11 -18', 'M88 72 q8 4 10 12'], 3, '0;.6;.64;.9;1')}</path>` })}</g>
    <g opacity="0">${OP('0;0;.7;0;0', 3, '0;.3;.33;.42;1')}<circle cx="74" cy="122" r="3" fill="#d9ece8"/><circle cx="70" cy="120" r="2" fill="#d9ece8"/><circle cx="78" cy="119" r="2" fill="#d9ece8"/></g>
    <g>${OP('1;1;1;0;0;1', 3, '0;.3;.85;.88;.97;1')}
      <g><animateMotion path="M78 121 Q150 50 214 98" keyPoints="0;0;1;1" keyTimes="0;.32;.6;1" calcMode="linear" dur="3s" repeatCount="indefinite"/>
        <g>${R(0, 0, [0, 360], .5)}<circle r="5.5" fill="#fff" stroke="#1a1a1a" stroke-width=".6"/><path d="M-1.6 -2 l2.4 -.6 1.4 1.8 -1 2.2 -2.4 0z" fill="#1a1a1a"/></g></g></g>`) },

  { id: 'kite', when: 'day', svg: () => wrap(`
    <rect width="240" height="140" fill="#1d6b66"/><rect y="56" width="240" height="40" fill="#2b7f78"/>
    <ellipse cx="200" cy="90" rx="90" ry="22" fill="#e0b75a" opacity=".22"/><circle cx="206" cy="84" r="10" fill="#f6c76a"/>
    ${cloud(40, 20, .9, 46, -6)}${cloud(120, 40, .6, 36, -24)}${bird(30, 14, 0)}${bird(40, 14, -.4)}${bird(26, 18, -7)}
    <path d="M0 96 Q50 74 110 90 T240 84 V112 H0Z" fill="#165a55"/>
    <path d="M0 106 Q70 88 140 102 T240 98 V140 H0Z" fill="#2f7a4e"/>
    <path d="M14 128 l2 -6 2 6 M60 134 l2 -6 2 6 M172 130 l2 -6 2 6 M214 136 l2 -6 2 6 M120 138 l2 -5 2 5" stroke="#3b8c5c" stroke-width="1.2" fill="none"/>
    <path stroke="#f3ead2" stroke-width=".9" fill="none" opacity=".8" d="M82 90 Q128 82 170 46">${D(['M82 90 Q128 82 170 46', 'M82 90 Q132 78 186 38', 'M82 90 Q136 84 196 50', 'M82 90 Q130 86 180 60', 'M82 90 Q122 84 164 54', 'M82 90 Q128 82 170 46'], 6)}</path>
    <g>${TR(['170 28', '186 20', '196 32', '180 42', '164 36', '170 28'], 6)}
      <g>${R(0, 9, [-10, 12, -10], 3)}
        <path d="M0 -9 L-10 5 L0 18Z" fill="#e0b75a"/><path d="M0 -9 L10 5 L0 18Z" fill="#c8452c"/><path d="M-10 5 L0 5 L0 18Z" fill="#2a8a6a" opacity=".9"/><path d="M10 5 L0 5 L0 -9Z" fill="#f6eedd" opacity=".9"/>
        <path d="M0 -9 V18 M-10 5 H10" stroke="#6a3b1f" stroke-width=".8"/>
        <path d="M0 18 q-5 8 0 15 q5 7 0 14" stroke="#f3ead2" stroke-width="1" fill="none">${D(['M0 18 q-5 8 0 15 q5 7 0 14', 'M0 18 q5 8 0 15 q-5 7 0 14', 'M0 18 q-5 8 0 15 q5 7 0 14'], 1)}</path>
        <path d="M-3 25 l6 1.5 M-3 37 l6 -1.5" stroke="#c8452c" stroke-width="3" stroke-linecap="round"/></g></g>
    ${T({ x: 20, y: 60, face: 'up', back: tArm('M31 76 q-7 5 -8 12'), front: tArm('M88 70 q10 -4 14 -10', '', R(88, 70, [0, -10, 0], 2)) })}
    ${M({ x: 100, y: 58, face: 'happy', anim: TR(['0 0', '0 -10', '0 0', '0 0'], 1.2, '0;.25;.5;1'),
      back: mArm('M45 74 q-10 -6 -12 -18', '', R(45, 74, [0, 14, 0], .6)), front: mArm('M75 74 q10 -6 12 -18', '', R(75, 74, [0, -14, 0], .6)) })}`) },

  { id: 'stars', when: 'night', svg: () => wrap(`
    <rect width="240" height="140" fill="#0a2230"/>
    <ellipse cx="120" cy="30" rx="140" ry="14" fill="#f3ead2" opacity=".04" transform="rotate(-12 120 30)"/>
    ${[[14, 14, 1.1, 2.4, 0], [40, 30, .8, 3.1, .5], [66, 10, 1.3, 2.7, 1], [92, 24, .9, 3.5, .2], [118, 8, 1, 2.2, 1.4], [138, 22, .8, 3.3, .7], [160, 12, 1.2, 2.9, .1], [172, 36, .8, 2.5, 1.1], [26, 50, .9, 3.8, .9], [104, 44, .7, 2.6, 1.6], [150, 48, .8, 3.4, .3], [222, 50, 1, 2.8, .6], [58, 40, .7, 3, 1.8]].map(a => twinkle(...a)).join('')}
    <circle cx="206" cy="24" r="20" fill="#f3e6b0" opacity=".08"/>
    <path d="M206 12 a12 12 0 1 0 10 19 a9.5 9.5 0 1 1 -10 -19z" fill="#f3e6b0"/>
    <g opacity="0">${OP('0;0;1;0;0', 8, '0;.6;.63;.7;1')}${TR(['20 10', '20 10', '110 46', '110 46'], 8, '0;.6;.7;1')}
      <path d="M0 0 l-18 -7" stroke="#f3ead2" stroke-width="1.4" stroke-linecap="round"/><circle cx="0" cy="0" r="1.4" fill="#fff"/></g>
    <g fill="#0c2a35"><rect x="0" y="70" width="26" height="40"/><rect x="28" y="60" width="20" height="50"/><rect x="52" y="76" width="30" height="34"/>
      <rect x="150" y="66" width="22" height="44"/><rect x="176" y="56" width="18" height="54"/><rect x="198" y="72" width="42" height="38"/>
      <rect x="120" y="58" width="6" height="52"/><path d="M118 58 h10 l-2 -4 h-6z"/><path d="M120 54 q3 -9 6 0z"/><path d="M90 110 V86 q14 -16 28 0 V110z"/></g>
    <path d="M123 44 a2.4 2.4 0 1 0 2 3.6 a1.9 1.9 0 1 1 -2 -3.6z" fill="#e0b75a"/>
    ${[[6, 78, 1.8], [14, 92, 3.1], [34, 68, 2.6], [40, 86, 4.2], [58, 84, 2.2], [70, 96, 3.6], [156, 74, 2.9], [164, 90, 1.9], [182, 64, 3.3], [204, 80, 2.4], [222, 92, 4], [230, 78, 2.7]].map(([x, y, d]) => `<rect x="${x}" y="${y}" width="3" height="3.6" fill="#e0b75a">${OP('.9;.9;.15;.9', d, '0;.6;.7;1')}</rect>`).join('')}
    <rect y="108" width="240" height="32" fill="#12403e"/><rect y="104" width="240" height="6" fill="#1a5250"/>
    <path d="M0 96 Q60 108 120 96 T240 96" stroke="#0a2a29" stroke-width=".8" fill="none"/>
    ${[12, 36, 60, 84, 108, 132, 156, 180, 204, 228].map((x, i) => { const y = 96 + 6 * Math.sin(Math.PI * ((x % 120) / 120)); return `<circle cx="${x}" cy="${y + 2}" r="2" fill="${['#f6e27a', '#ff8a73', '#8fd0f0'][i % 3]}">${OP('1;.45;1', 1.6 + (i % 3) * .5, '', `${i * .2}s`)}</circle>`; }).join('')}
    <rect x="44" y="110" width="120" height="14" rx="2" fill="#7a2a2a"/><path d="M48 113 H160 M48 121 H160" stroke="#e0b75a" stroke-width=".7"/>
    ${T({ x: 50, y: 44, sit: true, face: 'up', back: tArm('M31 78 q-6 4 -6 10'), front: tArm('M88 70 q10 -8 12 -20', '', R(88, 70, [0, -8, 4, 0], 2.4)) })}
    ${M({ x: 106, y: 42, face: 'up', back: mArm('M45 84 q4 6 12 6'), front: mArm('M75 84 q-4 6 -12 6', `<path d="M58 84 h8 v8 q0 3 -4 3 q-4 0 -4 -3z" fill="#2a8a6a"/><path d="M66 86 q3 0 3 3 q0 3 -3 3" fill="none" stroke="#2a8a6a" stroke-width="1.4"/>`) })}
    ${steam(170, 92, 0)}`) },

  { id: 'palm', when: 'night', svg: () => wrap(`
    <rect width="240" height="140" fill="#0a2230"/>
    ${[[20, 16, 1, 2.6, 0], [60, 30, .8, 3.2, .4], [110, 12, 1.1, 2.4, 1.2], [150, 26, .8, 3, .6], [176, 10, 1, 2.8, 1.5], [230, 34, .9, 3.4, .2], [96, 40, .7, 2.9, .9]].map(a => twinkle(...a)).join('')}
    <circle cx="200" cy="24" r="16" fill="#f3e6b0" opacity=".08"/><path d="M200 14 a10 10 0 1 0 8 16 a8 8 0 1 1 -8 -16z" fill="#f3e6b0"/>
    <path d="M0 92 Q50 70 110 88 T240 80 V140 H0Z" fill="#13394a"/>
    <path d="M0 108 Q80 86 150 104 T240 98 V140 H0Z" fill="#0f2f3d"/>
    <ellipse cx="186" cy="120" rx="40" ry="8" fill="#12405a"/>
    <ellipse cx="190" cy="120" rx="6" ry="2" fill="#f3e6b0" opacity=".5"><animate attributeName="rx" values="6;9;6" dur="3s" repeatCount="indefinite"/>${OP('.5;.25;.5', 3)}</ellipse>
    <path d="M166 120 q4 -3 8 0 M200 124 q4 -3 8 0" stroke="#3d7d9a" stroke-width=".7" fill="none"/>
    <path d="M56 126 Q50 90 62 46" stroke="#7a5426" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M52 112 h9 M51 100 h9 M52 88 h9 M54 76 h9 M57 64 h8 M60 54 h6" stroke="#5a3a1c" stroke-width="1.4" stroke-linecap="round"/>
    <g>${R(62, 46, [-3, 3, -3], 5)}
      <path d="M62 46 q-26 -12 -46 6 M62 46 q-22 -24 -44 -20 M62 46 q14 -28 42 -24 M62 46 q28 -8 44 12 M62 46 q4 -22 -4 -34 M62 46 q-14 4 -24 22 M62 46 q16 4 26 20" stroke="#2f8f5b" stroke-width="5.5" fill="none" stroke-linecap="round"/>
      <path d="M62 46 q-26 -12 -46 6 M62 46 q14 -28 42 -24 M62 46 q28 -8 44 12" stroke="#3fa86e" stroke-width="2" fill="none" stroke-linecap="round"/>
      <g fill="#9b4523"><circle cx="58" cy="52" r="3"/><circle cx="64" cy="54" r="3"/><circle cx="60" cy="57" r="3"/><circle cx="66" cy="50" r="2.6"/><circle cx="55" cy="56" r="2.6"/></g></g>
    <ellipse cx="88" cy="124" rx="30" ry="6" fill="#7a2a2a"/>
    ${T({ x: 58, y: 54, sit: true, face: 'sleep', breathe: true, anim: '', back: tArm('M33 84 q4 8 14 8'), front: tArm('M87 84 q-4 8 -14 8') })}
    ${[0, 1.3].map(b => `<text x="104" y="62" font-family="system-ui, sans-serif" font-size="${b ? 8 : 11}" font-weight="800" fill="#a9c6c1" opacity="0">z
      ${OP('0;1;0', 2.6, '', `${b}s`)}${TR(['0 0', '8 -16'], 2.6, '', `${b}s`)}</text>`).join('')}
    ${M({ x: 128, y: 48, flip: true, face: 'closed', back: mArm('M45 82 q-8 3 -10 11'),
      front: mArm('M75 78 q12 -10 16 -24', '<path d="M91 56 q14 -22 4 -36 q-14 14 -4 36z" fill="#3fa86e"/><path d="M91 56 L95 22" stroke="#2f8f5b" stroke-width="1"/>', R(75, 78, [-12, 12, -12], 1.2)) })}
    ${[[30, 100, 7], [130, 92, 9], [210, 96, 8], [160, 70, 10]].map(([x, y, d], i) => `<circle r="1.4" fill="#f6e27a">${OP('0;1;.2;1;0', d / 2)}
      <animateMotion path="M${x} ${y} q10 -10 20 0 t20 0 q-10 10 -20 0 t-20 0" dur="${d}s" begin="${-i * 2}s" repeatCount="indefinite"/></circle>`).join('')}`) },
];

export function pickScene(night, lastId) {
  const pool = SCENES.filter(s => (s.when === 'any' || (s.when === 'night') === night) && s.id !== lastId);
  return pool[Math.floor(Math.random() * pool.length)];
}
