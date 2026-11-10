// 發佈前執行：node tools/stamp.mjs
// 幫所有 JS / CSS 加上版本號（?v=…），避免手機瀏覽器一直用快取的舊檔案。
// 原理：index.html 的 import map 把每個模組對應到帶版本號的網址，
// 模組之間的相對 import 也會套用，不需要改任何 import 寫法。
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const now = new Date();
const pad = n => String(n).padStart(2, '0');
const version = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

// 1. 版本號檔案（設定頁顯示用）
writeFileSync(join(root, 'js/version.js'), `export const VERSION = '${version}';\n`);

// 2. 列出所有 ES 模組（inapp.js 是一般 script，另外處理）
const walk = dir => readdirSync(dir).flatMap(f => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
});
const modules = walk(join(root, 'js'))
  .map(p => './' + relative(root, p).replace(/\\/g, '/'))
  .filter(p => p !== './js/inapp.js')
  .sort();

const map = { imports: Object.fromEntries(modules.map(m => [m, `${m}?v=${version}`])) };

// 3. 更新 index.html
const file = join(root, 'index.html');
let html = readFileSync(file, 'utf8');
// main.js 是進入點（script src 直接帶版本號），不放進 import map
map.imports = Object.fromEntries(Object.entries(map.imports).filter(([k]) => k !== './js/main.js'));
const finalBlock = `<!-- importmap:start -->\n  <script type="importmap">\n${JSON.stringify(map, null, 2).replace(/^/gm, '  ')}\n  </script>\n  <!-- importmap:end -->`;
html = html.replace(/<!-- importmap:start -->[\s\S]*?<!-- importmap:end -->/, '@@IMPORTMAP@@');
html = html.replace(/(\.\/css\/style\.css|\.\/js\/inapp\.js|\.\/js\/main\.js)(\?v=[^"]*)?"/g, `$1?v=${version}"`);
html = html.replace('@@IMPORTMAP@@', finalBlock);
writeFileSync(file, html);

// 4. Service Worker 預先快取清單（網址要跟網頁實際請求的一模一樣，包含 ?v=）
const list = dir => readdirSync(join(root, dir)).filter(f => statSync(join(root, dir, f)).isFile());
const assets = [
  './',
  './manifest.webmanifest',
  `./css/style.css?v=${version}`,
  `./js/inapp.js?v=${version}`,
  ...modules.map(m => `${m}?v=${version}`),
  ...list('fonts').filter(f => f.endsWith('.woff2')).map(f => `./fonts/${f}`),
  ...list('icons').map(f => `./icons/${f}`),
  ...list('audio').filter(f => f.endsWith('.mp3')).map(f => `./audio/${f}?v=${version}`),
];
const swFile = join(root, 'sw.js');
const sw = readFileSync(swFile, 'utf8').replace(
  /\/\/ precache:start[\s\S]*?\/\/ precache:end/,
  `// precache:start\nconst VERSION = '${version}';\nconst ASSETS = ${JSON.stringify(assets, null, 2)};\n// precache:end`,
);
writeFileSync(swFile, sw);

console.log(`版本 ${version}，共 ${modules.length} 個模組，離線快取 ${assets.length} 個檔案`);
