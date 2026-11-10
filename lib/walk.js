// Tamr & Miswak's walk. A real step cycle: each foot stays planted while it's on the ground (no skating),
// the body dips when a foot lands and rises as the other passes, arms swing, the kufi / bristles lag a beat.
// Plain script (not a module) so the content script and the new tab can both load it. Exposes globalThis.TamrWalk.
(() => {
  // Gaits, in drawing units (the characters are drawn in a 120×125 box).
  const GAITS = {
    stroll: { v: 95, D: 40, lift: 6, bob: 2.6, hop: 0, squash: .035, lean: 3, swing: 12, lag: 4, ta: .55, td: .7 },
    hurry: { v: 175, D: 48, lift: 8, bob: 3, hop: 0, squash: .05, lean: 8, swing: 20, lag: 7, ta: .35, td: .45 },
    bouncy: { v: 120, D: 44, lift: 4, bob: 1.2, hop: 7, squash: .08, lean: 2, swing: 16, lag: 8, ta: .5, td: .6 },
  };
  // Pivot points per character: where arms join, where the top (kufi / bristles) hinges, where the feet stand.
  const RIGS = {
    tamr: { armL: [33, 78], armR: [87, 78], top: [60, 40], feet: [60, 108], ground: 118 },
    miswak: { armL: [45, 82], armR: [75, 82], top: [60, 42], feet: [60, 110], ground: 118 },
  };
  const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  const r2 = v => Math.round(v * 100) / 100;
  const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Speed profile over the walk: optionally ease in from a standstill, optionally ease out to a stop.
  function plan(Lu, G, easeIn, easeOut) {
    let ta = easeIn ? G.ta : 0, td = easeOut ? G.td : 0;
    const need = G.v * (ta + td) / 2;
    if (need > Lu) { const f = Lu / need; ta *= f; td *= f; } // short walk: compress the easing
    const dt = 1 / 240, pts = [];
    let t = 0, d = 0;
    const step = v => { d += v * dt; t += dt; pts.push([d, v]); };
    while (t < ta) step(G.v * sm(t / ta));
    const dd = G.v * td / 2;
    while (d < Lu - dd) step(G.v);
    const t0 = t;
    while (t - t0 < td && d < Lu) step(G.v * (1 - sm((t - t0) / td)));
    pts.push([Lu, 0]);
    return { pts, T: pts.length * dt, dt };
  }

  function pose(svg, rig, G, dist, vel, dir) {
    const q = c => svg.querySelector('.w-' + c);
    const k = vel / G.v, b = Math.min(1, k * 1.8), s = G.D / 4, ph = (dist / G.D) % 1;
    const leg = p => { p %= 1; if (p < .5) return [s - 4 * s * p, 0]; const u = (p - .5) * 2; return [-s + 2 * s * sm(u), -G.lift * Math.sin(Math.PI * u)]; };
    const [lx, ly] = leg(ph), [rx, ry] = leg(ph + .5);
    const c2 = Math.cos(2 * Math.PI * ph) ** 2, s2 = 1 - c2;
    const bob = -G.bob * b * s2, hop = -G.hop * b * s2, sq = G.squash * b * c2, lean = G.lean * k * dir;
    const sw = G.swing * b * Math.sin(2 * Math.PI * ph);
    const [fx, fy] = rig.feet, g = rig.ground;
    const set = (c, t) => { const el = q(c); if (el) el.setAttribute('transform', t); };
    set('hop', `translate(0 ${r2(hop)})`);
    set('shadow', `translate(60 ${g}) scale(${r2(1 - .35 * (-(hop + bob) / Math.max(1, G.hop + G.bob)))} 1) translate(-60 ${-g})`);
    set('legL', `translate(${r2(lx * b * dir)} ${r2(ly * b)})`);
    set('legR', `translate(${r2(rx * b * dir)} ${r2(ry * b)})`);
    set('body', `rotate(${r2(lean)} ${fx} ${fy}) translate(0 ${r2(bob)}) translate(${fx} ${fy}) scale(${r2(1 + sq * .6)} ${r2(1 - sq)}) translate(${-fx} ${-fy})`);
    set('armL', `rotate(${r2(sw)} ${rig.armL[0]} ${rig.armL[1]})`);
    set('armR', `rotate(${r2(sw)} ${rig.armR[0]} ${rig.armR[1]})`);
    set('top', `rotate(${r2((-G.lag * b * Math.sin(4 * Math.PI * ph - .9)) * dir - lean * .4)} ${rig.top[0]} ${rig.top[1]})`);
  }

  // Walk `el` (the box holding the character's <svg>) horizontally from `from` px to `to` px (CSS translateX).
  // Options: gait ('stroll' | 'hurry' | 'bouncy'), who ('tamr' | 'miswak'), easeIn, easeOut, fade ('in' | 'out').
  // Returns a promise that resolves when he arrives; .cancel() stops him where he is.
  function walk(el, { from, to, gait = 'stroll', who = 'tamr', easeIn = false, easeOut = true, fade, onFrame, _tok } = {}) {
    const tok = _tok || (el.__tw = {}); // a newer walk on the same element (or cancel) stops this one
    const svg = el.querySelector('svg'), G = GAITS[gait] || GAITS.stroll, rig = RIGS[who] || RIGS.tamr;
    const scale = (el.getBoundingClientRect().width || 112) / 120; // px per drawing unit
    const dir = Math.sign(to - from) || 1, Lu = Math.abs(to - from) / scale;
    const place = (x, op) => { el.style.transform = `translateX(${r2(x)}px)`; if (fade) el.style.opacity = op; if (onFrame) onFrame(x); };
    let raf = 0, done;
    const p = new Promise(res => { done = res; });
    if (reduced() || !svg || Lu < 1) { place(to, fade === 'out' ? 0 : 1); if (svg) pose(svg, rig, G, 0, 0, dir); done(); p.cancel = () => {}; return p; }
    const { pts, T, dt } = plan(Lu, G, easeIn, easeOut);
    let start = 0;
    const frame = now => {
      if (el.__tw !== tok) return done();
      if (!start) start = now;
      const t = (now - start) / 1000, i = Math.min(pts.length - 1, Math.floor(t / dt));
      const [d, v] = pts[i], f = d / Lu;
      place(from + (to - from) * f, fade === 'in' ? sm(f * 4) : fade === 'out' ? 1 - sm((f - .7) / .3) : 1);
      pose(svg, rig, G, d, v, dir);
      if (t < T) raf = requestAnimationFrame(frame); else { pose(svg, rig, G, d, 0, dir); done(); }
    };
    place(from, fade === 'in' ? 0 : 1);
    raf = requestAnimationFrame(frame);
    p.cancel = () => { cancelAnimationFrame(raf); if (el.__tw === tok) el.__tw = null; done(); };
    return p;
  }

  // A short tween: fn(u) for u from 0 to 1 over `ms`.
  function tween(ms, fn, alive = () => true) {
    return new Promise(res => {
      let start = 0;
      const frame = now => { if (!alive()) return res(); if (!start) start = now; const u = Math.min(1, (now - start) / ms); fn(u); if (u < 1) requestAnimationFrame(frame); else res(); };
      requestAnimationFrame(frame);
    });
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // The kufi slip: partway in, his kufi pops off and lands behind him. He stops, looks up ("huh?"),
  // turns around embarrassed, walks back, picks it up, puts it back on, turns round and carries on.
  function oops(el, opts = {}) {
    const tok = el.__tw = {};
    const p = run(el, opts, tok, () => el.__tw === tok);
    p.cancel = () => { if (el.__tw === tok) el.__tw = null; };
    return p;
  }
  async function run(el, { from, to, drop, fade, onKufi }, _tok, alive) {
    const svg = el.querySelector('svg');
    const q = c => svg && svg.querySelector('.w-' + c);
    if (reduced() || !q('loose')) return walk(el, { from, to, fade, _tok });
    const show = (c, on) => { const n = q(c); if (n) n.style.display = on ? '' : 'none'; };
    const s = (el.getBoundingClientRect().width || 112) / 120, dir = Math.sign(to - from) || 1;
    let x = from;
    const track = v => { x = v; };
    const p1 = drop ?? from + (to - from) * .42; // where the kufi comes off
    await walk(el, { from, to: p1, gait: 'stroll', easeOut: false, fade: fade === 'in' ? 'in' : undefined, onFrame: track, _tok });
    if (!alive()) return;

    // Off it pops: a little hop up, a tumble, a bump on the ground, landing a step behind where it fell.
    show('top', false); show('loose', true);
    const loose = q('loose'), kx = p1 - dir * 14 * s, land = -dir * 380;
    let ky = 0, kr = 0, kox = 0;
    const putKufi = () => loose.setAttribute('transform', `translate(${r2((kx - x) / s + kox)} ${r2(ky)}) rotate(${r2(kr)} 60 30)`);
    const fall = tween(760, u => {
      const a = Math.min(1, u / .82);
      ky = a < .3 ? -18 * sm(a / .3) : -18 + 91 * ((a - .3) / .7) ** 2;
      if (u > .82) ky = 73 - 5 * Math.sin(Math.PI * (u - .82) / .18);
      kr = land * sm(a);
      putKufi();
    }, alive);
    const kufiAt = v => { track(v); putKufi(); };
    await Promise.all([fall, walk(el, { from: p1, to: p1 + dir * 52 * s, gait: 'stroll', onFrame: kufiAt, _tok })]);
    if (onKufi) onKufi();
    if (!alive()) return;

    // "Huh?" … then "heh, oops".
    show('f-main', false); show('f-up', true);
    await wait(520);
    if (!alive()) return;
    show('f-up', false); show('f-oops', true);
    const body = q('body');
    const turn = () => tween(300, u => body.setAttribute('transform', `translate(60 108) scale(${r2(1 - .22 * Math.sin(Math.PI * u))} 1) translate(-60 -108)`), alive);
    await turn();
    await walk(el, { from: x, to: kx, gait: 'stroll', easeIn: true, onFrame: kufiAt, _tok });
    if (!alive()) return;

    // Bend down, scoop it up, pop it back on.
    await tween(260, u => body.setAttribute('transform', `translate(60 112) scale(${r2(1 + .06 * sm(u))} ${r2(1 - .12 * sm(u))}) translate(-60 -112)`), alive);
    const y0 = ky, r0 = kr;
    await tween(480, u => {
      const e = sm(u);
      ky = y0 * (1 - e) - 38 * Math.sin(Math.PI * u); kox = -dir * 22 * Math.sin(Math.PI * u); kr = r0 * (1 - e); putKufi();
      body.setAttribute('transform', `translate(60 112) scale(${r2(1 + .06 * (1 - e))} ${r2(1 - .12 * (1 - e))}) translate(-60 -112)`);
    }, alive);
    show('loose', false); show('top', true);
    await wait(220);
    await turn();
    if (!alive()) return;
    setTimeout(() => { if (alive()) { show('f-oops', false); show('f-main', true); } }, 1100);
    return walk(el, { from: kx, to, gait: 'stroll', easeIn: true, onFrame: track, _tok });
  }

  globalThis.TamrWalk = { walk, oops, GAITS };
})();
