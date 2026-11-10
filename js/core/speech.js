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

export function speak(text, { force = false } = {}) {
  if (!synth || (!settings.sound && !force)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  if (voice) u.voice = voice;
  u.rate = settings.rate;
  u.volume = 1;
  u.onstart = () => { lastOk = true; if (lastError) { lastError = ''; notify(); } };
  u.onerror = e => {
    if (e.error === 'interrupted' || e.error === 'canceled') return;
    lastError = e.error || 'unknown';
    notify();
  };
  u.onend = () => { if (current === u) current = null; };
  current = u;

  // Android Chrome：cancel() 後立刻 speak() 常會被一起取消，所以只有在播放中才 cancel，並稍等一下再播
  if (synth.speaking || synth.pending) {
    synth.cancel();
    setTimeout(() => { if (current === u) synth.speak(u); }, 80);
  } else {
    synth.speak(u);
  }
  if (synth.paused) synth.resume();
}

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
