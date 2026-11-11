// 筆順動畫：淡色底字 + 一筆一筆畫出來 + 筆畫編號
// 資料來源：KanjiVG（CC BY-SA 3.0）
import { STROKES } from './data/strokes.js';

// 筆順動畫是學習內容本身（使用者自己點開的），所以「減少動態效果」設定下也照常播放
const wait = ms => new Promise(r => setTimeout(r, ms));

export const strokeCount = text => [...text].reduce((n, c) => n + (STROKES[c]?.p.length || 0), 0);
export const hasStrokes = text => [...text].every(c => STROKES[c]);

export function strokeViewer(el, text) {
  const chars = [...text].filter(c => STROKES[c]);
  el.innerHTML = chars.map(c => {
    const s = STROKES[c];
    return `<svg class="stroke-svg" viewBox="0 0 109 109" role="img" aria-label="${c} 的筆順">
      <g class="stroke-guide"><path d="M54.5 4v101M4 54.5h101"/></g>
      <g class="stroke-bg">${s.p.map(d => `<path d="${d}"/>`).join('')}</g>
      <g class="stroke-fg">${s.p.map(d => `<path d="${d}"/>`).join('')}</g>
      <g class="stroke-num">${s.n.map(([x, y], i) => `<text x="${x}" y="${y}">${i + 1}</text>`).join('')}</g>
    </svg>`;
  }).join('');

  const paths = [...el.querySelectorAll('.stroke-fg path')];
  const nums = [...el.querySelectorAll('.stroke-num text')];
  const lens = paths.map(p => p.getTotalLength());
  let shown = 0;    // 已經畫完幾筆
  let token = 0;    // 用來中斷播放中的動畫
  let anim = null;

  function setStroke(i, state) { // state: 'hidden' | 'done' | 'current'
    const p = paths[i];
    p.style.strokeDasharray = lens[i];
    p.style.strokeDashoffset = state === 'hidden' ? lens[i] : 0;
    p.classList.toggle('is-current', state === 'current');
    nums[i]?.classList.toggle('is-shown', state !== 'hidden');
    nums[i]?.classList.toggle('is-current', state === 'current');
  }

  function render() {
    paths.forEach((_, i) => setStroke(i, i < shown ? 'done' : 'hidden'));
  }

  async function drawStroke(i, my) {
    const p = paths[i];
    setStroke(i, 'hidden');
    p.classList.add('is-current');
    nums[i]?.classList.add('is-shown', 'is-current');
    if (!p.animate) {
      setStroke(i, 'current');
    } else {
      anim = p.animate(
        [{ strokeDashoffset: lens[i] }, { strokeDashoffset: 0 }],
        { duration: Math.max(280, lens[i] * 9), easing: 'ease-in-out', fill: 'forwards' },
      );
      try { await anim.finished; } catch { return false; }
      anim.cancel();
      if (my !== token) return false;
      setStroke(i, 'current');
    }
    return my === token;
  }

  function stop() {
    token++;
    anim?.cancel();
    anim = null;
  }

  // 從頭播放
  async function play() {
    stop();
    const my = token;
    shown = 0;
    render();
    await wait(200);
    for (let i = 0; i < paths.length; i++) {
      if (my !== token) return;
      if (!(await drawStroke(i, my))) return;
      setStroke(i, 'done');
      shown = i + 1;
      await wait(180);
    }
    if (my === token) paths.forEach((_, i) => setStroke(i, 'done'));
  }

  // 下一筆（畫完了就從頭開始）
  async function step() {
    stop();
    const my = token;
    if (shown >= paths.length) shown = 0;
    render();
    if (await drawStroke(shown, my)) shown++;
  }

  // 回到只顯示淡色底字的狀態
  function reset() {
    stop();
    shown = 0;
    render();
  }

  return { play, step, stop, reset, total: paths.length };
}
