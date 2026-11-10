// Service Worker：把網站所有檔案存在手機上，沒網路也能用
// 下面 precache 區塊由 tools/stamp.mjs 自動產生，請勿手動修改
// precache:start
const VERSION = '20261110-1006';
const ASSETS = [
  "./",
  "./manifest.webmanifest",
  "./css/style.css?v=20261110-1006",
  "./js/inapp.js?v=20261110-1006",
  "./js/core/audio.js?v=20261110-1006",
  "./js/core/quiz.js?v=20261110-1006",
  "./js/core/settings.js?v=20261110-1006",
  "./js/core/speech.js?v=20261110-1006",
  "./js/core/stats.js?v=20261110-1006",
  "./js/core/storage.js?v=20261110-1006",
  "./js/data/kana.js?v=20261110-1006",
  "./js/data/strokes.js?v=20261110-1006",
  "./js/handwriting/canvas.js?v=20261110-1006",
  "./js/handwriting/recognizer.js?v=20261110-1006",
  "./js/main.js?v=20261110-1006",
  "./js/pwa.js?v=20261110-1006",
  "./js/state.js?v=20261110-1006",
  "./js/stroke.js?v=20261110-1006",
  "./js/ui.js?v=20261110-1006",
  "./js/version.js?v=20261110-1006",
  "./js/views/home.js?v=20261110-1006",
  "./js/views/learn.js?v=20261110-1006",
  "./js/views/play-write.js?v=20261110-1006",
  "./js/views/play.js?v=20261110-1006",
  "./js/views/result.js?v=20261110-1006",
  "./js/views/settings.js?v=20261110-1006",
  "./js/views/setup.js?v=20261110-1006",
  "./js/views/stats.js?v=20261110-1006",
  "./fonts/klee-one-600-kana.woff2",
  "./fonts/nunito-latin.woff2",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./audio/a.mp3?v=20261110-1006",
  "./audio/ba.mp3?v=20261110-1006",
  "./audio/be.mp3?v=20261110-1006",
  "./audio/bi.mp3?v=20261110-1006",
  "./audio/bo.mp3?v=20261110-1006",
  "./audio/bu.mp3?v=20261110-1006",
  "./audio/bya.mp3?v=20261110-1006",
  "./audio/byo.mp3?v=20261110-1006",
  "./audio/byu.mp3?v=20261110-1006",
  "./audio/cha.mp3?v=20261110-1006",
  "./audio/chi.mp3?v=20261110-1006",
  "./audio/cho.mp3?v=20261110-1006",
  "./audio/chu.mp3?v=20261110-1006",
  "./audio/da.mp3?v=20261110-1006",
  "./audio/de.mp3?v=20261110-1006",
  "./audio/do.mp3?v=20261110-1006",
  "./audio/e.mp3?v=20261110-1006",
  "./audio/fu.mp3?v=20261110-1006",
  "./audio/ga.mp3?v=20261110-1006",
  "./audio/ge.mp3?v=20261110-1006",
  "./audio/gi.mp3?v=20261110-1006",
  "./audio/go.mp3?v=20261110-1006",
  "./audio/gu.mp3?v=20261110-1006",
  "./audio/gya.mp3?v=20261110-1006",
  "./audio/gyo.mp3?v=20261110-1006",
  "./audio/gyu.mp3?v=20261110-1006",
  "./audio/ha.mp3?v=20261110-1006",
  "./audio/he.mp3?v=20261110-1006",
  "./audio/hi.mp3?v=20261110-1006",
  "./audio/ho.mp3?v=20261110-1006",
  "./audio/hya.mp3?v=20261110-1006",
  "./audio/hyo.mp3?v=20261110-1006",
  "./audio/hyu.mp3?v=20261110-1006",
  "./audio/i.mp3?v=20261110-1006",
  "./audio/ja.mp3?v=20261110-1006",
  "./audio/ji.mp3?v=20261110-1006",
  "./audio/jo.mp3?v=20261110-1006",
  "./audio/ju.mp3?v=20261110-1006",
  "./audio/ka.mp3?v=20261110-1006",
  "./audio/ke.mp3?v=20261110-1006",
  "./audio/ki.mp3?v=20261110-1006",
  "./audio/ko.mp3?v=20261110-1006",
  "./audio/ku.mp3?v=20261110-1006",
  "./audio/kya.mp3?v=20261110-1006",
  "./audio/kyo.mp3?v=20261110-1006",
  "./audio/kyu.mp3?v=20261110-1006",
  "./audio/ma.mp3?v=20261110-1006",
  "./audio/me.mp3?v=20261110-1006",
  "./audio/mi.mp3?v=20261110-1006",
  "./audio/mo.mp3?v=20261110-1006",
  "./audio/mu.mp3?v=20261110-1006",
  "./audio/mya.mp3?v=20261110-1006",
  "./audio/myo.mp3?v=20261110-1006",
  "./audio/myu.mp3?v=20261110-1006",
  "./audio/n.mp3?v=20261110-1006",
  "./audio/na.mp3?v=20261110-1006",
  "./audio/ne.mp3?v=20261110-1006",
  "./audio/ni.mp3?v=20261110-1006",
  "./audio/no.mp3?v=20261110-1006",
  "./audio/nu.mp3?v=20261110-1006",
  "./audio/nya.mp3?v=20261110-1006",
  "./audio/nyo.mp3?v=20261110-1006",
  "./audio/nyu.mp3?v=20261110-1006",
  "./audio/o.mp3?v=20261110-1006",
  "./audio/pa.mp3?v=20261110-1006",
  "./audio/pe.mp3?v=20261110-1006",
  "./audio/pi.mp3?v=20261110-1006",
  "./audio/po.mp3?v=20261110-1006",
  "./audio/pu.mp3?v=20261110-1006",
  "./audio/pya.mp3?v=20261110-1006",
  "./audio/pyo.mp3?v=20261110-1006",
  "./audio/pyu.mp3?v=20261110-1006",
  "./audio/ra.mp3?v=20261110-1006",
  "./audio/re.mp3?v=20261110-1006",
  "./audio/ri.mp3?v=20261110-1006",
  "./audio/ro.mp3?v=20261110-1006",
  "./audio/ru.mp3?v=20261110-1006",
  "./audio/rya.mp3?v=20261110-1006",
  "./audio/ryo.mp3?v=20261110-1006",
  "./audio/ryu.mp3?v=20261110-1006",
  "./audio/sa.mp3?v=20261110-1006",
  "./audio/se.mp3?v=20261110-1006",
  "./audio/sha.mp3?v=20261110-1006",
  "./audio/shi.mp3?v=20261110-1006",
  "./audio/sho.mp3?v=20261110-1006",
  "./audio/shu.mp3?v=20261110-1006",
  "./audio/so.mp3?v=20261110-1006",
  "./audio/su.mp3?v=20261110-1006",
  "./audio/ta.mp3?v=20261110-1006",
  "./audio/te.mp3?v=20261110-1006",
  "./audio/to.mp3?v=20261110-1006",
  "./audio/tsu.mp3?v=20261110-1006",
  "./audio/u.mp3?v=20261110-1006",
  "./audio/wa.mp3?v=20261110-1006",
  "./audio/wo.mp3?v=20261110-1006",
  "./audio/ya.mp3?v=20261110-1006",
  "./audio/yo.mp3?v=20261110-1006",
  "./audio/yu.mp3?v=20261110-1006",
  "./audio/za.mp3?v=20261110-1006",
  "./audio/ze.mp3?v=20261110-1006",
  "./audio/zo.mp3?v=20261110-1006",
  "./audio/zu.mp3?v=20261110-1006"
];
// precache:end

const CACHE = `fastkana-${VERSION}`;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('fastkana-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 有網路時最多等 3 秒，超過或失敗就用快取
function networkFirst(request, key) {
  return new Promise(resolve => {
    let settled = false;
    const fallback = () => caches.match(key, { ignoreSearch: true }).then(hit => {
      if (!settled && hit) { settled = true; resolve(hit); }
      return hit;
    });
    const timer = setTimeout(fallback, 3000);
    fetch(request)
      .then(res => {
        clearTimeout(timer);
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(key, copy));
        }
        if (!settled) { settled = true; resolve(res); }
      })
      .catch(() => {
        clearTimeout(timer);
        fallback().then(hit => {
          if (!settled) { settled = true; resolve(hit || Response.error()); }
        });
      });
  });
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 網頁本身：先抓網路（才能拿到新版），沒網路用快取
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, './'));
    return;
  }

  // 其他檔案：網址都帶版本號，直接用快取，沒有才抓網路並存起來
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
