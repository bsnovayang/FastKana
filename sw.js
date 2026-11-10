// Service Worker：把網站所有檔案存在手機上，沒網路也能用
// 下面 precache 區塊由 tools/stamp.mjs 自動產生，請勿手動修改
// precache:start
const VERSION = '20261110-0935';
const ASSETS = [
  "./",
  "./manifest.webmanifest",
  "./css/style.css?v=20261110-0935",
  "./js/inapp.js?v=20261110-0935",
  "./js/core/audio.js?v=20261110-0935",
  "./js/core/quiz.js?v=20261110-0935",
  "./js/core/settings.js?v=20261110-0935",
  "./js/core/speech.js?v=20261110-0935",
  "./js/core/stats.js?v=20261110-0935",
  "./js/core/storage.js?v=20261110-0935",
  "./js/data/kana.js?v=20261110-0935",
  "./js/main.js?v=20261110-0935",
  "./js/pwa.js?v=20261110-0935",
  "./js/state.js?v=20261110-0935",
  "./js/ui.js?v=20261110-0935",
  "./js/version.js?v=20261110-0935",
  "./js/views/home.js?v=20261110-0935",
  "./js/views/learn.js?v=20261110-0935",
  "./js/views/play.js?v=20261110-0935",
  "./js/views/result.js?v=20261110-0935",
  "./js/views/settings.js?v=20261110-0935",
  "./js/views/setup.js?v=20261110-0935",
  "./js/views/stats.js?v=20261110-0935",
  "./fonts/klee-one-600-kana.woff2",
  "./fonts/nunito-latin.woff2",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./audio/a.mp3?v=20261110-0935",
  "./audio/ba.mp3?v=20261110-0935",
  "./audio/be.mp3?v=20261110-0935",
  "./audio/bi.mp3?v=20261110-0935",
  "./audio/bo.mp3?v=20261110-0935",
  "./audio/bu.mp3?v=20261110-0935",
  "./audio/bya.mp3?v=20261110-0935",
  "./audio/byo.mp3?v=20261110-0935",
  "./audio/byu.mp3?v=20261110-0935",
  "./audio/cha.mp3?v=20261110-0935",
  "./audio/chi.mp3?v=20261110-0935",
  "./audio/cho.mp3?v=20261110-0935",
  "./audio/chu.mp3?v=20261110-0935",
  "./audio/da.mp3?v=20261110-0935",
  "./audio/de.mp3?v=20261110-0935",
  "./audio/do.mp3?v=20261110-0935",
  "./audio/e.mp3?v=20261110-0935",
  "./audio/fu.mp3?v=20261110-0935",
  "./audio/ga.mp3?v=20261110-0935",
  "./audio/ge.mp3?v=20261110-0935",
  "./audio/gi.mp3?v=20261110-0935",
  "./audio/go.mp3?v=20261110-0935",
  "./audio/gu.mp3?v=20261110-0935",
  "./audio/gya.mp3?v=20261110-0935",
  "./audio/gyo.mp3?v=20261110-0935",
  "./audio/gyu.mp3?v=20261110-0935",
  "./audio/ha.mp3?v=20261110-0935",
  "./audio/he.mp3?v=20261110-0935",
  "./audio/hi.mp3?v=20261110-0935",
  "./audio/ho.mp3?v=20261110-0935",
  "./audio/hya.mp3?v=20261110-0935",
  "./audio/hyo.mp3?v=20261110-0935",
  "./audio/hyu.mp3?v=20261110-0935",
  "./audio/i.mp3?v=20261110-0935",
  "./audio/ja.mp3?v=20261110-0935",
  "./audio/ji.mp3?v=20261110-0935",
  "./audio/jo.mp3?v=20261110-0935",
  "./audio/ju.mp3?v=20261110-0935",
  "./audio/ka.mp3?v=20261110-0935",
  "./audio/ke.mp3?v=20261110-0935",
  "./audio/ki.mp3?v=20261110-0935",
  "./audio/ko.mp3?v=20261110-0935",
  "./audio/ku.mp3?v=20261110-0935",
  "./audio/kya.mp3?v=20261110-0935",
  "./audio/kyo.mp3?v=20261110-0935",
  "./audio/kyu.mp3?v=20261110-0935",
  "./audio/ma.mp3?v=20261110-0935",
  "./audio/me.mp3?v=20261110-0935",
  "./audio/mi.mp3?v=20261110-0935",
  "./audio/mo.mp3?v=20261110-0935",
  "./audio/mu.mp3?v=20261110-0935",
  "./audio/mya.mp3?v=20261110-0935",
  "./audio/myo.mp3?v=20261110-0935",
  "./audio/myu.mp3?v=20261110-0935",
  "./audio/n.mp3?v=20261110-0935",
  "./audio/na.mp3?v=20261110-0935",
  "./audio/ne.mp3?v=20261110-0935",
  "./audio/ni.mp3?v=20261110-0935",
  "./audio/no.mp3?v=20261110-0935",
  "./audio/nu.mp3?v=20261110-0935",
  "./audio/nya.mp3?v=20261110-0935",
  "./audio/nyo.mp3?v=20261110-0935",
  "./audio/nyu.mp3?v=20261110-0935",
  "./audio/o.mp3?v=20261110-0935",
  "./audio/pa.mp3?v=20261110-0935",
  "./audio/pe.mp3?v=20261110-0935",
  "./audio/pi.mp3?v=20261110-0935",
  "./audio/po.mp3?v=20261110-0935",
  "./audio/pu.mp3?v=20261110-0935",
  "./audio/pya.mp3?v=20261110-0935",
  "./audio/pyo.mp3?v=20261110-0935",
  "./audio/pyu.mp3?v=20261110-0935",
  "./audio/ra.mp3?v=20261110-0935",
  "./audio/re.mp3?v=20261110-0935",
  "./audio/ri.mp3?v=20261110-0935",
  "./audio/ro.mp3?v=20261110-0935",
  "./audio/ru.mp3?v=20261110-0935",
  "./audio/rya.mp3?v=20261110-0935",
  "./audio/ryo.mp3?v=20261110-0935",
  "./audio/ryu.mp3?v=20261110-0935",
  "./audio/sa.mp3?v=20261110-0935",
  "./audio/se.mp3?v=20261110-0935",
  "./audio/sha.mp3?v=20261110-0935",
  "./audio/shi.mp3?v=20261110-0935",
  "./audio/sho.mp3?v=20261110-0935",
  "./audio/shu.mp3?v=20261110-0935",
  "./audio/so.mp3?v=20261110-0935",
  "./audio/su.mp3?v=20261110-0935",
  "./audio/ta.mp3?v=20261110-0935",
  "./audio/te.mp3?v=20261110-0935",
  "./audio/to.mp3?v=20261110-0935",
  "./audio/tsu.mp3?v=20261110-0935",
  "./audio/u.mp3?v=20261110-0935",
  "./audio/wa.mp3?v=20261110-0935",
  "./audio/wo.mp3?v=20261110-0935",
  "./audio/ya.mp3?v=20261110-0935",
  "./audio/yo.mp3?v=20261110-0935",
  "./audio/yu.mp3?v=20261110-0935",
  "./audio/za.mp3?v=20261110-0935",
  "./audio/ze.mp3?v=20261110-0935",
  "./audio/zo.mp3?v=20261110-0935",
  "./audio/zu.mp3?v=20261110-0935"
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
