import { GROUPS, KANA_BY_CHAR, similarOf } from '../data/kana.js';
import { settings } from '../core/settings.js';
import { level } from '../core/stats.js';
import { speak, preloadKana } from '../core/speech.js';
import { header, ICON } from '../ui.js';
import { strokeViewer, strokeCount, hasStrokes } from '../stroke.js';

export function render(el) {
  let script = 'hira';
  let groupId = 'seion';
  let sel = null; // 選中的假名物件

  el.innerHTML = `
    ${header('學習模式')}
    <main class="learn">
      <div class="seg" id="script" role="radiogroup" aria-label="字種">
        <button data-v="hira" class="is-on" role="radio" aria-checked="true">平假名</button>
        <button data-v="kata" role="radio" aria-checked="false">片假名</button>
      </div>
      <div class="tabs" id="group" role="tablist">
        ${GROUPS.map(g => `<button data-v="${g.id}" role="tab" class="${g.id === groupId ? 'is-on' : ''}">${g.name.split('・')[0]}</button>`).join('')}
      </div>
      <div class="kana-grid" id="grid"></div>
      <p class="legend">
        <span><i class="dot good"></i>熟練</span>
        <span><i class="dot mid"></i>普通</span>
        <span><i class="dot bad"></i>常錯</span>
        <span class="legend-hint">點假名聽發音</span>
      </p>
    </main>
    <aside class="detail" id="detail" hidden aria-live="polite"></aside>`;

  const grid = el.querySelector('#grid');
  const detail = el.querySelector('#detail');

  function drawGrid() {
    const g = GROUPS.find(x => x.id === groupId);
    preloadKana(g.rows.flatMap(r => r.cells.filter(Boolean).map(k => k.hira)));
    grid.style.setProperty('--cols', g.cols);
    grid.dataset.group = groupId;
    grid.innerHTML = g.rows.flatMap(row => row.cells.map(k => {
      if (!k) return '<div class="cell blank"></div>';
      const m = level(script, k.hira);
      return `<button class="cell${sel === k ? ' is-sel' : ''}" data-c="${k.hira}" ${m ? `data-m="${m}"` : ''} aria-label="${k[script]} ${k.romaji[0]}">
        <span class="kana">${k[script]}</span>
        ${settings.showRomaji ? `<span class="romaji">${k.romaji[0]}</span>` : ''}
      </button>`;
    })).join('');
  }

  let viewer = null;

  function drawDetail() {
    viewer?.stop();
    viewer = null;
    if (!sel) { detail.hidden = true; return; }
    const other = script === 'hira' ? 'kata' : 'hira';
    const ch = sel[script];
    const alts = sel.romaji.slice(1);
    const sims = similarOf(ch);
    detail.hidden = false;
    detail.innerHTML = `
      <div class="detail-grip" aria-hidden="true"></div>
      <button class="icon-btn detail-close" data-act="close" aria-label="關閉">${ICON.close}</button>
      <div class="detail-main">
        <div class="stroke-box${ch.length > 1 ? ' is-long' : ''}" id="strokes"></div>
        <div class="detail-info">
          <div class="detail-kana kana"><span>${ch}</span><span class="pair">${sel[other]}</span></div>
          <div class="romaji detail-romaji">${sel.romaji[0]}</div>
          ${alts.length ? `<div class="detail-alt">也可寫作 ${alts.join('、')}</div>` : ''}
          <div class="detail-alt">共 ${strokeCount(ch)} 畫</div>
        </div>
      </div>
      <div class="detail-actions">
        <button class="btn btn-primary btn-sm" data-act="speak">${ICON.sound}<span>發音</span></button>
        <button class="btn btn-ghost btn-sm" data-act="replay">${ICON.replay}<span>筆順</span></button>
        <button class="btn btn-ghost btn-sm" data-act="step">${ICON.step}<span>下一筆</span></button>
      </div>
      ${sims.length ? `<div class="detail-sim"><span>易混淆</span>${sims.map(c => `<button class="chip chip-sm kana" data-c="${c}">${c}</button>`).join('')}</div>` : ''}`;
    if (hasStrokes(ch)) {
      viewer = strokeViewer(detail.querySelector('#strokes'), ch);
      viewer.play();
    }
  }

  function select(char) {
    const hit = KANA_BY_CHAR.get(char);
    if (!hit) return;
    sel = hit.kana;
    speak(sel.hira);
    drawGrid();
    drawDetail();
  }

  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.closest('#script')) {
      script = b.dataset.v;
      el.querySelectorAll('#script button').forEach(x => {
        x.classList.toggle('is-on', x === b);
        x.setAttribute('aria-checked', x === b);
      });
      drawGrid(); drawDetail();
    } else if (b.closest('#group')) {
      groupId = b.dataset.v;
      el.querySelectorAll('#group button').forEach(x => x.classList.toggle('is-on', x === b));
      sel = null;
      drawGrid(); drawDetail();
    } else if (b.dataset.act === 'close') {
      close();
    } else if (b.dataset.act === 'speak') {
      speak(sel.hira, { force: true });
    } else if (b.dataset.act === 'replay') {
      viewer?.play();
    } else if (b.dataset.act === 'step') {
      viewer?.step();
    } else if (b.dataset.c) {
      select(b.dataset.c);
    }
  });

  function close() {
    sel = null;
    drawGrid();
    drawDetail();
  }

  // 往下滑關閉面板
  let startY = null;
  detail.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  detail.addEventListener('touchmove', e => {
    if (startY === null) return;
    const dy = Math.max(0, e.touches[0].clientY - startY);
    detail.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  detail.addEventListener('touchend', e => {
    if (startY === null) return;
    const dy = e.changedTouches[0].clientY - startY;
    startY = null;
    detail.style.transform = '';
    if (dy > 60) close();
  });

  const onKey = e => { if (e.key === 'Escape' && sel) close(); };
  document.addEventListener('keydown', onKey);

  drawGrid();
  return () => document.removeEventListener('keydown', onKey);
}
