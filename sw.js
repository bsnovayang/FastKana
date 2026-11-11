// Service Worker：把網站所有檔案存在手機上，沒網路也能用
// 下面 precache 區塊由 tools/stamp.mjs 自動產生，請勿手動修改
// precache:start
const VERSION = '20261111-1153';
const ASSETS = [
  "./",
  "./manifest.webmanifest",
  "./css/style.css?v=20261111-1153",
  "./js/inapp.js?v=20261111-1153",
  "./js/core/audio.js?v=20261111-1153",
  "./js/core/quiz.js?v=20261111-1153",
  "./js/core/settings.js?v=20261111-1153",
  "./js/core/speech.js?v=20261111-1153",
  "./js/core/stats.js?v=20261111-1153",
  "./js/core/storage.js?v=20261111-1153",
  "./js/data/kana.js?v=20261111-1153",
  "./js/data/origins.js?v=20261111-1153",
  "./js/data/strokes.js?v=20261111-1153",
  "./js/handwriting/canvas.js?v=20261111-1153",
  "./js/handwriting/recognizer.js?v=20261111-1153",
  "./js/main.js?v=20261111-1153",
  "./js/pwa.js?v=20261111-1153",
  "./js/state.js?v=20261111-1153",
  "./js/stroke.js?v=20261111-1153",
  "./js/ui.js?v=20261111-1153",
  "./js/version.js?v=20261111-1153",
  "./js/views/home.js?v=20261111-1153",
  "./js/views/learn.js?v=20261111-1153",
  "./js/views/play-write.js?v=20261111-1153",
  "./js/views/play.js?v=20261111-1153",
  "./js/views/result.js?v=20261111-1153",
  "./js/views/settings.js?v=20261111-1153",
  "./js/views/setup.js?v=20261111-1153",
  "./js/views/stats.js?v=20261111-1153",
  "./fonts/klee-one-600-kana.woff2",
  "./fonts/nunito-latin.woff2",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./audio/a.mp3?v=20261111-1153",
  "./audio/ba.mp3?v=20261111-1153",
  "./audio/be.mp3?v=20261111-1153",
  "./audio/bi.mp3?v=20261111-1153",
  "./audio/bo.mp3?v=20261111-1153",
  "./audio/bu.mp3?v=20261111-1153",
  "./audio/bya.mp3?v=20261111-1153",
  "./audio/byo.mp3?v=20261111-1153",
  "./audio/byu.mp3?v=20261111-1153",
  "./audio/cha.mp3?v=20261111-1153",
  "./audio/chi.mp3?v=20261111-1153",
  "./audio/cho.mp3?v=20261111-1153",
  "./audio/chu.mp3?v=20261111-1153",
  "./audio/da.mp3?v=20261111-1153",
  "./audio/de.mp3?v=20261111-1153",
  "./audio/do.mp3?v=20261111-1153",
  "./audio/e.mp3?v=20261111-1153",
  "./audio/fu.mp3?v=20261111-1153",
  "./audio/ga.mp3?v=20261111-1153",
  "./audio/ge.mp3?v=20261111-1153",
  "./audio/gi.mp3?v=20261111-1153",
  "./audio/go.mp3?v=20261111-1153",
  "./audio/gu.mp3?v=20261111-1153",
  "./audio/gya.mp3?v=20261111-1153",
  "./audio/gyo.mp3?v=20261111-1153",
  "./audio/gyu.mp3?v=20261111-1153",
  "./audio/ha.mp3?v=20261111-1153",
  "./audio/he.mp3?v=20261111-1153",
  "./audio/hi.mp3?v=20261111-1153",
  "./audio/ho.mp3?v=20261111-1153",
  "./audio/hya.mp3?v=20261111-1153",
  "./audio/hyo.mp3?v=20261111-1153",
  "./audio/hyu.mp3?v=20261111-1153",
  "./audio/i.mp3?v=20261111-1153",
  "./audio/ja.mp3?v=20261111-1153",
  "./audio/ji.mp3?v=20261111-1153",
  "./audio/jo.mp3?v=20261111-1153",
  "./audio/ju.mp3?v=20261111-1153",
  "./audio/ka.mp3?v=20261111-1153",
  "./audio/ke.mp3?v=20261111-1153",
  "./audio/ki.mp3?v=20261111-1153",
  "./audio/ko.mp3?v=20261111-1153",
  "./audio/ku.mp3?v=20261111-1153",
  "./audio/kya.mp3?v=20261111-1153",
  "./audio/kyo.mp3?v=20261111-1153",
  "./audio/kyu.mp3?v=20261111-1153",
  "./audio/ma.mp3?v=20261111-1153",
  "./audio/me.mp3?v=20261111-1153",
  "./audio/mi.mp3?v=20261111-1153",
  "./audio/mo.mp3?v=20261111-1153",
  "./audio/mu.mp3?v=20261111-1153",
  "./audio/mya.mp3?v=20261111-1153",
  "./audio/myo.mp3?v=20261111-1153",
  "./audio/myu.mp3?v=20261111-1153",
  "./audio/n.mp3?v=20261111-1153",
  "./audio/na.mp3?v=20261111-1153",
  "./audio/ne.mp3?v=20261111-1153",
  "./audio/ni.mp3?v=20261111-1153",
  "./audio/no.mp3?v=20261111-1153",
  "./audio/nu.mp3?v=20261111-1153",
  "./audio/nya.mp3?v=20261111-1153",
  "./audio/nyo.mp3?v=20261111-1153",
  "./audio/nyu.mp3?v=20261111-1153",
  "./audio/o.mp3?v=20261111-1153",
  "./audio/pa.mp3?v=20261111-1153",
  "./audio/pe.mp3?v=20261111-1153",
  "./audio/pi.mp3?v=20261111-1153",
  "./audio/po.mp3?v=20261111-1153",
  "./audio/pu.mp3?v=20261111-1153",
  "./audio/pya.mp3?v=20261111-1153",
  "./audio/pyo.mp3?v=20261111-1153",
  "./audio/pyu.mp3?v=20261111-1153",
  "./audio/ra.mp3?v=20261111-1153",
  "./audio/re.mp3?v=20261111-1153",
  "./audio/ri.mp3?v=20261111-1153",
  "./audio/ro.mp3?v=20261111-1153",
  "./audio/ru.mp3?v=20261111-1153",
  "./audio/rya.mp3?v=20261111-1153",
  "./audio/ryo.mp3?v=20261111-1153",
  "./audio/ryu.mp3?v=20261111-1153",
  "./audio/sa.mp3?v=20261111-1153",
  "./audio/se.mp3?v=20261111-1153",
  "./audio/sha.mp3?v=20261111-1153",
  "./audio/shi.mp3?v=20261111-1153",
  "./audio/sho.mp3?v=20261111-1153",
  "./audio/shu.mp3?v=20261111-1153",
  "./audio/so.mp3?v=20261111-1153",
  "./audio/su.mp3?v=20261111-1153",
  "./audio/ta.mp3?v=20261111-1153",
  "./audio/te.mp3?v=20261111-1153",
  "./audio/to.mp3?v=20261111-1153",
  "./audio/tsu.mp3?v=20261111-1153",
  "./audio/u.mp3?v=20261111-1153",
  "./audio/wa.mp3?v=20261111-1153",
  "./audio/wo.mp3?v=20261111-1153",
  "./audio/ya.mp3?v=20261111-1153",
  "./audio/yo.mp3?v=20261111-1153",
  "./audio/yu.mp3?v=20261111-1153",
  "./audio/za.mp3?v=20261111-1153",
  "./audio/ze.mp3?v=20261111-1153",
  "./audio/zo.mp3?v=20261111-1153",
  "./audio/zu.mp3?v=20261111-1153"
];
// precache:end

const CACHE = `fastkana-${VERSION}`;
const APP_PATH = new URL('./', self.location).pathname; // 例如 /FastKana/

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

  // App 首頁：先抓網路（才能拿到新版），沒網路用快取
  // 只處理 App 本身，其他網頁（例如 voice-test/）照一般方式載入，避免蓋掉離線用的首頁
  if (req.mode === 'navigate') {
    if (url.pathname === APP_PATH || url.pathname === `${APP_PATH}index.html`) {
      event.respondWith(networkFirst(req, './'));
    }
    return;
  }

  // 其他檔案：快取裡有就用；沒有就抓網路，只有帶版本號（?v=）的 App 檔案才存起來
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && url.searchParams.has('v')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
