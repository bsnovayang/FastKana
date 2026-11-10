// 產生音檔檢查頁 voice-test/index.html：node tools/review-page.mjs
// 用五十音表排列全部音檔，點一下播放，方便逐一確認發音
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GROUPS } from '../js/data/kana.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'voice-test');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const v = Date.now();

const table = g => `<h2>${g.name}</h2><div class="grid" style="--cols:${g.cols}">${
  g.rows.flatMap(r => r.cells.map(k => k
    ? `<button data-f="${k.romaji[0]}"><b>${k.hira}</b><span>${k.romaji[0]}</span></button>`
    : '<i></i>')).join('')}</div>`;

writeFileSync(join(out, 'index.html'), `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>音檔檢查</title>
<style>
  :root { --bg:#F7F3EC; --card:#FFFDF9; --line:#E2DACD; --ink:#2D2A26; --ink2:#6B645A; --accent:#2F5D8A; --soft:#E3ECF5; }
  @media (prefers-color-scheme: dark) { :root { --bg:#1B1A18; --card:#252320; --line:#3A3631; --ink:#ECE6DC; --ink2:#B3AB9E; --accent:#7FA9D6; --soft:#22303F; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 -apple-system, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif; }
  main { max-width: 560px; margin: 0 auto; padding: 24px 16px 48px; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  h2 { margin: 24px 0 8px; font-size: 16px; color: var(--ink2); }
  p { color: var(--ink2); margin: 0; }
  .grid { display: grid; grid-template-columns: repeat(var(--cols), 1fr); gap: 6px; }
  button { aspect-ratio: 1.1; border: 1px solid var(--line); border-radius: 12px; background: var(--card); color: var(--ink);
    display: flex; flex-direction: column; align-items: center; justify-content: center; font: inherit; cursor: pointer; padding: 0; }
  button b { font-size: 26px; font-weight: 500; line-height: 1.1; font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif; }
  button span { font-size: 12px; color: var(--ink2); }
  button.on { border-color: var(--accent); background: var(--soft); }
  .grid[style*="--cols:3"] button { aspect-ratio: 1.7; }
  .play-all { margin-top: 12px; padding: 10px 16px; border: 0; border-radius: 12px; background: var(--accent); color: #fff; font-weight: 800; aspect-ratio: auto; flex-direction: row; }
</style></head>
<body><main>
  <h1>音檔檢查</h1>
  <p>Google Gemini TTS（Kore）。點假名播放，聽到念錯或不清楚的請記下來。</p>
  <button class="play-all" id="all">▶ 依序全部播放</button>
  ${GROUPS.map(table).join('\n  ')}
</main>
<script>
  const a = new Audio();
  let stop = false;
  const play = (b) => new Promise(res => {
    document.querySelectorAll('button.on').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    a.src = '../audio/' + b.dataset.f + '.mp3?r=${v}';
    a.onended = () => setTimeout(res, 350);
    a.onerror = res;
    a.play().catch(res);
  });
  document.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'all') {
      stop = !stop ? false : true;
      for (const x of document.querySelectorAll('button[data-f]')) { if (stop) break; await play(x); }
      return;
    }
    stop = true;
    play(b);
  });
</script>
</body></html>
`);
console.log('完成：voice-test/index.html');
