  /* ============================================================
     🖨️ プリントの 画面（ほかの MieeL アプリと おなじ かたち：ひだりに せってい、みぎに A4 の みほん）
     みほんと おなじ ものが いんさつ されます。
     ============================================================ */
  const PrintUI = (function () {
    const MM = 96 / 25.4;
    let st = null, pages = [], custom = null;
    function types() { return window.MieelPrintAPI.list({ all: true }); }
    function ensure() {
      const list = types();
      if (!st || !list.some(t => t.id === st.type)) st = { type: list[0].id, v: {} };
      const t = list.find(x => x.id === st.type);
      t.params.forEach(p => { if (st.v[p.key] === undefined || !p.opts.some(o => String(o[0]) === String(st.v[p.key]))) st.v[p.key] = p.def; });
      return t;
    }
    function build() { ensure(); return window.MieelPrintAPI.build(st.type, Object.assign({}, st.v)).then(r => { pages = r.pages; }); }
    // きまった ページ（つくった はっぴょう など）を みほんつきで いんさつ
    function openPages(title, arr) { stopSpeak(); custom = { title, pages: arr }; pages = arr; $('#printModal').classList.add('open'); $('#printModal').scrollTop = 0; render(); }
    function open(type, preset) {
      stopSpeak(); custom = null;
      if (type) { ensure(); st.type = type; }
      if (preset) Object.assign(st.v, preset);
      $('#printModal').classList.add('open'); $('#printModal').scrollTop = 0;
      build().then(render);
    }
    function close() { $('#printModal').classList.remove('open'); }
    function render() {
      const t = custom ? null : ensure();
      const P = $('#printPanel'); P.innerHTML = '';
      const re = () => build().then(render);
      const seg = (label, cur, opts, on, cls) => [h('div', { class: 'seglabel' }, label), h('div', { class: 'seg' + (cls ? ' ' + cls : '') }, opts.map(o => h('button', { type: 'button', class: String(cur) === String(o[0]) ? 'on' : '', onclick: () => on(o[0]) }, o[1])))];
      const prev = h('div', { class: 'prprev' });
      P.append(
        h('div', { class: 'panel-head' }, h('h2', null, '🖨️ A4 プリント'), h('button', { type: 'button', class: 'btn ok', onclick: close }, 'とじる')),
        h('div', { class: 'prgrid' },
          custom ? h('div', { class: 'prctl' }, h('div', { class: 'seglabel' }, custom.title),
            h('div', { class: 'btns', style: 'margin-top:16px' }, h('button', { type: 'button', class: 'btn blue', onclick: doIt }, '🖨️ いんさつ する')),
            h('p', { class: 'note' }, 'いんさつの せってい：よう紙 A4・たて、よはく「なし」（または さいしょう）、「背景の グラフィック」オンが おすすめです。'))
          : h('div', { class: 'prctl' },
            seg('プリントの しゅるい', st.type, types().map(x => [x.id, (x.icon ? x.icon + ' ' : '') + x.name]), v => { st.type = v; re(); }, 'types'),
            t.params.map(p => p.opts.length > 6
              ? [h('div', { class: 'seglabel' }, p.label), h('select', { style: 'width:100%', onchange: e => { const o = p.opts.find(x => String(x[0]) === e.target.value); st.v[p.key] = o ? o[0] : e.target.value; re(); } }, p.opts.map(o => h('option', { value: String(o[0]), selected: String(o[0]) === String(st.v[p.key]) }, o[1])))]
              : seg(p.label, st.v[p.key], p.opts, v => { st.v[p.key] = v; re(); })),
            h('div', { class: 'btns', style: 'margin-top:16px' },
              window.MieelPrintAPI.fixed ? null : h('button', { type: 'button', class: 'btn', onclick: re }, '🔄 べつの もんだい'),
              h('button', { type: 'button', class: 'btn blue', onclick: doIt }, '🖨️ いんさつ する')),
            h('p', { class: 'note' }, 'いんさつの せってい：よう紙 A4・たて、よはく「なし」（または さいしょう）、「背景の グラフィック」オンが おすすめです。'),
            h('p', { class: 'note' }, pages.length + 'まい（みほんと おなじ ものが いんさつ されます）')),
          prev));
      const W = Math.max(240, (prev.clientWidth || 600) - 24), sc = Math.min(1, W / (210 * MM));
      pages.forEach(pg => {
        const w = h('div', { class: 'pwrap', style: 'width:' + (210 * MM * sc) + 'px;height:' + (297 * MM * sc) + 'px', html: pg });
        w.firstChild.style.transform = 'scale(' + sc + ')';
        prev.appendChild(w);
      });
    }
    function doIt() { const root = $('#printRoot'); root.innerHTML = pages.join(''); setTimeout(() => window.print(), 60); }
    window.addEventListener('afterprint', () => { $('#printRoot').innerHTML = ''; });
    $('#printModal').addEventListener('click', e => { if (e.target.id === 'printModal') close(); });
    $('#printBtn').addEventListener('click', () => { if (tapOk(500)) open(); });
    return { open, openPages, close };
  })();
