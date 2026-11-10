// 產生聲音試聽比較頁 voice-test/：node tools/voice-test.mjs
// 需求：VOICEVOX 開著。產生後可推上 GitHub Pages，讓朋友用手機聽：/FastKana/voice-test/
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KANA_BY_CHAR } from '../js/data/kana.js';
import { synth, normalize, concat, toMp3, speakers } from './voicevox.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'voice-test');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 摩擦音、塞擦音最容易聽出「糊」
const SAMPLE = ['あ', 'さ', 'し', 'す', 'つ', 'ち', 'ふ', 'しゃ', 'ちゅ', 'ん'];
const VOICES = [
  [30, '高音質（96kbps）'],
  [29, ''],
  [14, ''],
  [16, ''],
  [23, ''],
  [8, ''],
  [11, '男聲'],
];

const names = new Map();
for (const sp of await speakers()) for (const st of sp.styles) names.set(st.id, `${sp.name}（${st.name}）`);

const cards = [];

// 1) 目前網站用的檔案（MP3 直接串接）
const current = Buffer.concat(SAMPLE.map(c => readFileSync(join(root, 'audio', `${KANA_BY_CHAR.get(c).kana.romaji[0]}.mp3`))));
writeFileSync(join(out, 'current.mp3'), current);
cards.push({ file: 'current.mp3', title: '目前網站的聲音', sub: 'No.7（アナウンス）・48kbps', tag: '對照' });

// 2) 同一個聲音的無壓縮原音（WAV）：跟 1 比較，就知道是不是壓縮造成的
async function render(speaker) {
  const parts = [];
  let rate = 24000;
  for (const c of SAMPLE) {
    const r = await synth(KANA_BY_CHAR.get(c).kana.kata, { speaker });
    rate = r.rate;
    parts.push(normalize(r.samples));
  }
  return { rate, samples: concat(parts, rate, 0.45) };
}
function wav({ rate, samples }) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + samples.length * 2, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(samples.length * 2, 40);
  return Buffer.concat([h, Buffer.from(samples.buffer)]);
}
const no7 = await render(30);
writeFileSync(join(out, 'no7-raw.wav'), wav(no7));
cards.push({ file: 'no7-raw.wav', title: names.get(30), sub: '無壓縮原音', tag: '原音' });

// 3) 各個聲音，96kbps MP3
for (const [id, note] of VOICES) {
  const r = id === 30 ? no7 : await render(id);
  const file = `v${id}.mp3`;
  writeFileSync(join(out, file), toMp3(r.samples, r.rate, 96));
  cards.push({ file, title: names.get(id) || `#${id}`, sub: note || '96kbps' });
  console.log('✔', names.get(id));
}

const html = `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>聲音試聽</title>
<style>
  :root { --bg:#F7F3EC; --card:#FFFDF9; --line:#E2DACD; --ink:#2D2A26; --ink2:#6B645A; --accent:#2F5D8A; --soft:#E3ECF5; }
  @media (prefers-color-scheme: dark) { :root { --bg:#1B1A18; --card:#252320; --line:#3A3631; --ink:#ECE6DC; --ink2:#B3AB9E; --accent:#7FA9D6; --soft:#22303F; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 -apple-system, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif; }
  main { max-width: 560px; margin: 0 auto; padding: 24px 16px 40px; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  p { color: var(--ink2); margin: 0 0 16px; }
  .kana { font-size: 20px; color: var(--ink); letter-spacing: .1em; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; margin-bottom: 12px; }
  .head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
  .no { flex: none; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; background: var(--soft); color: var(--accent); font-weight: 800; font-size: 14px; }
  .title { font-weight: 800; }
  .sub { font-size: 13px; color: var(--ink2); }
  .tag { margin-left: auto; font-size: 12px; font-weight: 800; padding: 1px 8px; border-radius: 99px; background: var(--soft); color: var(--accent); }
  audio { width: 100%; }
</style></head>
<body><main>
  <h1>聲音試聽</h1>
  <p>每段都會念：<span class="kana">${SAMPLE.join('、')}</span><br>
  請用手機喇叭（或平常用的耳機）聽，告訴我哪個編號最清楚、最標準。<br>
  也請比較 1 和 2：如果 2 明顯比較清楚，代表是壓縮造成的。</p>
  ${cards.map((c, i) => `<section class="card">
    <div class="head"><span class="no">${i + 1}</span><span><span class="title">${c.title}</span><br><span class="sub">${c.sub}</span></span>${c.tag ? `<span class="tag">${c.tag}</span>` : ''}</div>
    <audio controls preload="none" src="${c.file}"></audio>
  </section>`).join('\n  ')}
  <p style="margin-top:24px;font-size:13px">聲音：VOICEVOX（${[...new Set(cards.slice(1).map(c => c.title.replace(/（.*$/, '')))].map(n => `VOICEVOX:${n}`).join('、')}）</p>
</main></body></html>`;
writeFileSync(join(out, 'index.html'), html);
console.log(`\n完成：voice-test/index.html（${cards.length} 段）`);
