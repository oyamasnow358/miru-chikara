  /* ============================================================
     MieeL アプリ きょうつう（base.js）
     APP = { id, title, ls, db, defaults, newProfile(name, icon), normProfile(p), childScreens, topScreens,
             renderHome(), renderSettings(add, st, vp, refresh), onCloseSettings(screen) }
     ============================================================ */
  const $ = s => document.querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 10);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function load(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  const BASE_DEFAULTS = { voice: true, sound: true, volume: 0.8, rate: 0.95, calm: false };
  const ICONS = ['🐰', '🐻', '🐼', '🐱', '🐶', '🦊', '🐸', '🐧', '🐯', '🐨', '🐵', '🦁', '🐹', '🐮', '🐷', '🐤'];
  function normalize(s) {
    s = s && typeof s === 'object' ? s : {};
    const o = Object.assign({}, s, { profiles: Array.isArray(s.profiles) && s.profiles.length ? s.profiles : [APP.newProfile('みんな', '🐰')], currentId: s.currentId || null, settings: Object.assign({}, BASE_DEFAULTS, APP.defaults || {}, s.settings || {}) });
    o.profiles.forEach(p => { p.id = p.id || 'p' + uid(); p.name = p.name || 'なまえ'; p.icon = p.icon || '🐰'; if (APP.normProfile) APP.normProfile(p); });
    if (!o.profiles.some(p => p.id === o.currentId)) o.currentId = o.profiles[0].id;
    if (APP.normStore) APP.normStore(o);
    return o;
  }
  let store = normalize(load(APP.ls));
  const S = () => store.settings;
  let saveT = 0;
  function persist() { clearTimeout(saveT); if (!save(APP.ls, store)) toast('保存できませんでした（容量を確認してください）'); }
  function persistSoon() { clearTimeout(saveT); saveT = setTimeout(persist, 350); }
  const cur = () => store.profiles.find(p => p.id === store.currentId) || store.profiles[0];

  function h(tag, props) {
    const el = document.createElement(tag);
    if (props) Object.keys(props).forEach(k => {
      const v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'value') el.value = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    (function add(list) { list.forEach(c => { if (c === null || c === undefined || c === false) return; if (Array.isArray(c)) add(c); else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); }); })(Array.prototype.slice.call(arguments, 2));
    return el;
  }
  const E = (e, cls) => h('span', { class: 'emo' + (cls ? ' ' + cls : '') }, e);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let toastTimer = 0;
  function toast(m, ms) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms || 2600); }
  let lockUntil = 0;
  function tapOk(ms) { const n = Date.now(); if (n < lockUntil) return false; lockUntil = n + (ms || 350); return true; }
  let gen = 0; const timers = new Set(); let stops = [];
  function after(ms, fn) { const g = gen; const id = setTimeout(() => { timers.delete(id); if (g === gen) fn(); }, ms); timers.add(id); return id; }
  function every(ms, fn) { const g = gen; const id = setInterval(() => { if (g !== gen) { clearInterval(id); return; } fn(); }, ms); return id; }
  const wait = ms => new Promise(r => after(ms, r));
  function onStop(fn) { stops.push(fn); }
  function stopAll() { gen++; timers.forEach(clearTimeout); timers.clear(); const s = stops; stops = []; s.forEach(f => { try { f(); } catch (e) { /* 無視 */ } }); stopSpeak(); document.querySelectorAll('.ov').forEach(x => x.remove()); }
  function longPress(el, ms, fn) {
    let t = 0;
    el.addEventListener('pointerdown', e => { e.preventDefault(); el.classList.add('pressing'); t = setTimeout(() => { el.classList.remove('pressing'); fn(); }, ms); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, () => { clearTimeout(t); el.classList.remove('pressing'); }));
    el.addEventListener('contextmenu', e => e.preventDefault());
  }
  function quitBtn(fn, label) { const b = h('button', { type: 'button', class: 'quit', 'aria-label': 'とちゅうで おわる（ながおし）' }, h('i'), h('span', null, label || '✕ おわる（ながおし）')); longPress(b, 1500, fn); return b; }

  /* ---- 音・よみあげ ---- */
  let ac = null;
  function actx() { try { if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); } if (ac.state === 'suspended') ac.resume(); return ac; } catch (e) { return null; } }
  function audio() { return S().sound ? actx() : null; }
  function tone(f, st, dur, type, vol, f2) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + st, o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime((vol || .2) * S().volume, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .05);
  }
  const sfx = {
    tap() { tone(700, 0, .07, 'triangle', .13); },
    ok() { tone(880, 0, .12, 'triangle', .24); tone(1319, .09, .28, 'triangle', .2); },
    ng() { tone(330, 0, .16, 'sine', .14); tone(294, .12, .2, 'sine', .12); },
    step(i) { tone([659, 784, 880, 988, 1047, 1175][(i || 0) % 6], 0, .16, 'triangle', .2); },
    page() { tone(523, 0, .1, 'sine', .12, 784); },
    bell() { tone(1046, 0, 1.4, 'sine', .2); tone(1568, .02, 1.1, 'sine', .07); },
    clear() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .09, .28, 'triangle', .24)); }
  };
  const EMBED = /[?&]embed=1/.test(location.search);
  const TEST = /[?&]test=1/.test(location.search);
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let jaVoice = null;
  function loadVoice() { if (!canSpeak) return; const v = (speechSynthesis.getVoices() || []).filter(x => /^ja(-|_|$)/i.test(x.lang)); jaVoice = v.find(x => /Kyoko|O-ren|Otoya|Hattori|Nanami/i.test(x.name)) || v.find(x => x.localService) || v[0] || null; }
  function speak(text, opt) {
    opt = opt || {};
    if (!canSpeak || !S().voice || !text || EMBED) { if (opt.end) setTimeout(opt.end, 30); return null; }
    try {
      if (!opt.keep) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(jaSay(text)); u.lang = 'ja-JP'; u.rate = (Number(S().rate) || .95) * (opt.rate || 1); u.pitch = opt.pitch || 1.05; if (jaVoice) u.voice = jaVoice;
      if (opt.end) u.onend = opt.end;
      speechSynthesis.speak(u); return u;
    } catch (e) { if (opt.end) setTimeout(opt.end, 30); return null; }
  }
  function stopSpeak() { if (canSpeak) { try { speechSynthesis.cancel(); } catch (e) { /* 無視 */ } } }
  function praise(t) {
    if (document.body.classList.contains('calm')) return;
    const p = h('div', { class: 'praise' }, t || pick(['すごい！', 'できたね！', 'じょうず！', 'ばっちり！', 'いいね！', 'さすが！']));
    p.style.color = pick(['#F76707', '#E64980', '#1C7ED6', '#2F9E44', '#7048E8', '#F59F00']);
    document.body.appendChild(p); setTimeout(() => p.remove(), 1300);
  }
  let wake = null;
  async function keepAwake() { try { if ('wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) { /* 無視 */ } }
  FX.sound = () => S().sound; FX.volume = () => Number(S().volume) || 0.8;

  /* ---- しゃしん・ろくおん（この たんまつの IndexedDB だけ。おくらない） ---- */
  const DB = {
    db: null,
    open() { if (this.db) return Promise.resolve(this.db); return new Promise((res, rej) => { const r = indexedDB.open(APP.db || ('mieel-' + APP.id), 1); r.onupgradeneeded = () => r.result.createObjectStore('media', { keyPath: 'id' }); r.onsuccess = () => { this.db = r.result; res(this.db); }; r.onerror = () => rej(r.error); }); },
    async get(id) { const d = await this.open(); return new Promise((res, rej) => { const q = d.transaction('media').objectStore('media').get(id); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
    async all() { const d = await this.open(); return new Promise((res, rej) => { const q = d.transaction('media').objectStore('media').getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => rej(q.error); }); },
    async put(v) { const d = await this.open(); return new Promise((res, rej) => { const tx = d.transaction('media', 'readwrite'); tx.objectStore('media').put(v); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); },
    async del(id) { const d = await this.open(); return new Promise((res, rej) => { const tx = d.transaction('media', 'readwrite'); tx.objectStore('media').delete(id); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); },
    async clear() { const d = await this.open(); return new Promise((res, rej) => { const tx = d.transaction('media', 'readwrite'); tx.objectStore('media').clear(); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); }
  };
  const URLS = {};
  async function mediaURL(id) { if (!id) return null; if (URLS[id]) return URLS[id]; try { const m = await DB.get(id); if (!m) return null; URLS[id] = URL.createObjectURL(m.blob); return URLS[id]; } catch (e) { return null; } }
  function pickFile(accept, capture, multiple) {
    return new Promise(res => {
      const fi = $('#fileIn'); fi.value = ''; fi.accept = accept; fi.multiple = !!multiple;
      if (capture) fi.setAttribute('capture', capture); else fi.removeAttribute('capture');
      fi.onchange = () => res(fi.files && fi.files.length ? Array.from(fi.files) : null);
      fi.click();
    });
  }
  async function savePhoto(file, max) {
    const url = URL.createObjectURL(file), im = new Image(); im.src = url;
    await new Promise(r => { im.onload = r; im.onerror = r; });
    const k = Math.min(1, (max || 900) / Math.max(im.width || 1, im.height || 1)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round((im.width || 1) * k)); c.height = Math.max(1, Math.round((im.height || 1) * k));
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    const blob = await new Promise(r => c.toBlob(b => r(b), 'image/jpeg', 0.82));
    const id = 'm' + uid(); await DB.put({ id, blob, kind: 'img', at: Date.now() }); return id;
  }
  const blobToData = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.onerror = () => r(null); fr.readAsDataURL(b); });
  async function mediaData(id) { if (!id) return null; try { const m = await DB.get(id); return m ? await blobToData(m.blob) : null; } catch (e) { return null; } }
  // せんせいの こえ・こどもの こえを ろくおん（もういちど おすと とまる・さいだい 20びょう）
  let recorder = null;
  async function recordToggle(btn, done, maxSec) {
    if (recorder) { try { recorder.stop(); } catch (e) { /* 無視 */ } return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/mp4', 'audio/webm', ''].find(m => !m || (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)));
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); recorder = r;
      const chunks = [];
      r.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      r.onstop = async () => { stream.getTracks().forEach(t => t.stop()); if (btn) btn.classList.remove('on'); recorder = null; const blob = new Blob(chunks, { type: r.mimeType || 'audio/mp4' }); if (blob.size > 300) { const id = 'a' + uid(); await DB.put({ id, blob, kind: 'audio', at: Date.now() }); done(id); } };
      r.start(); if (btn) btn.classList.add('on'); toast('🔴 ろくおん ちゅう… もう いちど おすと とまります', 3000);
      setTimeout(() => { if (recorder === r) r.stop(); }, (maxSec || 20) * 1000);
    } catch (e) { recorder = null; toast('マイクが つかえません（マイクを 許可して ください）', 3500); }
  }
  let playing = null;
  async function playMedia(id, end) { const u = await mediaURL(id); if (!u) { if (end) end(); return false; } stopSpeak(); if (playing) playing.pause(); playing = new Audio(u); playing.onended = () => { playing = null; if (end) end(); }; try { await playing.play(); } catch (e) { if (end) end(); } return true; }
  function pic(it, cls) {
    const w = h('div', { class: 'pic' + (cls ? ' ' + cls : '') }, E(it && it.emoji || '📷'));
    if (it && it.media) mediaURL(it.media).then(u => { if (u) { w.innerHTML = ''; w.append(h('img', { src: u, alt: '' })); } });
    return w;
  }
  async function picHTML(it) { const d = it && it.media ? await mediaData(it.media) : null; return d ? '<img src="' + d + '" alt="">' : '<span class="pe">' + esc(it && it.emoji || '') + '</span>'; }

  /* ---- がめん・ヘッダー ---- */
  let screen = 'home';
  function setView(cls, children) { stopAll(); const v = $('#view'); v.innerHTML = ''; v.appendChild(h('section', { class: 'screen ' + cls }, children)); chips(); }
  function chips() {
    const p = cur(), c = $('#whoChip'), hb = $('#homeBtn'), child = (APP.childScreens || []).indexOf(screen) >= 0;
    if ($('#printBtn')) $('#printBtn').hidden = (APP.topScreens || ['home']).indexOf(screen) < 0;
    hb.hidden = screen === 'home' || screen === 'who';
    $('#homeLbl').textContent = child ? 'ながおし' : 'さいしょ';
    c.hidden = store.profiles.length < 2 || child || screen === 'who';
    c.innerHTML = ''; c.append(E(p.icon), p.name);
    if (APP.chips) APP.chips(screen);
  }
  function renderWho() {
    screen = 'who';
    setView('who home', [h('h1', { class: 'title' }, APP.whoTitle || 'だれが つかう？'), h('div', { class: 'menu' }, store.profiles.map(p => h('button', { type: 'button', class: 'mcard', style: '--c:' + (APP.color || '#1C7ED6'), onclick: () => { if (!tapOk()) return; sfx.tap(); speak(p.name); store.currentId = p.id; persist(); APP.renderHome(); } }, E(p.icon), h('b', null, p.name))))]);
  }
  (function () {
    const b = $('#homeBtn'); let t = 0;
    b.addEventListener('pointerdown', e => { e.preventDefault(); if ((APP.childScreens || []).indexOf(screen) < 0) return; b.classList.add('pressing'); t = setTimeout(() => { b.classList.remove('pressing'); APP.renderHome(); }, 1200); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { clearTimeout(t); b.classList.remove('pressing'); }));
    b.addEventListener('click', () => { if ((APP.childScreens || []).indexOf(screen) < 0 && tapOk()) { sfx.tap(); if (APP.beforeHome && APP.beforeHome() === false) return; APP.renderHome(); } });
    $('#whoChip').addEventListener('click', () => { if ((APP.childScreens || []).indexOf(screen) < 0) renderWho(); });
  })();

  /* ---- 先生用せってい ---- */
  function seg(value, opts, onPick) { return h('div', { class: 'seg' }, opts.map(o => h('button', { type: 'button', class: String(o[0]) === String(value) ? 'on' : '', onclick: () => onPick(o[0]) }, o[1]))); }
  const srow = (label, ctl, note) => h('div', { class: 'srow' }, h('div', null, label, note ? h('div', { class: 'note' }, note) : null), ctl);
  const chk = (label, k, note) => h('label', { class: 'row' }, h('span', null, label, note ? h('div', { class: 'note' }, note) : null), h('input', { type: 'checkbox', checked: !!S()[k], onchange: e => { S()[k] = e.target.checked; persist(); } }));
  let viewPid = null;
  function openSettings() { stopSpeak(); renderSettings(); $('#settings').classList.add('open'); $('#settings').scrollTop = 0; }
  function closeSettings() { persist(); $('#settings').classList.remove('open'); document.body.classList.toggle('calm', !!S().calm); if (APP.onCloseSettings) APP.onCloseSettings(screen); else if (screen === 'home') APP.renderHome(); chips(); }
  function refreshSettings() { const m = $('#settings'), y = m.scrollTop; renderSettings(); m.scrollTop = y; }
  const setS = (k, v) => { S()[k] = v; persist(); refreshSettings(); };
  function renderSettings() {
    const P = $('#settingsPanel'); P.innerHTML = '';
    const add = (...a) => P.append(...a.filter(Boolean));
    const st = S();
    if (!store.profiles.some(p => p.id === viewPid)) viewPid = store.currentId;
    const vp = store.profiles.find(p => p.id === viewPid);
    add(h('div', { class: 'panel-head' }, h('h2', null, '⚙️ 先生用せってい'), h('button', { type: 'button', class: 'btn ok', onclick: closeSettings }, '✓ とじる')),
      h('p', { class: 'note' }, 'この画面は 右上の ⚙️ を 1.5秒 ながおし すると ひらきます。変更は すぐに保存されます（この端末のみ）。'));
    add(h('h3', null, APP.profHead || '👦 つかう 子ども'));
    store.profiles.forEach((p, i) => add(h('div', { class: 'prow' },
      h('button', { type: 'button', class: 'mini-btn', onclick: () => { p.icon = ICONS[(ICONS.indexOf(p.icon) + 1) % ICONS.length]; persist(); refreshSettings(); } }, E(p.icon)),
      h('input', { type: 'text', value: p.name, style: 'flex:1;min-width:140px', oninput: e => { p.name = e.target.value; persistSoon(); } }),
      APP.profileNote ? h('span', { class: 'note' }, APP.profileNote(p)) : null,
      store.profiles.length > 1 ? h('button', { type: 'button', class: 'mini-btn warn', onclick: () => { if (confirm(p.name + ' を けしますか？（きろくも きえます）')) { store.profiles.splice(i, 1); if (store.currentId === p.id) store.currentId = store.profiles[0].id; persist(); refreshSettings(); } } }, 'けす') : null)));
    add(h('div', { class: 'btns' }, h('button', { type: 'button', class: 'btn primary', onclick: () => { const np = APP.newProfile('なまえ' + (store.profiles.length + 1), ICONS[store.profiles.length % ICONS.length]); if (APP.normProfile) APP.normProfile(np); store.profiles.push(np); viewPid = np.id; persist(); refreshSettings(); } }, '＋ ' + (APP.profWord || '子ども') + 'を ふやす')),
      h('p', { class: 'note' }, '2つ いじょう あると、はじめに「' + (APP.whoTitle || 'だれが つかう？') + '」が でます。'));
    const pidSel = () => store.profiles.length > 1 ? srow(APP.profWord || '子ども', h('select', { onchange: e => { viewPid = e.target.value; refreshSettings(); } }, store.profiles.map(p => h('option', { value: p.id, selected: p.id === viewPid }, p.name)))) : null;
    APP.renderSettings(add, st, vp, pidSel);
    add(h('h3', null, '🔊 おと・ひょうじ'), chk('よみあげ', 'voice'), chk('こうかおん', 'sound'),
      srow('おおきさ', h('input', { type: 'range', min: '0.2', max: '1', step: '0.1', value: st.volume, onchange: e => { st.volume = Number(e.target.value); persist(); } })),
      srow('よみあげの はやさ', seg(st.rate, [[0.8, 'ゆっくり'], [0.95, 'ふつう'], [1.1, 'はやめ']], v => setS('rate', Number(v)))),
      chk('うごきを ひかえめに（はなび なし）', 'calm'));
    if (window.MieelPrintAPI && $('#printBtn')) add(h('h3', null, '🖨️ プリント（A4）'),
      h('div', { class: 'btns' }, h('button', { type: 'button', class: 'btn primary', onclick: () => { closeSettings(); PrintUI.open(); } }, '🖨️ プリントの 画面を ひらく')),
      h('p', { class: 'note' }, '上の 🖨️ プリント ボタンからも ひらけます。みほんと おなじ ものが いんさつ されます。'));
    if (APP.db !== false) add(h('h3', null, '🔒 データ（この たんまつの なかだけ）'),
      h('p', { class: 'note' }, 'しゃしん・ろくおん・きろくは この たんまつ（ブラウザ）の なかだけに ほぞん され、インターネットには おくりません。ほかの たんまつへの いどうや バックアップは「ファイルに かきだす」で。'),
      h('div', { class: 'btns' }, h('button', { type: 'button', class: 'btn primary', onclick: exportData }, '⬇ ファイルに かきだす'), h('button', { type: 'button', class: 'btn', onclick: importData }, '⬆ ファイルから よみこむ')));
    if (APP.helpNote) add(h('h3', null, '💡 このアプリの かんがえかた'), h('p', { class: 'note' }, APP.helpNote));
    add(h('div', { class: 'btns', style: 'margin-top:20px' }, h('button', { type: 'button', class: 'btn ok', onclick: closeSettings }, '✓ とじる')));
    add(h('div', { class: 'mieel-foot' }, h('div', { class: 'mieel-brand' }, h('span', { class: 'orb-mini' }), h('strong', null, 'MieeL')),
      h('a', { href: 'https://www.mieel-support-school.com/', target: '_blank', rel: 'noopener' }, 'www.mieel-support-school.com'),
      h('div', null, '© ' + APP.title + '（特別支援教育向け）・学校や家庭での利用は自由です（無断転載・再配布・販売はお断り）')));
  }
  async function exportData() {
    const media = [];
    try { for (const m of await DB.all()) media.push({ id: m.id, kind: m.kind, at: m.at, data: await blobToData(m.blob) }); } catch (e) { /* 無視 */ }
    const blob = new Blob([JSON.stringify({ app: APP.id, v: 1, store, media })], { type: 'application/json' });
    const d = new Date(), name = APP.title.replace(/\s/g, '') + '_' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '.json';
    const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast('ファイルに かきだしました');
  }
  async function importData() {
    const fs = await pickFile('application/json,.json'); if (!fs) return;
    try {
      const j = JSON.parse(await fs[0].text());
      if (j.app !== APP.id) throw new Error('x');
      if (!confirm('いまの データを、この ファイルの なかみに おきかえますか？')) return;
      await DB.clear();
      for (const m of j.media || []) { const r = await fetch(m.data); await DB.put({ id: m.id, kind: m.kind, at: m.at || Date.now(), blob: await r.blob() }); }
      store = normalize(j.store); persist(); Object.keys(URLS).forEach(k => delete URLS[k]);
      toast('よみこみました'); refreshSettings(); APP.renderHome();
    } catch (e) { toast('この ファイルは よみこめません'); }
  }
  (function () {
    const g = $('#gear'); let t = 0;
    g.addEventListener('pointerdown', e => { e.preventDefault(); g.classList.add('pressing'); t = setTimeout(() => { g.classList.remove('pressing'); openSettings(); }, 1500); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => g.addEventListener(ev, () => { clearTimeout(t); g.classList.remove('pressing'); }));
    g.addEventListener('contextmenu', e => e.preventDefault());
    $('#settings').addEventListener('click', e => { if (e.target.id === 'settings') closeSettings(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopSpeak(); });
  })();
  function startApp() {
    document.body.classList.toggle('calm', !!S().calm);
    if (canSpeak) { loadVoice(); if ('onvoiceschanged' in speechSynthesis) speechSynthesis.onvoiceschanged = loadVoice; }
    if (APP.sw && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !EMBED) navigator.serviceWorker.register('sw.js').catch(() => {});
    if (store.profiles.length > 1 && !EMBED) renderWho(); else APP.renderHome();
  }
