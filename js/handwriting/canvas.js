// 手寫畫布：Pointer Events（手指、觸控筆、滑鼠都可以），座標統一換算成 109×109（跟 KanjiVG 一樣）
import { STROKES } from '../data/strokes.js';

const UNIT = 109;

export function createPad(wrap, { onChange = () => {} } = {}) {
  wrap.innerHTML = `
    <svg class="pad-hint" viewBox="0 0 ${UNIT} ${UNIT}" aria-hidden="true"></svg>
    <canvas class="pad-canvas" aria-label="手寫區，用手指寫出假名"></canvas>`;
  const canvas = wrap.querySelector('canvas');
  const hint = wrap.querySelector('svg');
  const ctx = canvas.getContext('2d');
  let strokes = [];
  let cur = null;
  let pointerId = null;
  let locked = false;
  let size = 0;

  const ink = () => getComputedStyle(wrap).getPropertyValue('--ink').trim() || '#2D2A26';

  function resize() {
    const w = wrap.clientWidth;
    if (!w || w === size) return;
    size = w;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  function setupPen() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(5, size * 0.042);
    ctx.strokeStyle = ink();
  }

  function drawStroke(s) {
    const k = size / UNIT;
    ctx.beginPath();
    ctx.moveTo(s[0].x * k, s[0].y * k);
    if (s.length === 1) ctx.lineTo(s[0].x * k + 0.1, s[0].y * k);
    for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x * k, s[i].y * k);
    ctx.stroke();
  }

  function redraw() {
    ctx.clearRect(0, 0, size, size);
    setupPen();
    strokes.forEach(drawStroke);
  }

  const toUnit = e => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * UNIT, y: ((e.clientY - r.top) / r.height) * UNIT };
  };

  function down(e) {
    if (locked || pointerId !== null) return;
    e.preventDefault();
    pointerId = e.pointerId;
    canvas.setPointerCapture?.(e.pointerId);
    cur = [toUnit(e)];
    strokes.push(cur);
    setupPen();
    drawStroke(cur);
  }

  function move(e) {
    if (e.pointerId !== pointerId || !cur) return;
    e.preventDefault();
    const events = e.getCoalescedEvents?.() || [e];
    const k = size / UNIT;
    ctx.beginPath();
    const last = cur[cur.length - 1];
    ctx.moveTo(last.x * k, last.y * k);
    for (const ev of events) {
      const p = toUnit(ev);
      cur.push(p);
      ctx.lineTo(p.x * k, p.y * k);
    }
    ctx.stroke();
  }

  function up(e) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    cur = null;
    onChange(strokes.length);
  }

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  const ro = new ResizeObserver(resize);
  ro.observe(wrap);
  resize();

  return {
    get strokes() { return strokes.map(s => s.slice()); },
    get count() { return strokes.length; },
    undo() { strokes.pop(); redraw(); onChange(strokes.length); },
    clear() { strokes = []; redraw(); this.hideHint(); onChange(0); },
    lock(v) { locked = v; wrap.classList.toggle('is-locked', v); },
    // 提示：淡淡顯示前 n 筆
    showHint(ch, n = 1) {
      const s = STROKES[ch];
      if (!s) return;
      hint.innerHTML = s.p.slice(0, n).map(d => `<path d="${d}"/>`).join('');
    },
    hideHint() { hint.innerHTML = ''; },
    destroy() { ro.disconnect(); },
  };
}
