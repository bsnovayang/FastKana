// 播放事先產生的假名音檔（audio/*.mp3，VOICEVOX:No.7）
// 用 Web Audio：iOS 解鎖一次之後，自動播放（例如聽音選字進題時）也不會被擋
import { VERSION } from '../version.js';

const AC = window.AudioContext || window.webkitAudioContext;
let ctx = null;
const buffers = new Map(); // 檔名 → Promise<AudioBuffer>
let source = null;
let failed = false;

function getCtx() {
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

export const audioSupported = () => !!AC;
export const audioFailed = () => failed;

// 必須在使用者操作（點擊、按鍵）時呼叫一次
export function unlockAudio() {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  // iOS 舊版需要播一段無聲的 buffer 才會真正解鎖
  const s = c.createBufferSource();
  s.buffer = c.createBuffer(1, 1, 22050);
  s.connect(c.destination);
  s.start(0);
}

function load(name) {
  if (buffers.has(name)) return buffers.get(name);
  const c = getCtx();
  const p = fetch(`./audio/${name}.mp3?v=${VERSION}`)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
    // Safari 舊版只支援 callback 形式
    .then(ab => new Promise((res, rej) => c.decodeAudioData(ab, res, rej)));
  buffers.set(name, p);
  p.catch(() => buffers.delete(name));
  return p;
}

// 預先載入（例如練習開始前，把這次會出的字都先載好）
export function preload(names) {
  if (!getCtx()) return;
  for (const n of names) load(n).catch(() => {});
}

export async function playFile(name) {
  const c = getCtx();
  if (!c) throw new Error('不支援 Web Audio');
  if (c.state === 'suspended') await c.resume().catch(() => {});
  let buf;
  try {
    buf = await load(name);
  } catch (e) {
    failed = true;
    throw e;
  }
  failed = false;
  stopFile();
  const s = c.createBufferSource();
  s.buffer = buf;
  s.connect(c.destination);
  s.start(0);
  source = s;
  return new Promise(res => { s.onended = res; });
}

export function stopFile() {
  try { source?.stop(); } catch { /* 已經停了 */ }
  source = null;
}
