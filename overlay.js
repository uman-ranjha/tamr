// Tamr / Miswak walk onto the page to remind you.
// Isolation: draws only inside a closed shadow root, never reads the page, makes no network requests.
(() => {
  if (window.__tamrBuddy) return;
  window.__tamrBuddy = true;

  const CSS = `
  .stage { position: fixed; right: 18px; bottom: 14px; display: flex; align-items: flex-end; gap: 4px;
    font: 14px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
    --card: #164b49; --ink: #f3ead2; --muted: #a9c6c1; --line: #2a6361; --accent: #e0b75a; --btn: #e0b75a; --on-btn: #1d2b22; }
  .worried { --accent: #f0a64a; } .panic { --accent: #ff8a73; }
  .calm { --accent: #e0b75a; } .happy { --accent: #e0b75a; }

  /* the walk itself is lib/walk.js: real steps, planted feet, body bob */
  .char { width: 112px; height: 117px; flex: none; transform: translateX(400px); }
  .char svg { width: 100%; height: 100%; display: block; overflow: visible; transform-origin: 50% 92%; }
  .card { position: relative; width: 252px; margin-bottom: 44px; padding: 12px 14px; background: var(--card); color: var(--ink);
    border: 2px solid var(--accent); border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,20,20,.35); opacity: 0; pointer-events: none; }
  .arrived .card { opacity: 1; pointer-events: auto; animation: pop .35s both; }
  .card::after { content: ""; position: absolute; right: -9px; bottom: 22px; border: 8px solid transparent; border-left-color: var(--card); border-right: 0; }
  .name { font-weight: 800; font-size: 13px; margin-bottom: 2px; }
  .msg { margin: 0 0 10px; font-size: 13.5px; }
  .btns { display: flex; gap: 6px; }
  button { font: inherit; cursor: pointer; border-radius: 9px; border: 1px solid var(--line); background: transparent; color: var(--ink); padding: 6px 10px; font-size: 12.5px; }
  .done { background: var(--btn); border-color: var(--btn); color: var(--on-btn); font-weight: 700; flex: 1; }
  .pause { border: 0; padding: 0; margin-top: 8px; color: var(--muted); font-size: 11.5px; text-decoration: underline; background: none; }
  .x { position: absolute; top: 6px; inset-inline-end: 6px; border: 0; padding: 2px 6px; color: var(--muted); font-size: 16px; line-height: 1; }

  .leave .card { animation: fade .2s both; }
  .card.gone { animation: fade .3s both; pointer-events: none; }
  .char.dozing { cursor: pointer; }
  .char.dozing svg { animation: breathe 3.2s ease-in-out infinite; }
  @keyframes breathe { 50% { transform: scale(1.03, .97); } }
  .cheer .char svg { animation: cheer .35s ease-in-out 2 alternate both; }
  @keyframes cheer { to { transform: translateY(-14px); } }
  @media (prefers-reduced-motion: reduce) { .char svg { animation: none !important; } }
  @keyframes pop { from { opacity: 0; transform: translateY(6px) scale(.96); } }
  @keyframes fade { to { opacity: 0; transform: translateY(4px); } }
`;

  let host = null, root = null, cur = null, walking = null;
  const W = () => globalThis.TamrWalk;

  // Walk off to the right. After you've prayed it's the bouncy walk; otherwise his normal stroll.
  function leave(delay = 0, happy = false) {
    if (!host) return;
    const h = host, r = root, m = cur; host = root = cur = null;
    setTimeout(async () => {
      walking?.cancel?.();
      const stage = r.querySelector('.stage'), ch = r.querySelector('.char');
      stage?.classList.add('leave'); stage?.classList.remove('cheer');
      ch.classList.remove('dozing'); ch.onclick = null;
      if (m) ch.innerHTML = happy ? m.happySvg : m.walkSvg || m.svg;
      if (W()) await W().walk(ch, { from: 0, to: 440, gait: happy ? 'bouncy' : 'stroll', who: m?.walker || 'tamr', easeIn: true, easeOut: false });
      h.remove();
    }, delay);
  }

  function celebrate() {
    if (!cur) return;
    walking?.cancel?.();
    root.querySelector('.stage').className = 'stage happy arrived cheer';
    root.querySelector('.char').style.transform = 'none';
    root.querySelector('.char').innerHTML = cur.happySvg;
    root.querySelector('.msg').textContent = cur.thanks;
    root.querySelector('.btns')?.remove(); root.querySelector('.pause')?.remove();
    if (!cur.dozeSvg) return leave(1600, true);
    // After cheering, he sits down at the bottom of the page and dozes for a minute. Click him to send him off.
    const r = root, d = cur;
    setTimeout(() => {
      if (root !== r) return;
      r.querySelector('.stage').classList.remove('cheer');
      r.querySelector('.card').classList.add('gone');
      r.querySelector('.char').innerHTML = d.dozeSvg;
      r.querySelector('.char').classList.add('dozing');
      r.querySelector('.char').title = d.l_letgo || 'Click to let Tamr go';
      r.querySelector('.char').onclick = () => leave();
      setTimeout(() => { if (root === r) leave(); }, 60000);
    }, 1800);
  }

  function show(m) {
    if (host) { host.remove(); host = null; }
    host = document.createElement('tamr-buddy');
    host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
    root = host.attachShadow({ mode: 'closed' });
    root.innerHTML = `<style>${CSS}</style>
      <div class="stage ${m.mood}">
        <div class="card" role="alert">
          <button class="x">×</button>
          <div class="name"></div>
          <p class="msg"></p>
          <div class="btns"><button class="done"></button><button class="snz"></button></div>
          <button class="pause"></button>
        </div>
        <div class="char"></div>
      </div>`;
    root.querySelector('.name').textContent = m.who;
    root.querySelector('.msg').textContent = m.text;
    root.querySelector('.done').textContent = m.done;
    root.querySelector('.pause').textContent = m.l_pause || "Don't show up on this site";
    root.querySelector('.snz').textContent = m.l_snooze || 'Snooze 5m';
    root.querySelector('.x').setAttribute('aria-label', m.l_dismiss || 'Dismiss');
    root.querySelector('.card').dir = m.dir || 'ltr'; // text reads right-to-left; Tamr still walks in from the right
    root.querySelector('.char').innerHTML = m.svg; // markup comes from this extension's own background script
    cur = m;
    root.querySelector('.done').onclick = () => { if (m.markDone) chrome.runtime.sendMessage({ type: 'done', kind: m.kind, day: m.day, key: m.key }); celebrate(); };
    root.querySelector('.snz').onclick = () => { chrome.runtime.sendMessage({ type: 'snooze', kind: m.kind, day: m.day, key: m.key }); leave(); };
    root.querySelector('.x').onclick = () => leave();
    root.querySelector('.pause').onclick = async () => {
      const { pausedSites = [] } = await chrome.storage.sync.get('pausedSites');
      if (!pausedSites.includes(location.hostname)) pausedSites.push(location.hostname);
      await chrome.storage.sync.set({ pausedSites });
      leave();
    };
    document.documentElement.appendChild(host);
    // Walk in from off-screen right; the card pops up once he's arrived.
    const ch = root.querySelector('.char'), stage = root.querySelector('.stage'), r = root;
    if (!W()) { ch.style.transform = 'none'; stage.classList.add('arrived'); return; }
    walking = m.oops ? W().oops(ch, { from: 400, to: 0, drop: 30 })
      : W().walk(ch, { from: 400, to: 0, gait: m.gait || 'stroll', who: m.walker || 'tamr' });
    walking.then(() => { if (root === r) stage.classList.add('arrived'); });
  }

  chrome.runtime.onMessage.addListener((m, sender, reply) => {
    if (m?.type !== 'buddy' || sender.id !== chrome.runtime.id || sender.tab) return;   // only from our background
    chrome.storage.sync.get('pausedSites').then(({ pausedSites = [] }) => {
      if (pausedSites.includes(location.hostname) || document.visibilityState !== 'visible') return reply({ shown: false });
      show(m); reply({ shown: true });
    });
    return true;
  });

  // Checked off somewhere else (popup / another tab)? Celebrate and walk off.
  chrome.storage.onChanged.addListener((ch, area) => {
    if (!cur || area !== 'sync') return;
    const mk = 'log-' + String(cur.day).slice(0, 7);
    if (ch[mk]?.newValue?.[cur.day]?.[cur.key]) celebrate();
  });
})();
