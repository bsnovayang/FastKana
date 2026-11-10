// 用「模擬手寫」測試辨識準確度、調整門檻：node tools/test-recognizer.mjs
// 模擬手寫 = 標準筆畫 + 隨機縮放 / 傾斜 / 旋轉 / 位移 + 每筆彎曲 + 點抖動
import { KANA } from '../js/data/kana.js';
import { template, rank, judge, ACCEPT } from '../js/handwriting/recognizer.js';

const SAMPLES = Number(process.env.SAMPLES || 15);
let seed = 42;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
const range = (a, b) => a + (b - a) * rnd();

function distort(strokes, level = 1) {
  const sx = range(1 - 0.18 * level, 1 + 0.18 * level), sy = range(1 - 0.18 * level, 1 + 0.18 * level);
  const sh = range(-0.15, 0.15) * level, rot = range(-0.12, 0.12) * level;
  const tx = range(-10, 10), ty = range(-10, 10);
  const c = Math.cos(rot), s = Math.sin(rot);
  return strokes.map(st => {
    // 每一筆各自的小彎曲與位移
    const bx = gauss() * 2.5 * level, by = gauss() * 2.5 * level, bend = gauss() * 3 * level;
    return st.map((p, i) => {
      const t = st.length > 1 ? i / (st.length - 1) : 0;
      let x = p.x - 54.5, y = p.y - 54.5;
      x = x * sx + y * sh; y = y * sy;
      [x, y] = [x * c - y * s, x * s + y * c];
      const w = Math.sin(Math.PI * t) * bend;
      return { x: x + 54.5 + tx + bx + w + gauss() * 0.8 * level, y: y + 54.5 + ty + by + w * 0.5 + gauss() * 0.8 * level };
    });
  });
}

for (const script of ['hira', 'kata']) {
  const chars = KANA.filter(k => k.group !== 'yoon').map(k => k[script]);
  for (const level of [1, 1.6]) {
    let ok = 0, unsure = 0, ng = 0, top1 = 0, n = 0;
    const dCorrect = [], confusions = new Map();
    for (const ch of chars) {
      for (let i = 0; i < SAMPLES; i++) {
        const strokes = distort(template(ch).strokes, level);
        const r = judge(strokes, ch, chars);
        n++;
        if (r.pos === 0) top1++;
        dCorrect.push(r.dTarget);
        if (r.result === 'ok') ok++;
        else if (r.result === 'unsure') unsure++;
        else { ng++; const k = `${ch}→${r.best}`; confusions.set(k, (confusions.get(k) || 0) + 1); }
      }
    }
    // 寫錯字的情況：寫 A，題目是 B（B 是別的字）→ 應該判 ng，不可以判 ok
    let falseOk = 0, m = 0;
    for (const ch of chars) {
      const strokes = distort(template(ch).strokes, level);
      const list = rank(strokes, chars);
      for (const other of chars.filter(c => c !== ch)) {
        const r = judge(strokes, other, chars);
        m++;
        if (r.result === 'ok') falseOk++;
      }
    }
    dCorrect.sort((a, b) => a - b);
    const pct = x => (x * 100).toFixed(1) + '%';
    console.log(`\n[${script} 變形程度 ${level}] ${n} 筆`);
    console.log(`  第一名正確 ${pct(top1 / n)}｜判定 ✔ ${pct(ok / n)}  🤔 ${pct(unsure / n)}  ✘ ${pct(ng / n)}`);
    console.log(`  寫錯字卻判 ✔：${falseOk}/${m}（${pct(falseOk / m)}）`);
    console.log(`  正確字距離 中位數 ${dCorrect[n >> 1].toFixed(3)}、90% ${dCorrect[Math.floor(n * 0.9)].toFixed(3)}（門檻 ${ACCEPT}）`);
    const top = [...confusions].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}×${v}`).join(' ');
    if (top) console.log(`  常見誤判：${top}`);
  }
}

// 亂畫：不應該判 ✔
let scribbleOk = 0;
const hira = KANA.filter(k => k.group !== 'yoon').map(k => k.hira);
for (let i = 0; i < 300; i++) {
  const strokes = Array.from({ length: 1 + Math.floor(rnd() * 4) }, () => {
    let x = range(10, 100), y = range(10, 100);
    return Array.from({ length: 20 }, () => ({ x: (x += gauss() * 6), y: (y += gauss() * 6) }));
  });
  if (judge(strokes, hira[i % hira.length], hira).result === 'ok') scribbleOk++;
}
console.log(`\n亂畫被判 ✔：${scribbleOk}/300`);
