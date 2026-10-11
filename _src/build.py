# _src の ファイルを くみあわせて index.html（と sw.js）を つくる
#   template.html … きょうつうの わく / base.css・base.js・fx.js・printui.* … きょうつうの ぶひん
#   app.json … { title, short, theme, sw } / app.css / app.js（/*BASE_HERE*/ の ところに きょうつうの ぶひんが はいる）
import io, os, json, hashlib
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda n: io.open(os.path.join(here, n), encoding='utf-8').read()
cfg = json.loads(rd('app.json'))
js = rd('app.js')
assert '/*BASE_HERE*/' in js
js = js.replace('/*BASE_HERE*/', rd('fx.js').strip() + '\n' + rd('base.js') + '\n' + rd('printui.js'))
out = rd('template.html')
for k, v in [('{{TITLE}}', cfg['title']), ('{{SHORT}}', cfg['short']), ('{{THEME}}', cfg['theme'])]:
    out = out.replace(k, v)
out = out.replace('/*BASE_CSS*/', rd('base.css')).replace('/*PRINTUI_CSS*/', rd('printui.css')).replace('/*APP_CSS*/', rd('app.css')).replace('/*APP_JS*/', js)
root = os.path.join(here, '..')
io.open(os.path.join(root, 'index.html'), 'w', encoding='utf-8', newline='\n').write(out)
if cfg.get('sw'):
    ver = hashlib.md5(out.encode('utf-8')).hexdigest()[:10]
    p = cfg['sw']
    sw = ("// オフラインでも つかえるように（しゃしんなどの データは この たんまつの IndexedDB に あり、ここでは あつかわない）\n"
          "const CACHE = '" + p + "-" + ver + "';\n"
          "self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'index.html'])).then(() => self.skipWaiting())); });\n"
          "self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('" + p + "-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });\n"
          "self.addEventListener('fetch', e => { const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return; e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); return res; }).catch(() => caches.match(r, { ignoreSearch: true }).then(x => x || caches.match('index.html')))); });\n")
    io.open(os.path.join(root, 'sw.js'), 'w', encoding='utf-8', newline='\n').write(sw)
print('built', len(out))
