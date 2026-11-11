// 手寫假名辨識：$P 點雲辨識（Vatavu, Anthony & Wobbrock 2012）+ 筆畫數比對
// - 範本來自 KanjiVG 筆畫（座標系 109×109）
// - 跟筆順、筆畫方向無關；用筆畫數差異分辨「か／が」這類只差濁點的字
// 純函式、不依賴 DOM，可在 Node 測試（tools/test-recognizer.mjs）
import { STROKES } from '../data/strokes.js';

const N = 48;                 // 每個字重新取樣的點數
const STROKE_PENALTY = 0.35;  // 每差一筆加的距離
const NUM = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;

// ---------- SVG path 取樣（KanjiVG 只用 M / c，順便支援 m / C / l / L） ----------
export function samplePath(d) {
  const pts = [];
  let x = 0, y = 0;
  const cubic = (x1, y1, x2, y2, x3, y3) => {
    const x0 = x, y0 = y, steps = 10;
    for (let t = 1; t <= steps; t++) {
      const u = t / steps, v = 1 - u;
      pts.push({
        x: v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3,
        y: v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3,
      });
    }
    x = x3; y = y3;
  };
  for (const seg of d.split(/(?=[a-zA-Z])/)) {
    const cmd = seg[0];
    const n = (seg.slice(1).match(NUM) || []).map(Number);
    if (cmd === 'M' || cmd === 'm') {
      x = cmd === 'M' ? n[0] : x + n[0];
      y = cmd === 'M' ? n[1] : y + n[1];
      pts.push({ x, y });
    } else if (cmd === 'c' || cmd === 'C') {
      for (let i = 0; i + 5 < n.length; i += 6) {
        const r = cmd === 'c';
        cubic(
          (r ? x : 0) + n[i], (r ? y : 0) + n[i + 1],
          (r ? x : 0) + n[i + 2], (r ? y : 0) + n[i + 3],
          (r ? x : 0) + n[i + 4], (r ? y : 0) + n[i + 5],
        );
      }
    } else if (cmd === 'l' || cmd === 'L') {
      for (let i = 0; i + 1 < n.length; i += 2) {
        x = cmd === 'l' ? x + n[i] : n[i];
        y = cmd === 'l' ? y + n[i + 1] : n[i + 1];
        pts.push({ x, y });
      }
    }
  }
  return pts;
}

// ---------- $P ----------
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function pathLength(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i].id === pts[i - 1].id) d += dist(pts[i - 1], pts[i]);
  return d;
}

function resample(input, n) {
  const pts = input.map(p => ({ ...p }));
  const I = pathLength(pts) / (n - 1);
  if (!(I > 0)) return Array.from({ length: n }, () => ({ ...pts[0] }));
  const out = [{ ...pts[0] }];
  let D = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].id !== pts[i - 1].id) continue;
    const d = dist(pts[i - 1], pts[i]);
    if (D + d >= I) {
      const t = (I - D) / d;
      const q = { x: pts[i - 1].x + t * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + t * (pts[i].y - pts[i - 1].y), id: pts[i].id };
      out.push(q);
      pts.splice(i, 0, q);
      D = 0;
    } else {
      D += d;
    }
  }
  while (out.length < n) out.push({ ...pts[pts.length - 1] });
  return out.slice(0, n);
}

function normalize(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const s = Math.max(maxX - minX, maxY - minY) || 1;
  const scaled = pts.map(p => ({ x: (p.x - minX) / s, y: (p.y - minY) / s, id: p.id }));
  const cx = scaled.reduce((a, p) => a + p.x, 0) / scaled.length;
  const cy = scaled.reduce((a, p) => a + p.y, 0) / scaled.length;
  return scaled.map(p => ({ x: p.x - cx, y: p.y - cy, id: p.id }));
}

function cloudDistance(a, b, start) {
  const n = a.length;
  const matched = new Array(n).fill(false);
  let sum = 0, i = start;
  do {
    let min = Infinity, index = -1;
    for (let j = 0; j < n; j++) {
      if (matched[j]) continue;
      const d = dist(a[i], b[j]);
      if (d < min) { min = d; index = j; }
    }
    matched[index] = true;
    const weight = 1 - ((i - start + n) % n) / n;
    sum += weight * min;
    i = (i + 1) % n;
  } while (i !== start);
  return sum;
}

function greedyMatch(a, b) {
  const n = a.length;
  const step = Math.floor(Math.sqrt(n));
  let min = Infinity;
  for (let i = 0; i < n; i += step) {
    min = Math.min(min, cloudDistance(a, b, i), cloudDistance(b, a, i));
  }
  return min / n; // 除以點數，讓距離跟 N 無關
}

// strokes: [[{x,y}, …], …] → 正規化點雲
export function toCloud(strokes) {
  const pts = strokes.flatMap((s, id) => s.map(p => ({ x: p.x, y: p.y, id })));
  return normalize(resample(pts, N));
}

// ---------- 範本 ----------
const cache = new Map();
export function template(ch) {
  if (cache.has(ch)) return cache.get(ch);
  const s = STROKES[ch];
  if (!s) return null;
  const strokes = s.p.map(samplePath);
  const t = { ch, strokes, n: strokes.length, cloud: toCloud(strokes) };
  cache.set(ch, t);
  return t;
}

// 太短的筆畫（不小心點到）不算
const strokeLen = s => s.reduce((d, p, i) => (i ? d + dist(s[i - 1], p) : 0), 0);
export const cleanStrokes = strokes => strokes.filter(s => s.length > 1 && strokeLen(s) > 2);

// 跟每個候選字比對，距離由小到大排序
export function rank(strokes, candidates) {
  const clean = cleanStrokes(strokes);
  if (!clean.length) return [];
  const cloud = toCloud(clean);
  return candidates
    .map(ch => template(ch))
    .filter(Boolean)
    .map(t => ({ ch: t.ch, d: greedyMatch(cloud, t.cloud) + STROKE_PENALTY * Math.abs(clean.length - t.n) / Math.max(t.n, 1) }))
    .sort((a, b) => a.d - b.d);
}

// ---------- 筆順、筆畫方向檢查（只在筆畫數相同時） ----------
// 把使用者和範本都縮放到同一個方框，每一筆取 12 點，找出總距離最小的筆畫對應（筆畫數 ≤ 7，直接窮舉）
function resampleStroke(s, n = 12) {
  const pts = resample(s.map(p => ({ ...p, id: 0 })), n);
  return pts.map(({ x, y }) => ({ x, y }));
}

function boxNormalize(strokes) {
  const all = strokes.flat();
  const minX = Math.min(...all.map(p => p.x)), maxX = Math.max(...all.map(p => p.x));
  const minY = Math.min(...all.map(p => p.y)), maxY = Math.max(...all.map(p => p.y));
  const s = Math.max(maxX - minX, maxY - minY) || 1;
  return strokes.map(st => st.map(p => ({ x: (p.x - minX) / s, y: (p.y - minY) / s })));
}

const meanDist = (a, b) => a.reduce((sum, p, i) => sum + dist(p, b[i]), 0) / a.length;

function permutations(n) {
  if (n === 1) return [[0]];
  return permutations(n - 1).flatMap(p => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]));
}

// 回傳 [{ type: 'order' | 'direction', stroke: 第幾筆（從 1 開始）, text }]
export function strokeIssues(strokes, ch) {
  const clean = cleanStrokes(strokes);
  const t = template(ch);
  if (!t || clean.length !== t.n || t.n > 7) return [];
  const user = boxNormalize(clean).map(s => resampleStroke(s));
  const tmpl = boxNormalize(t.strokes).map(s => resampleStroke(s));
  const tmplLen = t.strokes.map(s => strokeLen(s));
  // cost[i][j]：使用者第 i 筆對範本第 j 筆（取正向、反向較小者）
  const fwd = user.map(u => tmpl.map(v => meanDist(u, v)));
  const rev = user.map(u => tmpl.map(v => meanDist([...u].reverse(), v)));
  let best = null, bestCost = Infinity;
  for (const p of permutations(t.n)) {
    const c = p.reduce((sum, j, i) => sum + Math.min(fwd[i][j], rev[i][j]), 0);
    if (c < bestCost) { bestCost = c; best = p; }
  }
  const issues = [];
  // 順序：使用者第 i 筆對到範本第 best[i] 筆
  const wrong = best.findIndex((j, i) => j !== i);
  if (wrong >= 0) {
    const shouldBe = best.indexOf(wrong); // 範本第 wrong 筆，被寫在使用者第 shouldBe 筆
    issues.push({ type: 'order', stroke: wrong + 1, text: `筆順不對：標準的第 ${wrong + 1} 筆，你在第 ${shouldBe + 1} 筆才寫` });
  }
  // 方向：反著寫明顯比較像（短筆畫如濁點不檢查）
  best.forEach((j, i) => {
    if (tmplLen[j] < 12) return;
    if (rev[i][j] < fwd[i][j] * 0.6) issues.push({ type: 'direction', stroke: j + 1, text: `第 ${j + 1} 筆的方向寫反了` });
  });
  return issues;
}

// 判定：'ok' 寫對、'ng' 寫錯（比較像別的字）、'unsure' 不確定（讓使用者自己判斷）
export const ACCEPT = 0.115;  // 距離小於這個才算「夠像」（由 tools/test-recognizer.mjs 調出來）
export function judge(strokes, target, candidates) {
  const list = rank(strokes, candidates.includes(target) ? candidates : [target, ...candidates]);
  if (!list.length) return { result: 'empty', list };
  const strokeCount = cleanStrokes(strokes).length;
  const expected = template(target)?.n ?? 0;
  const pos = list.findIndex(x => x.ch === target);
  const dT = list[pos].d;
  const best = list[0];
  let result;
  if (pos === 0 && dT < ACCEPT) result = 'ok';
  else if (pos <= 2 && dT < ACCEPT * 1.25) result = 'unsure';
  else result = 'ng';
  return { result, best: best.ch, dTarget: dT, pos, strokeCount, expected, list };
}
