  /* ============================================================
     みる ちから（視覚認知）
     まちがいさがし・おなじ かたち・てんつなぎ・せん たどり・かず さがし・め で おう
     ============================================================ */
  const POOL = ['🍎', '🍌', '🍇', '🍓', '🍉', '🍒', '🐶', '🐱', '🐰', '🐻', '🐼', '🐸', '🐟', '🐞', '🦋', '🚗', '🚌', '🚲', '✈️', '⚽', '🎈', '⭐', '🌸', '🌳', '🏠', '☂️', '🎁', '🧸', '🍰', '🌙', '🍄', '🐤'];
  const ASYM = ['🐶', '🐱', '🐰', '🐸', '🐟', '🚗', '🚌', '🚲', '✈️', '🐤', '☂️', '🦋', '🐞'];
  const GAMES = [
    { id: 'diff', e: '🔍', n: 'まちがい さがし', s: 'ちがう ところは どこ？', c: '#E64980' },
    { id: 'same', e: '🧩', n: 'おなじ かたち', s: 'おなじ むきの かたちを さがす', c: '#1C7ED6' },
    { id: 'dots', e: '✏️', n: 'てん つなぎ', s: 'じゅんばんに つなぐと なにかな？', c: '#F08C00' },
    { id: 'line', e: '〰️', n: 'せん たどり', s: 'めで せんを たどる', c: '#0CA678' },
    { id: 'count', e: '🔢', n: 'かず さがし', s: 'ぜんぶ みつけて かぞえる', c: '#7048E8' },
    { id: 'chase', e: '🐞', n: 'め で おう', s: 'うごく ものを めで おいかける', c: '#E8590C' }
  ];
  const COL = ['#FA5252', '#339AF0', '#FCC419', '#51CF66', '#CC5DE8', '#FF922B'];
  const APP = {
    id: 'miru-chikara', title: 'みる ちから', ls: 'miru.v1', db: false, sw: true, color: '#7048E8',
    defaults: { level: 1, qn: 4 },
    newProfile: (name, icon) => ({ id: 'p' + Math.random().toString(36).slice(2, 9), name, icon, best: {}, log: [] }),
    normProfile(p) { p.best = p.best && typeof p.best === 'object' ? p.best : {}; p.log = Array.isArray(p.log) ? p.log : []; },
    childScreens: ['play'], topScreens: ['home'],
    renderHome: () => renderHome(),
    profileNote: p => 'れんしゅう ' + p.log.length + 'かい',
    helpNote: 'よむ・かく・かぞえる の もとに なる「みる ちから（視覚認知）」を あそびで そだてます。まちがいさがし（くらべて みる）、おなじ かたち（むき・かたちの ちがいに きづく）、てんつなぎ（じゅんばんに めと てを うごかす）、せん たどり（めで おう：追視）、かず さがし（たくさんの なかから さがす：走査）、め で おう（うごく ものを おう）。どれも 3レベルで、プリントも つくれます（まいかい ちがう もんだいに なります）。'
  };
/*BASE_HERE*/

  const SVGNS = 'http://www.w3.org/2000/svg';
  const em = (e, x, y, s, extra) => '<text x="' + x + '" y="' + y + '" font-size="' + s + '" text-anchor="middle" dominant-baseline="central" ' + (extra || '') + '>' + e + '</text>';
  const L = () => Number(S().level) || 1;

  /* ============================================================
     🔍 まちがい さがし
     ============================================================ */
  function genDiff(lv) {
    const [c, r, nd] = [[3, 3, 2], [4, 3, 3], [5, 4, 5]][lv - 1];
    const W = 100, cw = W / c, ch = 80 / r;
    const cells = [];
    const pool = shuffle(POOL);
    for (let i = 0; i < c * r; i++) cells.push({ e: pool[i % pool.length], x: (i % c + .5) * cw + ri(-3, 3), y: (Math.floor(i / c) + .5) * ch + ri(-2, 2), s: Math.min(cw, ch) * (.55 + Math.random() * .15), rot: lv > 1 ? ri(-15, 15) : 0, f: false, hide: false });
    const right = cells.map(x => Object.assign({}, x));
    const idx = shuffle(cells.map((_, i) => i)).slice(0, nd);
    idx.forEach(i => {
      const t = right[i], kinds = lv === 1 ? ['swap', 'hide'] : lv === 2 ? ['swap', 'hide', 'flip', 'size'] : ['swap', 'flip', 'size', 'rot', 'hide'];
      let k = pick(kinds); if (k === 'flip' && ASYM.indexOf(t.e) < 0) k = 'swap';
      if (k === 'swap') t.e = pick(POOL.filter(x => !cells.some(y => y.e === x)));
      if (k === 'hide') t.hide = true;
      if (k === 'flip') t.f = true;
      if (k === 'size') t.s *= .6;
      if (k === 'rot') t.rot += 90;
    });
    return { c, r, cells, right, diffs: idx, found: [] };
  }
  function diffSVG(cells, q, side) {
    let s = '<svg viewBox="0 0 100 80" xmlns="' + SVGNS + '">';
    cells.forEach((t, i) => {
      if (!t.hide) s += '<g transform="translate(' + t.x + ' ' + t.y + ') rotate(' + t.rot + ')' + (t.f ? ' scale(-1 1)' : '') + '">' + em(t.e, 0, 0, t.s) + '</g>';
      if (q && q.found.indexOf(i) >= 0) s += '<circle class="mark" cx="' + t.x + '" cy="' + t.y + '" r="' + (100 / q.c * .42) + '"/>';
    });
    if (side) cells.forEach((t, i) => { s += '<rect class="hit" data-i="' + i + '" x="' + (t.x - 50 / q.c) + '" y="' + (t.y - 40 / q.r) + '" width="' + (100 / q.c) + '" height="' + (80 / q.r) + '"/>'; });
    return s + '</svg>';
  }

  /* ============================================================
     🧩 おなじ かたち（3×3 の なかの ブロックの かたち）
     ============================================================ */
  const norm = cs => { const mx = Math.min(...cs.map(c => c[0])), my = Math.min(...cs.map(c => c[1])); return cs.map(c => [c[0] - mx, c[1] - my]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
  const key = cs => norm(cs).map(c => c.join(',')).join(';');
  const rot = cs => cs.map(([x, y]) => [2 - y, x]), mir = cs => cs.map(([x, y]) => [2 - x, y]);
  function randShape(n) {
    for (let t = 0; t < 200; t++) {
      const cs = [[ri(0, 2), ri(0, 2)]];
      while (cs.length < n) { const b = pick(cs), d = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), nx = b[0] + d[0], ny = b[1] + d[1]; if (nx < 0 || ny < 0 || nx > 2 || ny > 2 || cs.some(c => c[0] === nx && c[1] === ny)) continue; cs.push([nx, ny]); }
      // むきを かえると ちがう かたちに なる もの（ひだり・みぎ・まわすで ちがいが でる）
      const ks = new Set(); let v = cs; for (let i = 0; i < 4; i++) { ks.add(key(v)); ks.add(key(mir(v))); v = rot(v); }
      if (ks.size === 8) return cs;
    }
    return [[0, 0], [1, 0], [2, 0], [0, 1]];
  }
  function variants(cs) { const out = []; let v = cs; for (let i = 0; i < 4; i++) { if (i) out.push(v); out.push(mir(v)); v = rot(v); } return out.filter(x => key(x) !== key(cs)); }
  function genSame(lv) {
    const n = [6, 9, 12][lv - 1], same = [2, 3, 3][lv - 1], size = lv === 1 ? 4 : 5;
    const t = randShape(size), color = pick(COL);
    const items = [];
    for (let i = 0; i < same; i++) items.push({ cs: t, c: color, ok: true });
    const tk = key(t);
    let guard = 0;
    while (items.length < n && guard++ < 300) {
      let cs, c = color;
      if (lv === 1) { cs = randShape(pick([3, 4, 5])); if (Math.random() < .4) c = pick(COL); }
      else if (lv === 2) { cs = Math.random() < .7 ? pick(variants(t)) : randShape(size); }
      else { const r = Math.random(); if (r < .6) cs = pick(variants(t)); else { cs = t.slice(); const i = ri(0, cs.length - 1); const free = []; for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) if (!cs.some(q => q[0] === x && q[1] === y)) free.push([x, y]); cs = cs.filter((_, j) => j !== i).concat([pick(free)]); } }
      if (key(cs) === tk) continue;
      if (items.filter(x => key(x.cs) === key(cs) && x.c === c).length >= 2) continue;
      items.push({ cs, c, ok: false });
    }
    return { t, color, items: shuffle(items), same, found: 0 };
  }
  const shapeSVG = (cs, c, stroke) => '<svg viewBox="-2 -2 64 64" xmlns="' + SVGNS + '">' + cs.map(([x, y]) => '<rect x="' + (x * 20 + 1) + '" y="' + (y * 20 + 1) + '" width="18" height="18" rx="3" fill="' + (c || '#fff') + '" stroke="' + (stroke || 'rgba(0,0,0,.35)') + '" stroke-width="1.5"/>').join('') + '</svg>';

  /* ============================================================
     ✏️ てん つなぎ
     ============================================================ */
  const poly = (n, f) => Array.from({ length: n }, (_, i) => f(i / n * Math.PI * 2, i));
  const SHAPES = [
    { n: 'いえ', e: '🏠', lv: 1, p: [[20, 90], [20, 45], [10, 45], [50, 10], [90, 45], [80, 45], [80, 90]] },
    { n: 'ねこ', e: '🐱', lv: 1, p: [[20, 90], [20, 40], [15, 10], [40, 28], [60, 28], [85, 10], [80, 40], [80, 90]] },
    { n: 'さかな', e: '🐟', lv: 1, p: [[8, 50], [30, 28], [60, 24], [78, 40], [94, 24], [94, 76], [78, 60], [60, 76], [30, 72]] },
    { n: 'ほし', e: '⭐', lv: 2, p: poly(10, (a, i) => [50 + Math.sin(a) * (i % 2 ? 19 : 44), 54 - Math.cos(a) * (i % 2 ? 19 : 44)]) },
    { n: 'き', e: '🌳', lv: 2, p: [[50, 8], [72, 35], [62, 35], [82, 60], [58, 60], [58, 90], [42, 90], [42, 60], [18, 60], [38, 35], [28, 35]] },
    { n: 'ロケット', e: '🚀', lv: 2, p: [[50, 5], [64, 25], [64, 65], [78, 84], [62, 80], [56, 92], [44, 92], [38, 80], [22, 84], [36, 65], [36, 25]] },
    { n: 'ふね', e: '⛵', lv: 2, p: [[12, 60], [48, 60], [48, 12], [80, 55], [52, 55], [52, 60], [90, 60], [76, 84], [26, 84]] },
    { n: 'ハート', e: '❤️', lv: 3, p: poly(18, a => [50 + 40 * Math.pow(Math.sin(a), 3), 48 - (30 * Math.cos(a) - 12 * Math.cos(2 * a) - 5 * Math.cos(3 * a) - 2 * Math.cos(4 * a))]) },
    { n: 'はな', e: '🌸', lv: 3, p: poly(20, a => { const r = 30 + 14 * Math.cos(5 * a); return [50 + r * Math.sin(a), 50 - r * Math.cos(a)]; }) },
    { n: 'ちょうちょ', e: '🦋', lv: 3, p: [[50, 30], [62, 12], [88, 10], [92, 30], [76, 48], [90, 66], [80, 88], [60, 80], [50, 62], [40, 80], [20, 88], [10, 66], [24, 48], [8, 30], [12, 10], [38, 12]] }
  ];
  const KANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねの'.split('');
  function genDots(lv, last) {
    const list = SHAPES.filter(s => s.lv === lv && s.n !== last);
    const s = pick(list.length ? list : SHAPES);
    const kana = lv === 3 && Math.random() < .5;
    return { s, pts: s.p.map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]), labels: s.p.map((_, i) => kana ? KANA[i] : String(i + 1)), kana, next: 0 };
  }
  function dotsSVG(q, play, done) {
    const P = q.pts; let s = '<svg viewBox="-6 -6 112 112" xmlns="' + SVGNS + '">';
    if (done) s += '<polygon points="' + P.map(p => p.join(',')).join(' ') + '" fill="#FFF3BF" stroke="#F08C00" stroke-width="1.6"/>';
    else for (let i = 1; i < q.next; i++) s += '<line x1="' + P[i - 1][0] + '" y1="' + P[i - 1][1] + '" x2="' + P[i][0] + '" y2="' + P[i][1] + '" stroke="#F08C00" stroke-width="1.6" stroke-linecap="round"/>';
    P.forEach((p, i) => {
      const on = play && i < q.next, nx = play && i === q.next && S().level === 1;
      // ばんごうは まんなかから そとがわに
      const dx = p[0] - 50, dy = p[1] - 50, d = Math.hypot(dx, dy) || 1, lx = p[0] + dx / d * 5.2, ly = p[1] + dy / d * 5.2;
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (nx ? 2.6 : 1.8) + '" fill="' + (on ? '#F08C00' : nx ? '#FA5252' : '#333') + '"/>';
      s += '<text x="' + lx + '" y="' + ly + '" font-size="4.4" text-anchor="middle" dominant-baseline="central" font-weight="700" fill="' + (on ? '#ADB5BD' : '#333') + '">' + q.labels[i] + '</text>';
      if (play) s += '<circle class="hit" data-i="' + i + '" cx="' + p[0] + '" cy="' + p[1] + '" r="5.5"/>';
    });
    return s + '</svg>';
  }

  /* ============================================================
     〰️ せん たどり
     ============================================================ */
  const STARTS = ['🐰', '🐻', '🐱', '🐶', '🐼'], ENDS = ['🥕', '🍯', '🐟', '🦴', '🎋'];
  function genLine(lv) {
    const n = [3, 4, 5][lv - 1], perm = shuffle([...Array(n).keys()]);
    if (perm.every((p, i) => p === i)) perm.push(perm.shift());
    const xs = i => 10 + i * (80 / (n - 1));
    const paths = [];
    // なめらかな せん（とおる てんを きめて、カーブで つなぐ）。ゆれは ひかえめに して、せんどうしが かさならない ように
    const steps = lv + 3, jit = [6, 9, 11][lv - 1];
    for (let i = 0; i < n; i++) {
      const x0 = xs(i), x1 = xs(perm[i]), P = [];
      for (let k = 0; k <= steps; k++) { const t = k / steps, ease = t * t * (3 - 2 * t); P.push([k === 0 || k === steps ? x0 + (x1 - x0) * ease : Math.max(5, Math.min(95, x0 + (x1 - x0) * ease + ri(-jit, jit))), 14 + t * 72]); }
      let d = 'M' + P[0][0] + ' ' + P[0][1];
      for (let k = 0; k < P.length - 1; k++) { const p0 = P[k - 1] || P[k], p1 = P[k], p2 = P[k + 1], p3 = P[k + 2] || p2; d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1); }
      paths.push(d);
    }
    const order = shuffle([...Array(n).keys()]);
    return { n, perm, paths, xs: [...Array(n).keys()].map(xs), starts: STARTS.slice(0, n), ends: ENDS.slice(0, n), order, k: 0, colored: lv === 1 };
  }
  function lineSVG(q, hi) {
    let s = '<svg viewBox="0 0 100 100" xmlns="' + SVGNS + '">';
    q.paths.forEach((d, i) => { s += '<path d="' + d + '" fill="none" stroke="' + (q.colored ? COL[i] : '#495057') + '" stroke-width="' + (hi === i ? 2.4 : 1.1) + '" stroke-linecap="round" opacity="' + (hi != null && hi !== i ? .35 : 1) + '"' + (hi === i ? ' class="trace"' : '') + '/>'; });
    q.starts.forEach((e, i) => { s += em(e, q.xs[i], 7, 9); });
    q.ends.forEach((e, i) => { s += em(e, q.xs[i], 93, 9) + '<rect class="hit" data-i="' + i + '" x="' + (q.xs[i] - 8) + '" y="85" width="16" height="15"/>'; });
    return s + '</svg>';
  }

  /* ============================================================
     🔢 かず さがし
     ============================================================ */
  const LOOK = { '🍎': ['🍅', '🍒'], '🐶': ['🐱', '🐻'], '⭐': ['🌟', '✨'], '🚗': ['🚕', '🚙'], '🐟': ['🐠', '🐡'], '🌸': ['🌼', '🌺'] };
  function genCount(lv) {
    const tg = pick(Object.keys(LOOK)), n = ri(...[[3, 6], [5, 9], [7, 12]][lv - 1]), total = [16, 26, 38][lv - 1];
    const others = lv === 3 ? LOOK[tg].concat(shuffle(POOL.filter(x => x !== tg)).slice(0, 3)) : lv === 2 ? [LOOK[tg][0]].concat(shuffle(POOL.filter(x => x !== tg)).slice(0, 4)) : shuffle(POOL.filter(x => x !== tg && LOOK[tg].indexOf(x) < 0)).slice(0, 5);
    const items = [], minD = [17, 13, 11][lv - 1];
    const place = e => { for (let t = 0; t < 300; t++) { const x = ri(8, 92), y = ri(8, 72); if (items.every(o => Math.hypot(o.x - x, o.y - y) > minD)) { items.push({ e, x, y, r: lv > 1 ? ri(-25, 25) : 0, s: minD * (.6 + Math.random() * .2) }); return true; } } return false; };
    for (let i = 0; i < n; i++) place(tg);
    const real = items.length;
    for (let i = real; i < total; i++) place(pick(others));
    return { tg, n: real, items: shuffle(items), found: [] };
  }
  function countSVG(q, play) {
    let s = '<svg viewBox="0 0 100 80" xmlns="' + SVGNS + '">';
    q.items.forEach((t, i) => {
      s += '<g transform="translate(' + t.x + ' ' + t.y + ') rotate(' + t.r + ')">' + em(t.e, 0, 0, t.s) + '</g>';
      if (play && q.found.indexOf(i) >= 0) s += '<circle class="mark" cx="' + t.x + '" cy="' + t.y + '" r="' + (t.s * .62) + '" style="stroke:#40C057"/>';
      if (play) s += '<circle class="hit" data-i="' + i + '" cx="' + t.x + '" cy="' + t.y + '" r="' + (t.s * .6) + '"/>';
    });
    return s + '</svg>';
  }

  /* ============================================================
     ホーム
     ============================================================ */
  function renderHome() {
    screen = 'home';
    const p = cur(), st = S();
    setView('home', [
      h('h1', { class: 'title' }, '👁️ みる ちから', h('small', null, 'よく みて あそぼう')),
      h('div', { class: 'lvl' }, [[1, '🌱 やさしい'], [2, '🌿 ふつう'], [3, '🌳 むずかしい']].map(l => h('button', { type: 'button', class: Number(st.level) === l[0] ? 'on' : '', onclick: () => { st.level = l[0]; persist(); sfx.tap(); renderHome(); } }, l[1]))),
      h('div', { class: 'menu' }, GAMES.map(g => h('button', { type: 'button', class: 'mcard', style: '--c:' + g.c, onclick: () => { if (tapOk()) { sfx.tap(); startGame(g.id); } } },
        p.best[g.id + st.level] ? h('span', { class: 'st' }, '⭐'.repeat(p.best[g.id + st.level])) : null, E(g.e), h('b', null, g.n), h('small', null, g.s))))
    ]);
  }

  /* ============================================================
     ゲームの きょうつう
     ============================================================ */
  let G = null;
  function startGame(id) { G = { id, i: 0, ok: 0, res: [], miss: 0, t0: Date.now(), last: null }; keepAwake(); nextQ(); }
  function nextQ() {
    if (G.i >= Number(S().qn)) { endGame(); return; }
    G.miss = 0; G.busy = false; G.qt = Date.now();
    const lv = L();
    if (G.id === 'diff') G.q = genDiff(lv);
    if (G.id === 'same') G.q = genSame(lv);
    if (G.id === 'dots') { G.q = genDots(lv, G.last); G.last = G.q.s.n; }
    if (G.id === 'line') G.q = genLine(lv);
    if (G.id === 'count') G.q = genCount(lv);
    if (G.id === 'chase') G.q = { hits: 0, need: [5, 7, 9][lv - 1], miss: 0 };
    render();
  }
  function head(ask, cnt) {
    return h('div', { class: 'ghead' }, h('div', { class: 'prog' }, Array.from({ length: Number(S().qn) }, (_, k) => h('i', { class: k < G.i ? (G.res[k] ? 'ok' : '') : k === G.i ? 'now' : '' }))),
      h('div', { class: 'ask' }, ask), h('span', { class: 'cnt' }, cnt || ''));
  }
  function solved(el) {
    if (G.busy) return; G.busy = true;
    sfx.ok(); praise(); if (el) FX.small(el, { variant: 1 });
    G.res[G.i] = G.miss <= 1; if (G.miss <= 1) G.ok++;
    after(1700, () => { G.i++; nextQ(); });
  }
  function miss() { G.miss++; sfx.ng(); }
  const svgEl = html => h('div', { style: 'display:contents', html });
  // ヒント：しばらく みつからない とき
  function hintLater(fn) { after(25000, () => { if (!G.busy && screen === 'play') fn(); }); }

  function render() {
    screen = 'play';
    const q = G.q, id = G.id;
    if (id === 'diff') {
      const L1 = h('div', null, h('span', { class: 'lab' }, 'おてほん'), svgEl(diffSVG(q.cells, q, false)));
      const R = h('div', null, h('span', { class: 'lab' }, 'ここを タッチ'), svgEl(diffSVG(q.right, q, true)));
      R.addEventListener('click', e => {
        const t = e.target.closest('.hit'); if (!t || G.busy) return; const i = Number(t.dataset.i);
        if (q.found.indexOf(i) >= 0) return;
        if (q.diffs.indexOf(i) >= 0) { q.found.push(i); sfx.step(); if (q.found.length === q.diffs.length) { render(); solved($('.stage')); } else render(); }
        else { miss(); const sv = R.querySelector('svg'), c = q.right[i]; sv.insertAdjacentHTML('beforeend', '<g class="xmark"><line x1="' + (c.x - 4) + '" y1="' + (c.y - 4) + '" x2="' + (c.x + 4) + '" y2="' + (c.y + 4) + '"/><line x1="' + (c.x + 4) + '" y1="' + (c.y - 4) + '" x2="' + (c.x - 4) + '" y2="' + (c.y + 4) + '"/></g>'); }
      });
      setView('g', [head('ちがう ところを ' + q.diffs.length + 'つ さがそう', 'みつけた ' + q.found.length + ' / ' + q.diffs.length), h('div', { class: 'stage two' }, L1, R),
        h('div', { class: 'tools' }, h('button', { type: 'button', class: 'mid-btn', onclick: () => hintDiff() }, '💡 ヒント'))]);
      if (!q.found.length) speak('ちがう ところを ' + q.diffs.length + 'つ さがそう');
      hintLater(hintDiff);
      return;
    }
    if (id === 'same') {
      const grid = h('div', { class: 'grid', style: '--c:' + (q.items.length === 6 ? 3 : q.items.length === 9 ? 3 : 4) + ';--r:' + (q.items.length === 12 ? 3 : q.items.length / 3) }, q.items.map(it => {
        const b = h('button', { type: 'button', html: shapeSVG(it.cs, it.c), onclick: () => {
          if (G.busy || b.classList.contains('ok')) return;
          if (it.ok) { b.classList.add('ok'); q.found++; sfx.step(); $('.ghead .cnt').textContent = 'みつけた ' + q.found + ' / ' + q.same; if (q.found === q.same) solved(grid); }
          else { miss(); b.classList.remove('ng'); void b.offsetWidth; b.classList.add('ng'); speak('むきを よく みてね'); }
        } }); return b; }));
      setView('g', [head(h('span', null, 'おなじ かたちを ぜんぶ さがそう'), 'みつけた 0 / ' + q.same),
        h('div', { class: 'stage split' }, h('div', { class: 'target', html: shapeSVG(q.t, q.color) + '<b>これと<br>おなじ</b>' }), grid)]);
      speak('おなじ かたちを ぜんぶ さがそう。むきも おなじだよ');
      return;
    }
    if (id === 'dots') {
      const box = h('div', { style: 'height:100%;width:100%;display:flex;justify-content:center', html: dotsSVG(q, true, false) });
      box.addEventListener('click', e => {
        const t = e.target.closest('.hit'); if (!t || G.busy) return; const i = Number(t.dataset.i);
        if (i === q.next) { q.next++; tone(500 + q.next * 30, 0, .08, 'triangle', .25); if (q.next === q.pts.length) { box.innerHTML = dotsSVG(q, true, true); setTimeout(() => { const a = $('.ghead .ask'); if (a) a.textContent = '「' + q.s.n + '」 ' + q.s.e; }, 50); speak(q.s.n + '。できたね'); solved(box); } else box.innerHTML = dotsSVG(q, true, false); }
        else if (i >= q.next) { miss(); toast('つぎは「' + q.labels[q.next] + '」だよ'); }
      });
      setView('g', [head(q.kana ? 'あ・い・う… の じゅんに つなごう' : '1・2・3… の じゅんに つなごう', q.pts.length + 'こ'), h('div', { class: 'stage' }, box)]);
      speak(q.kana ? 'あいうえおの じゅんに つなごう' : '1から じゅんばんに つなごう');
      return;
    }
    if (id === 'line') {
      if (q.k >= q.n) { solved($('.stage')); return; }
      const who = q.order[q.k];
      const box = h('div', { style: 'height:100%;width:100%;display:flex;justify-content:center', html: lineSVG(q) });
      box.addEventListener('click', e => {
        const t = e.target.closest('.hit'); if (!t || G.busy) return; const i = Number(t.dataset.i);
        if (i === q.perm[who]) { sfx.step(); box.innerHTML = lineSVG(q, who); G.busy = true; speak('せいかい'); after(1300, () => { G.busy = false; q.k++; if (q.k >= q.n) { solved(box); } else render(); }); }
        else { miss(); speak('ゆびで せんを なぞって みよう'); }
      });
      setView('g', [head(h('span', null, E(q.starts[who]), ' は どこに つく？'), (q.k + 1) + ' / ' + q.n), h('div', { class: 'stage' }, box)]);
      speak('どこに つくかな？ めで せんを たどってね');
      return;
    }
    if (id === 'count') {
      const box = h('div', { style: 'height:100%;width:100%;display:flex;justify-content:center', html: countSVG(q, true) });
      box.addEventListener('click', e => {
        const t = e.target.closest('.hit'); if (!t || G.busy) return; const i = Number(t.dataset.i);
        if (q.found.indexOf(i) >= 0) return;
        if (q.items[i].e === q.tg) { q.found.push(i); tone(600 + q.found.length * 40, 0, .1, 'triangle', .25); box.innerHTML = countSVG(q, true); $('.ghead .cnt').textContent = 'みつけた ' + q.found.length; if (q.found.length === q.n) { speak('ぜんぶで ' + q.n + 'こ'); $('.ghead .ask').textContent = q.tg + ' は ' + q.n + 'こ！'; solved(box); } }
        else { miss(); }
      });
      setView('g', [head(h('span', null, E(q.tg), ' を ぜんぶ みつけよう'), 'みつけた 0'), h('div', { class: 'stage' }, box)]);
      speak('ぜんぶ みつけて かぞえよう');
      hintLater(() => { const left = q.items.map((t, i) => i).filter(i => q.items[i].e === q.tg && q.found.indexOf(i) < 0); const sv = box.querySelector('svg'); left.slice(0, 1).forEach(i => { const t = q.items[i]; sv.insertAdjacentHTML('beforeend', '<circle class="mark blink" cx="' + t.x + '" cy="' + t.y + '" r="' + t.s * .7 + '" style="stroke:#FAB005"/>'); }); });
      return;
    }
    if (id === 'chase') renderChase();
  }
  function hintDiff() { const q = G.q, left = q.diffs.filter(i => q.found.indexOf(i) < 0); if (!left.length) return; G.miss++; const c = q.right[left[0]], sv = $('.stage.two > div:last-child svg'); if (sv) sv.insertAdjacentHTML('beforeend', '<circle class="mark blink" cx="' + c.x + '" cy="' + c.y + '" r="' + (100 / q.c * .45) + '" style="stroke:#FAB005"/>'); }

  /* ============================================================
     🐞 め で おう：うごいて、とまって ⭐ に なったら タッチ
     ============================================================ */
  function renderChase() {
    const q = G.q, lv = L();
    const box = h('div', { style: 'position:relative;width:100%;height:100%;background:#fff;border-radius:24px;border:4px solid var(--line);overflow:hidden;touch-action:manipulation' });
    const bug = h('div', { style: 'position:absolute;left:0;top:0;font-size:clamp(46px,9vh,80px);transition:none;will-change:transform;cursor:pointer;line-height:1' }, '🐞');
    box.append(bug);
    setView('g', [head('🐞 を めで おいかけよう。⭐ に なったら タッチ！', 'タッチ 0 / ' + q.need), h('div', { class: 'stage' }, box)]);
    speak('てんとうむしを めで おいかけよう。ほしに なったら タッチ');
    let x = 50, y = 50, tx = 50, ty = 50, mode = 'move', t0 = performance.now(), stopAt = 0, run = true;
    const speed = [.018, .03, .045][lv - 1];
    const newTarget = () => { tx = ri(8, 92); ty = ri(10, 90); };
    newTarget();
    onStop(() => { run = false; });
    const frame = now => {
      if (!run || screen !== 'play' || G.id !== 'chase') return;
      const W = box.clientWidth, H = box.clientHeight;
      if (mode === 'move') {
        const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy);
        if (d < 1) { if (Math.random() < .35 || now - t0 > 4500) { mode = 'stop'; stopAt = now; bug.textContent = '⭐'; tone(880, 0, .12, 'sine', .25); } else newTarget(); }
        else { const st = Math.min(d, speed * 16); x += dx / d * st; y += dy / d * st; }
      } else if (now - stopAt > [2600, 1900, 1300][lv - 1]) { mode = 'move'; bug.textContent = '🐞'; t0 = now; newTarget(); q.miss++; }
      bug.style.transform = 'translate(' + (x / 100 * W - bug.offsetWidth / 2) + 'px,' + (y / 100 * H - bug.offsetHeight / 2) + 'px)';
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    box.addEventListener('pointerdown', e => {
      if (G.busy) return;
      if (e.target === bug && mode === 'stop') { q.hits++; sfx.step(); FX.small(bug, { variant: 1 }); mode = 'move'; bug.textContent = '🐞'; t0 = performance.now(); newTarget(); $('.ghead .cnt').textContent = 'タッチ ' + q.hits + ' / ' + q.need; if (q.hits >= q.need) { run = false; G.miss = q.miss > 2 ? 2 : 0; solved(box); } }
      else if (e.target === bug) { tone(300, 0, .08, 'sine', .15); }
    });
  }
  function endGame() {
    const p = cur(), n = Number(S().qn), star = G.ok >= n ? 3 : G.ok >= n * .5 ? 2 : 1, key2 = G.id + S().level;
    p.best[key2] = Math.max(p.best[key2] || 0, star);
    p.log.push({ t: Date.now(), g: G.id, lv: S().level, ok: G.ok, n, sec: Math.round((Date.now() - G.t0) / 1000) });
    if (p.log.length > 1000) p.log.splice(0, p.log.length - 1000);
    persist();
    screen = 'end';
    setView('center', [h('div', { class: 'center' },
      h('div', { class: 'stars' }, [0, 1, 2].map(i => h('span', { class: i < star ? '' : 'off', style: 'animation-delay:' + (i * .2) + 's' }, '⭐'))),
      h('h1', { class: 'title' }, 'よく みたね！', h('small', null, n + 'もん・' + Math.round((Date.now() - G.t0) / 1000) + 'びょう')),
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'big-btn go', onclick: () => { if (tapOk()) startGame(G.id); } }, '🔁 もういちど'),
        h('button', { type: 'button', class: 'big-btn white', onclick: () => { if (tapOk()) renderHome(); } }, '🏠 えらぶ')))]);
    sfx.clear(); if (star === 3) FX.big(); else FX.small(document.querySelector('.title'));
    speak('よく みたね');
  }

  /* ============================================================
     プリント（まいかい ちがう もんだい）
     ============================================================ */
  const PF = '<div class="pf">© MieeL　みる ちから　www.mieel-support-school.com</div>';
  const HD = (t, s) => '<div class="phd"><h1>' + t + '</h1><small>' + (s || '') + '</small><div class="nm">なまえ ＿＿＿＿＿＿＿＿</div></div>';
  function buildPages(type, o) {
    o = o || {};
    const lv = Number(o.lv) || 1, ans = o.ans === 'on';
    if (type === 'diff') {
      const q = genDiff(lv); if (ans) q.found = q.diffs.slice();
      return ['<div class="ppage">' + HD('🔍 まちがい さがし', 'ちがう ところ ' + q.diffs.length + 'つに ○') + '<div class="pw"><div class="two">' + diffSVG(q.cells, null, false) + diffSVG(q.right, ans ? q : null, false) + '</div></div>' + PF + '</div>'];
    }
    if (type === 'same') {
      const q = genSame(lv), c = q.items.length === 12 ? 4 : 3;
      return ['<div class="ppage">' + HD('🧩 おなじ かたち', 'おなじ ものに ○（' + q.same + 'つ）') + '<div class="pw"><div class="tgt">' + shapeSVG(q.t, '#ddd', '#333') + 'これと おなじ むきの かたちは どれ？</div><div class="pgrid" style="--c:' + c + '">' +
        q.items.map(it => '<div style="' + (ans && it.ok ? 'border:1mm solid #E03131' : '') + '">' + shapeSVG(it.cs, '#eee', '#333') + '</div>').join('') + '</div></div>' + PF + '</div>'];
    }
    if (type === 'dots') {
      const q = genDots(lv); q.next = 0;
      return ['<div class="ppage">' + HD('✏️ てん つなぎ', (q.kana ? 'あ・い・う' : '1・2・3') + '… の じゅんに') + '<div class="pw" style="justify-content:center">' + dotsSVG(q, false, ans).replace('font-size="4.4"', 'font-size="3.6"') + (ans ? '<div class="ans">こたえ：' + q.s.n + '</div>' : '') + '</div>' + PF + '</div>'];
    }
    if (type === 'line') {
      const q = genLine(lv); q.colored = false;
      return ['<div class="ppage">' + HD('〰️ せん たどり', 'どこに つくかな？') + '<div class="pw">' + lineSVG(q) + (ans ? '<div class="ans">こたえ：' + q.starts.map((e, i) => e + '→' + q.ends[q.perm[i]]).join('　') + '</div>' : '') + '</div>' + PF + '</div>'];
    }
    const q = genCount(lv); if (ans) q.found = q.items.map((t, i) => i).filter(i => q.items[i].e === q.tg);
    return ['<div class="ppage">' + HD('🔢 かず さがし', q.tg + ' に ○を つけよう') + '<div class="pw">' + countSVG(q, ans).replace(/class="hit"[^/]*\/>/g, '') + '<div class="tgt">' + q.tg + ' は ぜんぶで（　' + (ans ? q.n : '　') + '　）こ</div></div>' + PF + '</div>'];
  }
  window.MieelPrintAPI = {
    version: 1,
    app: { id: 'miru-chikara', title: 'みる ちから', icon: '👁️' },
    list() {
      const lv = { key: 'lv', label: 'むずかしさ', opts: [[1, 'やさしい'], [2, 'ふつう'], [3, 'むずかしい']], def: Number(S().level) || 1 }, an = { key: 'ans', label: 'こたえ', opts: [['off', 'なし'], ['on', 'あり']], def: 'off' };
      return [{ id: 'diff', name: 'まちがい さがし', icon: '🔍', params: [lv, an] }, { id: 'same', name: 'おなじ かたち', icon: '🧩', params: [lv, an] }, { id: 'dots', name: 'てん つなぎ', icon: '✏️', params: [lv, an] }, { id: 'line', name: 'せん たどり', icon: '〰️', params: [lv, an] }, { id: 'count', name: 'かず さがし', icon: '🔢', params: [lv, an] }];
    },
    build(id, params) { return Promise.resolve({ pages: buildPages(id, params), css: document.querySelector('style').textContent }); }
  };

  /* ============================================================
     先生用せってい
     ============================================================ */
  APP.renderSettings = function (add, st, vp, pidSel) {
    add(h('h3', null, '👁️ もんだい'),
      srow('むずかしさ', seg(st.level, [[1, 'やさしい'], [2, 'ふつう'], [3, 'むずかしい']], v => setS('level', Number(v)))),
      srow('1かいの もんだい', seg(st.qn, [[3, '3もん'], [4, '4もん'], [6, '6もん']], v => setS('qn', Number(v)))));
    add(h('h3', null, '📊 きろく'), pidSel());
    const log = vp.log.slice().reverse().slice(0, 40), LVN = ['', 'やさしい', 'ふつう', 'むずかしい'];
    add(log.length ? h('table', { class: 'rec-table' }, h('tr', null, ['日時', 'あそび', 'レベル', 'よく できた', 'じかん'].map(x => h('th', null, x))),
      log.map(r => { const d = new Date(r.t), g = GAMES.find(x => x.id === r.g); return h('tr', null, h('td', null, (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')), h('td', null, g ? g.e + ' ' + g.n : r.g), h('td', null, LVN[r.lv] || ''), h('td', null, r.ok + ' / ' + r.n), h('td', null, r.sec + 'びょう')); })) : h('p', { class: 'note' }, 'まだ きろくが ありません。'));
  };
  if (TEST) window.__mc = { store: () => store, startGame, G: () => G, genDiff, genSame, genDots, genLine, genCount, persist };
  startApp();
