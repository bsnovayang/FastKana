import { GROUPS } from '../data/kana.js';
import { settings, saveSettings } from '../core/settings.js';
import { buildPool } from '../core/quiz.js';
import { session } from '../state.js';
import { header } from '../ui.js';

export const MODES = { input: '輸入羅馬拼音', choice: '選擇羅馬拼音', listen: '聽音選字', write: '聽音手寫' };
const rowsOf = id => GROUPS.find(g => g.id === id).rows.map(r => r.key);
const PRESETS = [
  ['入門（あ〜な行）', ['a', 'ka', 'sa', 'ta', 'na']],
  ['清音', rowsOf('seion')],
  ['清音＋濁音', [...rowsOf('seion'), ...rowsOf('dakuon')]],
  ['全部', GROUPS.flatMap(g => g.rows.map(r => r.key))],
];

export function render(el, mode) {
  if (!MODES[mode]) { location.replace('#/'); return; }
  const range = { ...settings.range };
  let rows = new Set(range.rows);
  // 手寫模式不含拗音（一格寫兩個字不好辨識）；隱藏但保留原本的選擇
  const groups = mode === 'write' ? GROUPS.filter(g => g.id !== 'yoon') : GROUPS;
  const allowed = new Set(groups.flatMap(g => g.rows.map(r => r.key)));
  const poolRange = () => ({ ...range, rows: [...rows].filter(k => allowed.has(k)) });

  const seg = (id, opts, cur) => `<div class="seg" id="${id}" role="radiogroup">
    ${opts.map(([v, t]) => `<button data-v="${v}" role="radio" aria-checked="${v === cur}" class="${v === cur ? 'is-on' : ''}">${t}</button>`).join('')}
  </div>`;

  el.innerHTML = `
    ${header(MODES[mode])}
    <main class="stack setup">
      <section class="panel">
        <h2 class="panel-title">字種</h2>
        ${seg('script', [['hira', '平假名'], ['kata', '片假名'], ['mix', '混合']], range.script)}
      </section>
      <section class="panel">
        <h2 class="panel-title">範圍</h2>
        <div class="chips presets">
          ${PRESETS.map((p, i) => `<button class="chip chip-sm" data-preset="${i}">${p[0]}</button>`).join('')}
        </div>
        <div id="groups"></div>
        ${mode === 'write' ? '<p class="note">手寫模式不含拗音</p>' : ''}
      </section>
      <section class="panel">
        <h2 class="panel-title">題數</h2>
        ${seg('count', [['10', '10'], ['20', '20'], ['50', '50'], ['0', '無限']], String(range.count))}
      </section>
    </main>
    <footer class="action-bar">
      <span id="sum"></span>
      <button class="btn btn-primary" id="start">開始練習</button>
    </footer>`;

  const groupsEl = el.querySelector('#groups');
  const sumEl = el.querySelector('#sum');
  const startBtn = el.querySelector('#start');

  function draw() {
    const sc = range.script === 'kata' ? 'kata' : 'hira';
    groupsEl.innerHTML = groups.map(g => {
      const all = g.rows.every(r => rows.has(r.key));
      return `<div class="group">
        <div class="group-head"><h3>${g.name}</h3>
          <button class="link-btn" data-all="${g.id}">${all ? '全部取消' : '全選'}</button></div>
        <div class="chips">
          ${g.rows.map(r => `<button class="chip kana${rows.has(r.key) ? ' is-on' : ''}" data-row="${r.key}" aria-pressed="${rows.has(r.key)}">${r.label[sc]}</button>`).join('')}
        </div>
      </div>`;
    }).join('');
    const n = buildPool(poolRange()).length;
    sumEl.innerHTML = n < 3 ? '請至少選 3 個假名' : `共 <b>${n}</b> 個假名`;
    startBtn.disabled = n < 3;
  }

  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const segEl = b.closest('.seg');
    if (segEl) {
      segEl.querySelectorAll('button').forEach(x => {
        x.classList.toggle('is-on', x === b);
        x.setAttribute('aria-checked', x === b);
      });
      if (segEl.id === 'script') range.script = b.dataset.v;
      else range.count = Number(b.dataset.v);
      draw();
    } else if (b.dataset.row) {
      rows.has(b.dataset.row) ? rows.delete(b.dataset.row) : rows.add(b.dataset.row);
      draw();
    } else if (b.dataset.all) {
      const keys = rowsOf(b.dataset.all);
      const all = keys.every(k => rows.has(k));
      keys.forEach(k => all ? rows.delete(k) : rows.add(k));
      draw();
    } else if (b.dataset.preset) {
      rows = new Set(PRESETS[b.dataset.preset][1]);
      draw();
    } else if (b === startBtn) {
      range.rows = [...rows];
      settings.range = range;
      saveSettings();
      session.current = { mode, pool: buildPool(poolRange()), count: range.count };
      location.hash = '#/play';
    }
  });

  draw();
}
