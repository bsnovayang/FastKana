// Gemini TTS（gemini-3.8-flash-tts）共用工具
// 金鑰從環境變數 GEMINI_API_KEY 讀取，請放在 .env.local（已列入 .gitignore，不會上傳）：
//   node --env-file=.env.local tools/xxx.mjs
import { parseWav } from './voicevox.mjs';

export const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash-tts';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

export function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('找不到 GEMINI_API_KEY。請在專案資料夾建立 .env.local，內容：GEMINI_API_KEY=你的金鑰\n並用 node --env-file=.env.local 執行。');
    process.exit(1);
  }
  return key;
}

// 念單一假名的語氣說明（放在 speech_metadata，不會被念出來）
export const STYLE = '日本語の仮名一文字を、標準語（東京方言）で、語学教材のナレーターのように、はっきりと、自然な速さで一回だけ発音する。';

// 在回應裡找出 base64 音訊（Interactions API 的 steps → model_output → audio）
function findAudio(node) {
  if (!node || typeof node !== 'object') return null;
  if (typeof node.data === 'string' && node.data.length > 100 && (node.type === 'audio' || /audio/.test(node.mime_type || node.mimeType || ''))) return node;
  for (const v of Array.isArray(node) ? node : Object.values(node)) {
    const hit = findAudio(v);
    if (hit) return hit;
  }
  return null;
}

// 回應結構（不含音訊內容），出錯時方便除錯
const shape = (o, depth = 0) => {
  if (depth > 6) return '…';
  if (Array.isArray(o)) return o.slice(0, 3).map(x => shape(x, depth + 1));
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' && v.length > 80 ? `<${v.length} chars>` : shape(v, depth + 1)]));
  return o;
};

export async function synthGemini(text, { voice = 'Kore', style = STYLE, tries = 4 } = {}) {
  const body = {
    model: MODEL,
    input: [{
      type: 'user_input',
      content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style }] }],
    }],
    response_format: { type: 'audio' },
    generation_config: { speech_config: [{ voice }] },
  };
  for (let i = 1; ; i++) {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey() },
      body: JSON.stringify(body),
    });
    const json = await r.json().catch(() => ({}));
    if (r.ok) {
      const audio = findAudio(json);
      if (!audio) throw new Error(`回應裡找不到音訊：\n${JSON.stringify(shape(json), null, 2)}`);
      const buf = Buffer.from(audio.data, 'base64');
      // 預設 WAV（有 RIFF 標頭）；舊格式則是 24kHz 16-bit PCM
      if (buf.toString('ascii', 0, 4) === 'RIFF') return parseWav(buf);
      return { rate: 24000, samples: new Int16Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length)) };
    }
    // 429（太頻繁）或 5xx：等一下重試
    if ((r.status === 429 || r.status >= 500) && i < tries) {
      const wait = 5000 * i;
      console.warn(`  ${text}：HTTP ${r.status}，${wait / 1000} 秒後重試…`);
      await new Promise(res => setTimeout(res, wait));
      continue;
    }
    throw new Error(`HTTP ${r.status}：${JSON.stringify(json.error || shape(json)).slice(0, 800)}`);
  }
}

// 去掉頭尾的靜音（模型有時會留比較長的空白），保留一點點緩衝
export function trimSilence(samples, rate, threshold = 500, padSec = 0.05) {
  let s = 0, e = samples.length - 1;
  while (s < e && Math.abs(samples[s]) < threshold) s++;
  while (e > s && Math.abs(samples[e]) < threshold) e--;
  const pad = Math.round(rate * padSec);
  return samples.slice(Math.max(0, s - pad), Math.min(samples.length, e + pad * 3));
}
