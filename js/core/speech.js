import { settings } from './settings.js';

const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
let voice = null;
const listeners = new Set();

function pickVoice() {
  if (!synth) return;
  const vs = synth.getVoices().filter(v => v.lang.replace('_', '-').toLowerCase().startsWith('ja'));
  voice = vs.find(v => /Google|Kyoko|O-ren|Nanami|Haruka|Ayumi/i.test(v.name)) || vs[0] || null;
  listeners.forEach(fn => fn(voice));
}

if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

export const hasSpeech = () => !!synth;
export const currentVoice = () => voice;
export function onVoices(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function speak(text, { force = false } = {}) {
  if (!synth || (!settings.sound && !force)) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  if (voice) u.voice = voice;
  u.rate = settings.rate;
  synth.speak(u);
}

export function stopSpeech() { synth?.cancel(); }

// iOS 要在使用者第一次點擊時啟用語音
export function unlockSpeech() {
  if (!synth) return;
  const u = new SpeechSynthesisUtterance('');
  u.volume = 0;
  synth.speak(u);
}
