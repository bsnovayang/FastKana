// 產生五十音音檔
//   Gemini（預設）：node --env-file=.env.local tools/gen-audio.mjs
//   VOICEVOX：      ENGINE=voicevox node tools/gen-audio.mjs（需開著 VOICEVOX）
//
// - 檔名用標準羅馬拼音（a.mp3、shi.mp3、kya.mp3…），平假名、片假名共用
// - じ／ぢ、ず／づ 同音，共用 ji.mp3、zu.mp3
// - 一律送片假名，避免「は」「へ」被當助詞念成 wa、e
// - 去掉頭尾靜音與吐氣、音量統一（峰值正規化）後轉成單聲道 MP3
// - ONLY=a,ka,shi 可以只重新產生指定的檔案
//
// 環境變數：ENGINE（gemini / voicevox）、VOICE（Gemini 聲音，預設 Kore）、
//           SPEAKER（VOICEVOX 聲音 ID，預設 30）、KBPS（預設 96）
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KANA } from '../js/data/kana.js';
import { synth, normalize, toMp3, parseWav } from './voicevox.mjs';
import { synthGemini, trimSilence } from './gemini.mjs';

const ENGINE = process.env.ENGINE || 'gemini';
const VOICE = process.env.VOICE || 'Kore';
const SPEAKER = Number(process.env.SPEAKER || 30);
const KBPS = Number(process.env.KBPS || 96);
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const CONCURRENCY = Number(process.env.CONCURRENCY || 2);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'audio');
mkdirSync(outDir, { recursive: true });

// 要產生的清單（同音只產生一次）
const seen = new Set();
const jobs = KANA.filter(k => {
  const name = k.romaji[0];
  if (seen.has(name) || (ONLY && !ONLY.has(name))) return false;
  seen.add(name);
  return true;
});

// 原始合成結果快取在 .cache/（不上傳），調整修剪參數時不用再呼叫 API；FRESH=1 強制重新合成
const cacheDir = join(root, '.cache', 'tts', ENGINE === 'voicevox' ? `voicevox-${SPEAKER}` : `gemini-${VOICE}`);
mkdirSync(cacheDir, { recursive: true });

async function make(k) {
  const file = join(cacheDir, `${k.romaji[0]}.wav`);
  let raw;
  if (!process.env.FRESH && existsSync(file)) {
    raw = parseWav(readFileSync(file));
  } else {
    raw = ENGINE === 'voicevox' ? await synth(k.kata, { speaker: SPEAKER }) : await synthGemini(k.kata, { voice: VOICE });
    writeFileSync(file, toWav(raw.samples, raw.rate));
  }
  return { rate: raw.rate, samples: ENGINE === 'voicevox' ? raw.samples : trimSilence(raw.samples, raw.rate) };
}

function toWav(samples, rate) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + samples.length * 2, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(samples.length * 2, 40);
  return Buffer.concat([h, Buffer.from(samples.buffer, samples.byteOffset, samples.length * 2)]);
}

let total = 0, i = 0;
const report = [];
async function worker() {
  while (i < jobs.length) {
    const k = jobs[i++];
    const name = k.romaji[0];
    const { rate, samples } = await make(k);
    const mp3 = toMp3(normalize(samples), rate, KBPS);
    writeFileSync(join(outDir, `${name}.mp3`), mp3);
    total += mp3.length;
    const sec = samples.length / rate;
    report.push({ name, kana: k.hira, sec });
    console.log(`${k.hira} ${k.kata} → ${name}.mp3（${sec.toFixed(2)} 秒，${(mp3.length / 1024).toFixed(1)} KB）`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// 長度異常的（可能多念或沒念完），提醒重新產生
const odd = report.filter(r => r.sec > 0.9 || r.sec < 0.15);
console.log(`\n完成：${report.length} 個檔案，共 ${(total / 1024).toFixed(0)} KB（${ENGINE === 'voicevox' ? `VOICEVOX ${SPEAKER}` : `Gemini ${VOICE}`}、${KBPS}kbps）`);
if (odd.length) console.log(`長度異常，建議聽一下或用 ONLY=${odd.map(r => r.name).join(',')} 重新產生：\n` + odd.map(r => `  ${r.kana} ${r.name} ${r.sec.toFixed(2)} 秒`).join('\n'));
