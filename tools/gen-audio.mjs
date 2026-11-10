// 用 VOICEVOX 產生五十音音檔：node tools/gen-audio.mjs
// 需求：VOICEVOX 開著（http://127.0.0.1:50021），並先 npm install
//
// - 檔名用標準羅馬拼音（a.mp3、shi.mp3、kya.mp3…），平假名、片假名共用
// - じ／ぢ、ず／づ 同音，共用 ji.mp3、zu.mp3
// - 一律送片假名給 VOICEVOX，避免「は」「へ」被當助詞念成 wa、e
// - 音量統一（峰值正規化）後轉成單聲道 MP3
//
// 環境變數：SPEAKER（聲音 ID，預設 30 = No.7 アナウンス）、KBPS（位元率，預設 96）
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KANA } from '../js/data/kana.js';
import { synth, normalize, toMp3 } from './voicevox.mjs';

const SPEAKER = Number(process.env.SPEAKER || 30);
const KBPS = Number(process.env.KBPS || 96);
const SPEED = Number(process.env.SPEED || 0.9);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'audio');
mkdirSync(outDir, { recursive: true });

const done = new Set();
let total = 0;
for (const k of KANA) {
  const name = k.romaji[0];
  if (done.has(name)) continue;
  done.add(name);
  const { rate, samples, reading } = await synth(k.kata, { speaker: SPEAKER, speed: SPEED });
  const mp3 = toMp3(normalize(samples), rate, KBPS);
  writeFileSync(join(outDir, `${name}.mp3`), mp3);
  total += mp3.length;
  console.log(`${k.hira} ${k.kata} → ${name}.mp3（${reading}，${(mp3.length / 1024).toFixed(1)} KB）`);
}
console.log(`\n完成：${done.size} 個檔案，共 ${(total / 1024).toFixed(0)} KB（聲音 ${SPEAKER}、${KBPS}kbps）`);
