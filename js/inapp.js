// 偵測 App 內建瀏覽器（LINE / Facebook / Instagram）
// 這些瀏覽器常常不支援語音，所以請使用者改用手機的預設瀏覽器。
// 用一般 script（非 module）放在 <head>，越早跳轉越好。
(function () {
  var ua = navigator.userAgent || '';
  var isLine = /\bLine\//i.test(ua);
  var isFb = /FBAN|FBAV|FB_IAB|Messenger/i.test(ua);
  var isIg = /Instagram/i.test(ua);
  var url;
  try { url = new URL(location.href); } catch (e) { return; }
  var KEY = 'openExternalBrowser';

  // LINE：加上 openExternalBrowser=1，LINE 會改用預設瀏覽器開啟（LINE 官方支援的參數）
  if (isLine && !url.searchParams.has(KEY)) {
    url.searchParams.set(KEY, '1');
    location.replace(url.toString());
    return;
  }

  // 已經在一般瀏覽器：把網址上的參數拿掉，看起來比較乾淨
  if (!isLine && url.searchParams.has(KEY)) {
    url.searchParams.delete(KEY);
    history.replaceState(null, '', url.toString());
  }

  if (!isLine && !isFb && !isIg) return;

  // 自動跳轉沒成功（或是 FB / IG）時，顯示提示條
  var app = isLine ? 'LINE' : isIg ? 'Instagram' : 'Facebook';
  var how = isLine
    ? '請點右上角選單「⋯」，選「用預設瀏覽器開啟」。'
    : '請點右上角「⋯」，選「在瀏覽器中開啟」。';

  function show() {
    var bar = document.createElement('div');
    bar.className = 'inapp-bar';
    bar.setAttribute('role', 'alert');
    bar.innerHTML =
      '<div class="inapp-text"><b>建議用手機瀏覽器開啟</b>' +
      '<span>' + app + ' 內建的瀏覽器可能沒有發音。' + how + '</span></div>' +
      '<div class="inapp-actions">' +
      '<button type="button" class="inapp-copy">複製網址</button>' +
      '<button type="button" class="inapp-close" aria-label="關閉">✕</button></div>';
    document.body.appendChild(bar);

    var clean = new URL(location.href);
    clean.searchParams.delete(KEY);
    bar.querySelector('.inapp-copy').addEventListener('click', function (e) {
      var btn = e.currentTarget;
      var done = function () { btn.textContent = '已複製'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(clean.toString()).then(done, function () { prompt('請複製網址：', clean.toString()); });
      } else {
        prompt('請複製網址：', clean.toString());
      }
    });
    bar.querySelector('.inapp-close').addEventListener('click', function () { bar.remove(); });
  }

  if (document.body) show();
  else document.addEventListener('DOMContentLoaded', show);
})();
