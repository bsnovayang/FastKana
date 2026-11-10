import { load, save } from './storage.js';

const KEY = 'fastkana.stats';
let data = load(KEY, {});

export const keyOf = item => `${item.script}:${item.kana.hira}`;

export function record(item, ok) {
  const k = keyOf(item);
  const s = data[k] || (data[k] = { r: 0, w: 0, t: 0 });
  if (ok) s.r++; else s.w++;
  s.t = Date.now();
  save(KEY, data);
}

// 出題權重：錯越多、越久沒練，越容易出現
export function weight(item) {
  const s = data[keyOf(item)];
  if (!s) return 1.5;
  const err = (s.w + 1) / (s.r + s.w + 2);
  const days = (Date.now() - s.t) / 864e5;
  return 1 + err * 4 + Math.min(days, 7) * 0.1;
}

// 熟練度：good / mid / bad / ''（沒練過）
export function level(script, hira) {
  const s = data[`${script}:${hira}`];
  if (!s) return '';
  const n = s.r + s.w;
  const acc = s.r / n;
  if (acc >= 0.8 && n >= 3) return 'good';
  if (acc < 0.6) return 'bad';
  return 'mid';
}

export function clearStats() {
  data = {};
  save(KEY, data);
}
