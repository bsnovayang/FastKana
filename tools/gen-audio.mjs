// 用 VOICEVOX 產生五十音音檔：node tools/gen-audio.mjs
// 需求：VOICEVOX 開著（http://127.0.0.1:50021），並先 npm install
//
// - 檔名用標準羅馬拼音（a.mp3、shi.mp3、kya.mp3…），平假名、片假名共用
// - じ／ぢ、ず／づ 同音，共用 ji.mp3、zu.mp3
// - 一律送片假名給 VOICEVOX，避免「は」「へ」被當助詞念成 wa、e
// - 音量統一（峰值正規化），轉成 24kHz 單聲道 48kbps MP3
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Mp3Encoder } from '@breezystack/lamejs';
import { KANA } from '../js/data/kana.js';

const ENGINE = process.env.VOICEVOX_URL || 'http://127.0.0.1:50021';
const SPEAKER = Number(process.env.SPEAKER || 30); // No.7（アナウンス）
const SPEED = 0.9;
const KBPS = 48;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'audio');
mkdirSync(outDir, { recursive: true });

// VOICEVOX 偶爾會斷線（ECONNRESET），失敗時等一下重試
async function synth(text, tries = 5) {
  for (let i = 1; ; i++) {
    try { return await synthOnce(text); } catch (e) {
      if (i >= tries) throw e;
      console.warn(`  ${text} 失敗（${e.cause?.code || e.message}），第 ${i} 次重試…`);
      await new Promise(r => setTimeout(r, 1000 * i));
    }
  }
}

async function synthOnce(text) {
  const qr = await fetch(`${ENGINE}/audio_query?speaker=${SPEAKER}&text=${encodeURIComponent(text)}`, { method: 'POST' });
  if (!qr.ok) throw new Error(`audio_query ${qr.status}`);
  const q = await qr.json();
  q.speedScale = SPEED;
  q.prePhonemeLength = 0.05;
  q.postPhonemeLength = 0.15;
  q.outputSamplingRate = 24000;
  q.outputStereo = false;
  const sr = await fetch(`${ENGINE}/synthesis?speaker=${SPEAKER}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(q),
  });
  if (!sr.ok) throw new Error(`synthesis ${sr.status}`);
  return { wav: Buffer.from(await sr.arrayBuffer()), reading: q.kana };
}

// 解析 16-bit PCM WAV
function parseWav(buf) {
  let off = 12, fmt = null, data = null;
  while (off + 8 <= buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'fmt ') fmt = { channels: buf.readUInt16LE(off + 10), rate: buf.readUInt32LE(off + 12), bits: buf.readUInt16LE(off + 22) };
    if (id === 'data') data = buf.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size & 1);
  }
  if (!fmt || !data || fmt.bits !== 16 || fmt.channels !== 1) throw new Error('不支援的 WAV 格式');
  const samples = new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
  return { rate: fmt.rate, samples };
}

// 峰值正規化到約 -1 dBFS
function normalize(samples) {
  let peak = 1;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const gain = (32767 * 0.89) / peak;
  return samples.map(s => Math.max(-32768, Math.min(32767, Math.round(s * gain))));
}

function toMp3({ rate, samples }) {
  const enc = new Mp3Encoder(1, rate, KBPS);
  const chunks = [];
  for (let i = 0; i < samples.length; i += 1152) {
    const out = enc.encodeBuffer(samples.subarray(i, i + 1152));
    if (out.length) chunks.push(Buffer.from(out));
  }
  const end = enc.flush();
  if (end.length) chunks.push(Buffer.from(end));
  return Buffer.concat(chunks);
}

const done = new Set();
let total = 0;
for (const k of KANA) {
  const name = k.romaji[0];
  if (done.has(name)) continue;
  done.add(name);
  const { wav, reading } = await synth(k.kata);
  const mp3 = toMp3(((w) => ({ ...w, samples: normalize(w.samples) }))(parseWav(wav)));
  writeFileSync(join(outDir, `${name}.mp3`), mp3);
  total += mp3.length;
  console.log(`${k.hira} ${k.kata} → ${name}.mp3（${reading}，${(mp3.length / 1024).toFixed(1)} KB）`);
}
console.log(`\n完成：${done.size} 個檔案，共 ${(total / 1024).toFixed(0)} KB`);
