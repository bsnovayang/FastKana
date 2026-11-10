// VOICEVOX 共用工具：合成、WAV 解析、音量正規化、MP3 編碼
// 給 tools/gen-audio.mjs（正式音檔）和 tools/voice-test.mjs（試聽比較頁）使用
import { Mp3Encoder } from '@breezystack/lamejs';

export const ENGINE = process.env.VOICEVOX_URL || 'http://127.0.0.1:50021';

// 合成一段文字，回傳 { rate, samples: Int16Array, reading }
// VOICEVOX 偶爾會斷線（ECONNRESET），失敗時等一下重試
export async function synth(text, { speaker, speed = 0.9, rate = 24000, tries = 5 } = {}) {
  for (let i = 1; ; i++) {
    try {
      const qr = await fetch(`${ENGINE}/audio_query?speaker=${speaker}&text=${encodeURIComponent(text)}`, { method: 'POST' });
      if (!qr.ok) throw new Error(`audio_query ${qr.status}`);
      const q = await qr.json();
      q.speedScale = speed;
      q.prePhonemeLength = 0.05;
      q.postPhonemeLength = 0.15;
      q.outputSamplingRate = rate;
      q.outputStereo = false;
      const sr = await fetch(`${ENGINE}/synthesis?speaker=${speaker}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q),
      });
      if (!sr.ok) throw new Error(`synthesis ${sr.status}`);
      return { ...parseWav(Buffer.from(await sr.arrayBuffer())), reading: q.kana };
    } catch (e) {
      if (i >= tries) throw e;
      console.warn(`  ${text} 失敗（${e.cause?.code || e.message}），第 ${i} 次重試…`);
      await new Promise(r => setTimeout(r, 1000 * i));
    }
  }
}

// 解析 16-bit PCM 單聲道 WAV
export function parseWav(buf) {
  let off = 12, fmt = null, data = null;
  while (off + 8 <= buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'fmt ') fmt = { channels: buf.readUInt16LE(off + 10), rate: buf.readUInt32LE(off + 12), bits: buf.readUInt16LE(off + 22) };
    if (id === 'data') data = buf.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size & 1);
  }
  if (!fmt || !data || fmt.bits !== 16 || fmt.channels !== 1) throw new Error('不支援的 WAV 格式');
  return { rate: fmt.rate, samples: new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length)) };
}

// 峰值正規化到約 -1 dBFS
export function normalize(samples) {
  let peak = 1;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const gain = (32767 * 0.89) / peak;
  return samples.map(s => Math.max(-32768, Math.min(32767, Math.round(s * gain))));
}

// 串接多段聲音，中間插入靜音
export function concat(parts, rate, gapSec = 0.5) {
  const gap = new Int16Array(Math.round(rate * gapSec));
  const total = parts.reduce((n, p) => n + p.length + gap.length, 0);
  const out = new Int16Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length + gap.length; }
  return out;
}

export function toMp3(samples, rate, kbps) {
  const enc = new Mp3Encoder(1, rate, kbps);
  const chunks = [];
  for (let i = 0; i < samples.length; i += 1152) {
    const out = enc.encodeBuffer(samples.subarray(i, i + 1152));
    if (out.length) chunks.push(Buffer.from(out));
  }
  const end = enc.flush();
  if (end.length) chunks.push(Buffer.from(end));
  return Buffer.concat(chunks);
}

export async function speakers() {
  const r = await fetch(`${ENGINE}/speakers`);
  return r.json();
}
