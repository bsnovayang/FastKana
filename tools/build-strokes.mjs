// 從 KanjiVG 下載假名筆順，轉成 js/data/strokes.js：node tools/build-strokes.mjs
// KanjiVG © Ulrich Apel，CC BY-SA 3.0（https://kanjivg.tagaini.net/）
// 轉換後的 strokes.js 依同樣授權（CC BY-SA 3.0）釋出。
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KANA } from '../js/data/kana.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/';

// 所有用到的單一字元（拗音拆成兩個字）
const chars = [...new Set(KANA.flatMap(k => [...k.hira, ...k.kata]))];

// 數字只留 1 位小數，縮小檔案
const shrink = d => d.replace(/-?\d*\.\d+/g, n => String(Math.round(parseFloat(n) * 10) / 10));

async function fetchSvg(ch) {
  const hex = ch.codePointAt(0).toString(16).padStart(5, '0');
  for (let i = 1; i <= 3; i++) {
    const r = await fetch(`${BASE}${hex}.svg`);
    if (r.ok) return r.text();
    if (r.status === 404) throw new Error(`KanjiVG 沒有 ${ch}（${hex}）`);
    await new Promise(res => setTimeout(res, 1000 * i));
  }
  throw new Error(`下載 ${ch} 失敗`);
}

const out = {};
for (const ch of chars) {
  const svg = await fetchSvg(ch);
  // 筆畫：<path id="kvg:03042-s1" ... d="..."/>，依 s 編號排序
  const paths = [...svg.matchAll(/<path\b[^>]*>/g)]
    .map(m => m[0])
    .map(tag => ({
      n: Number((tag.match(/id="kvg:[0-9a-f]+-s(\d+)"/) || [])[1]),
      d: (tag.match(/\sd="([^"]+)"/) || [])[1],
    }))
    .filter(p => p.n && p.d)
    .sort((a, b) => a.n - b.n)
    .map(p => shrink(p.d));
  // 筆畫編號的位置：<text transform="matrix(1 0 0 1 x y)">n</text>
  const nums = [...svg.matchAll(/<text transform="matrix\(1 0 0 1 ([\d.-]+) ([\d.-]+)\)">(\d+)<\/text>/g)]
    .sort((a, b) => a[3] - b[3])
    .map(m => [Math.round(m[1] * 10) / 10, Math.round(m[2] * 10) / 10]);
  if (!paths.length) throw new Error(`${ch} 沒有筆畫資料`);
  out[ch] = { p: paths, n: nums };
  process.stdout.write(`${ch}${paths.length} `);
}

const header = `// 假名筆順資料（由 tools/build-strokes.mjs 自動產生，請勿手動修改）
// 來源：KanjiVG © Ulrich Apel，CC BY-SA 3.0 — https://kanjivg.tagaini.net/
// 本檔依 CC BY-SA 3.0 授權釋出。
// 格式：{ 字: { p: [每一筆的 SVG path，依筆順], n: [[筆畫編號 x, y], …] } }，座標系 109×109
`;
writeFileSync(join(root, 'js/data/strokes.js'), `${header}export const STROKES = ${JSON.stringify(out)};\n`);
console.log(`\n完成：${Object.keys(out).length} 個字`);
