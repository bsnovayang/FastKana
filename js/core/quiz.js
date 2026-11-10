import { KANA, similarOf } from '../data/kana.js';
import { weight } from './stats.js';

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildPool(range) {
  const rows = new Set(range.rows);
  const scripts = range.script === 'mix' ? ['hira', 'kata'] : [range.script];
  const pool = [];
  for (const kana of KANA) {
    if (!rows.has(kana.row)) continue;
    for (const script of scripts) pool.push({ kana, script, char: kana[script] });
  }
  return pool;
}

// 依權重洗牌（Efraimidis–Spirakis）
function weightedShuffle(pool) {
  return pool
    .map(x => ({ x, k: Math.random() ** (1 / weight(x)) }))
    .sort((a, b) => b.k - a.k)
    .map(o => o.x);
}

export class Quiz {
  constructor(pool, count) {
    this.pool = pool;
    this.count = count; // 0 = 無限
    this.queue = [];
    this.asked = 0;
    this.last = null;
  }

  next() {
    if (this.count && this.asked >= this.count) return null;
    if (!this.queue.length) this.queue.push(...weightedShuffle(this.pool));
    let item = this.queue.shift();
    if (item === this.last && this.queue.length) {
      this.queue.push(item);
      item = this.queue.shift();
    }
    this.last = item;
    this.asked++;
    return item;
  }

  // 答錯的字過幾題再出一次
  retryLater(item) {
    this.queue.splice(Math.min(3, this.queue.length), 0, item);
  }
}

// 三選一：1 個長得像的 + 同行/同段的 + 隨機
export function choices(item, pool) {
  const ans = item.kana.romaji[0];
  const used = new Set(item.kana.romaji);
  const sim = new Set(similarOf(item.char));
  const out = [];
  const take = (list, max) => {
    let n = 0;
    for (const k of shuffle(list)) {
      if (out.length >= 2 || n >= max) break;
      const r = k.romaji[0];
      if (used.has(r)) continue;
      used.add(r); out.push(r); n++;
    }
  };
  const cands = pool.map(p => p.kana);
  const g = item.kana;
  take(cands.filter(k => sim.has(k.hira) || sim.has(k.kata)), 1);
  take(cands.filter(k => k.group === g.group && (k.row === g.row || k.col === g.col)), 2);
  take(cands, 2);
  take(KANA.filter(k => k.group === g.group), 2);
  take(KANA, 2);
  return shuffle([ans, ...out]);
}

// 統一輸入：全形轉半形、小寫、去空白
export const normalize = s => s.normalize('NFKC').toLowerCase().replace(/\s+/g, '');
