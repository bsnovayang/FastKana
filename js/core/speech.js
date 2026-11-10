import { settings } from './settings.js';

const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
const ua = navigator.userAgent;
export const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isAndroid = /Android/i.test(ua);

let voice = null;
let voiceCount = 0;
let voicesLoaded = false;
let lastError = '';
let lastOk = false;
let current = null; // 保留目前的 utterance，避免 Chrome 把它回收掉導致沒聲音
const listeners = new Set();
const notify = () => listeners.forEach(fn => fn());

function pickVoice() {
  if (!synth) return;
  const all = synth.getVoices();
  voiceCount = all.length;
  if (all.length) voicesLoaded = true;
  const ja = all.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith('ja'));
  voice = ja.find(v => /Google|Kyoko|O-ren|Nanami|Haruka|Ayumi/i.test(v.name)) || ja[0] || null;
  notify();
}

if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
  // 部分 Android 不會觸發 voiceschanged，用輪詢補救
  let tries = 0;
  const poll = setInterval(() => {
    if (voicesLoaded || ++tries > 20) { clearInterval(poll); voicesLoaded = true; notify(); return; }
    pickVoice();
  }, 250);
}

export const hasSpeech = () => !!synth;
export const currentVoice = () => voice;
export function onVoices(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function speechInfo() {
  return {
    supported: !!synth,
    voicesLoaded,
    voiceCount,
    voice,
    lastError,
    lastOk,
  };
}

// 指定語音的方式。有些 Android 引擎指定 voice 會 synthesis-failed，所以失敗時依序換方式重試，並記住成功的方式
// 0：voice + lang 'ja-JP'　1：只設 lang 'ja-JP'　2：voice + 用 voice 自己的 lang（例如 ja_JP）
const MODE_KEY = 'fastkana.ttsmode';
let ttsMode = 0;
try { ttsMode = Number(localStorage.getItem(MODE_KEY)) || 0; } catch { /* 忽略 */ }
const MODES = 3;

function build(text, m) {
  const u = new SpeechSynthesisUtterance(text);
  if (m === 1 || !voice) {
    u.lang = 'ja-JP';
  } else if (m === 2) {
    u.voice = voice;
    u.lang = voice.lang;
  } else {
    u.lang = 'ja-JP';
    u.voice = voice;
  }
  u.rate = settings.rate;
  u.volume = 1;
  return u;
}

export function speak(text, { force = false } = {}) {
  if (!synth || (!settings.sound && !force)) return;
  play(text, ttsMode, 0);
}

function play(text, m, attempt) {
  const u = build(text, m);
  u.onstart = () => {
    lastOk = true;
    if (m !== ttsMode) {
      ttsMode = m;
      try { localStorage.setItem(MODE_KEY, String(m)); } catch { /* 忽略 */ }
    }
    if (lastError) { lastError = ''; notify(); }
  };
  u.onerror = e => {
    if (e.error === 'interrupted' || e.error === 'canceled') return;
    if (current !== u) return;
    // 換下一種方式重試
    if (attempt < MODES - 1 && (e.error === 'synthesis-failed' || e.error === 'voice-unavailable' || e.error === 'language-unavailable')) {
      play(text, (m + 1) % MODES, attempt + 1);
      return;
    }
    lastError = e.error || 'unknown';
    notify();
  };
  u.onend = () => { if (current === u) current = null; };
  current = u;
  enqueue(u);
}

function enqueue(u) {
  // Android Chrome：cancel() 後立刻 speak() 常會被一起取消，所以只有在播放中才 cancel，並稍等一下再播
  if (synth.speaking || synth.pending) {
    synth.cancel();
    setTimeout(() => { if (current === u) synth.speak(u); }, 80);
  } else {
    synth.speak(u);
  }
  if (synth.paused) synth.resume();
}

// 診斷用：用系統預設語音念英文，確認語音引擎本身能不能動
export function testEnglish(cb) {
  if (!synth) return cb('不支援');
  const u = new SpeechSynthesisUtterance('Hello');
  u.lang = 'en-US';
  u.onstart = () => cb('成功');
  u.onerror = e => cb(`失敗（${e.error}）`);
  current = u;
  enqueue(u);
}

export const ttsModeName = () => ['指定語音', '只指定語言', '語音＋原始語言代碼'][ttsMode];

export function stopSpeech() {
  if (synth && (synth.speaking || synth.pending)) synth.cancel();
  current = null;
}

// 只有 iOS 需要：在第一次點擊（touchend，算使用者操作）時啟用語音
export function unlockSpeech() {
  if (!synth || !isIOS) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  synth.speak(u);
}
