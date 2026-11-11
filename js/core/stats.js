import { load, save } from './storage.js';

const KEY = 'fastkana.stats';
const DAILY_KEY = 'fastkana.daily';
const DAY = 864e5;
let data = load(KEY, {});
let daily = load(DAILY_KEY, { days: {} });

export const keyOf = item => `${item.script}:${item.kana.hira}`;

// ---------- 間隔重複（萊特納盒子） ----------
// 答對且已到期 → 升一級；答錯 → 回到第 0 級（馬上要複習）
export const INTERVALS = [0, 1, 3, 7, 14, 30]; // 各級的複習間隔（天）

function accLevel(s) {
  const n = s.r + s.w;
  if (!n) return '';
  const acc = s.r / n;
  if (acc >= 0.8 && n >= 3) return 'good';
  if (acc < 0.6) return 'bad';
  return 'mid';
}

// 舊紀錄沒有級數：依熟練度換算
function ensureBox(s) {
  if (s.b === undefined) {
    const lv = accLevel(s);
    s.b = lv === 'good' ? 2 : lv === 'mid' ? 1 : 0;
    s.d = (s.t || Date.now()) + INTERVALS[s.b] * DAY;
  }
  return s;
}

// ---------- 每日題數 ----------
export function dateKey(t = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function bumpDaily() {
  const k = dateKey();
  daily.days[k] = (daily.days[k] || 0) + 1;
  // 只保留最近 400 天
  const keys = Object.keys(daily.days).sort();
  for (const old of keys.slice(0, Math.max(0, keys.length - 400))) delete daily.days[old];
  save(DAILY_KEY, daily);
}

export const todayCount = () => daily.days[dateKey()] || 0;

// 連續練習天數：今天還沒練就從昨天開始算
export function streak() {
  let n = 0;
  let t = Date.now();
  if (!daily.days[dateKey(t)]) t -= DAY;
  while (daily.days[dateKey(t)]) { n++; t -= DAY; }
  return n;
}

// 最近 n 天的題數（舊 → 新）
export function recentDays(n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const k = dateKey(Date.now() - (n - 1 - i) * DAY);
    return { date: k, count: daily.days[k] || 0 };
  });
}

// ---------- 記錄一次作答 ----------
export function record(item, ok) {
  const k = keyOf(item);
  const now = Date.now();
  const s = ensureBox(data[k] || (data[k] = { r: 0, w: 0, t: now }));
  if (ok) {
    s.r++;
    if (now >= s.d) {
      s.b = Math.min(INTERVALS.length - 1, s.b + 1);
      s.d = now + INTERVALS[s.b] * DAY;
    }
  } else {
    s.w++;
    s.b = 0;
    s.d = now;
  }
  s.t = now;
  save(KEY, data);
  bumpDaily();
}

// 出題權重：錯越多、越久沒練、已經到期的，越容易出現
export function weight(item) {
  const s = data[keyOf(item)];
  if (!s) return 1.5;
  ensureBox(s);
  const err = (s.w + 1) / (s.r + s.w + 2);
  const days = (Date.now() - s.t) / DAY;
  const due = Date.now() >= s.d ? 1 : 0;
  return 1 + err * 4 + Math.min(days, 7) * 0.1 + due;
}

// 熟練度：good / mid / bad / ''（沒練過）
export function level(script, hira) {
  const s = data[`${script}:${hira}`];
  return s ? accLevel(s) : '';
}

// 所有練習過的紀錄：[{ script, hira, r, w, b, d }]
export function allStats() {
  return Object.entries(data).map(([k, s]) => {
    const [script, hira] = k.split(':');
    return { script, hira, ...ensureBox(s) };
  });
}

// 今天到期、該複習的紀錄
export const dueStats = () => allStats().filter(s => Date.now() >= s.d);

export function clearStats() {
  data = {};
  daily = { days: {} };
  save(KEY, data);
  save(DAILY_KEY, daily);
}

// ---------- 匯出 / 匯入 ----------
export const exportStats = () => ({ stats: data, daily });

export function importStats(obj) {
  if (!obj || typeof obj.stats !== 'object' || typeof obj.daily?.days !== 'object') throw new Error('格式不對');
  for (const [k, s] of Object.entries(obj.stats)) {
    if (!/^(hira|kata):/.test(k) || typeof s.r !== 'number' || typeof s.w !== 'number') throw new Error(`紀錄格式不對：${k}`);
  }
  data = obj.stats;
  daily = { days: { ...obj.daily.days } };
  save(KEY, data);
  save(DAILY_KEY, daily);
}
