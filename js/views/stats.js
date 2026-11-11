import { KANA, KANA_BY_CHAR } from '../data/kana.js';
import { allStats, dueStats, level, recentDays, streak } from '../core/stats.js';
import { settings } from '../core/settings.js';
import { speak } from '../core/speech.js';
import { session } from '../state.js';
import { header } from '../ui.js';
import { MODE_SHORT } from './setup.js';

const WEEKDAY = '日一二三四五六';
const toItem = s => {
  const kana = KANA_BY_CHAR.get(s.hira).kana;
  return { kana, script: s.script, char: kana[s.script] };
};

export function render(el) {
  const rows = allStats().filter(s => KANA_BY_CHAR.has(s.hira));
  const totalR = rows.reduce((a, s) => a + s.r, 0);
  const totalW = rows.reduce((a, s) => a + s.w, 0);
  const total = totalR + totalW;
  const good = rows.filter(s => level(s.script, s.hira) === 'good').length;

  // 今天到期、該複習的字（先排級數低的）
  const due = dueStats()
    .filter(s => KANA_BY_CHAR.has(s.hira))
    .sort((a, b) => a.b - b.b || a.d - b.d)
    .map(s => ({ ...s, item: toItem(s) }));

  // 弱點：答錯過的字，依錯誤率（加上次數權重）排序，取前 10 個
  const weak = rows
    .filter(s => s.w > 0)
    .map(s => ({ ...s, rate: (s.w + 1) / (s.r + s.w + 2), item: toItem(s) }))
    .sort((a, b) => b.rate - a.rate || b.w - a.w)
    .slice(0, 10);

  // 最近 7 天
  const week = recentDays(7);
  const max = Math.max(settings.dailyGoal, ...week.map(d => d.count), 1);

  let mode = 'choice';
  const modeChips = () => `<div class="chips mode-chips">
    ${Object.entries(MODE_SHORT).map(([v, t]) => `<button class="chip chip-sm${v === mode ? ' is-on' : ''}" data-mode="${v}" aria-pressed="${v === mode}">${t}</button>`).join('')}
  </div>`;

  el.innerHTML = `
    ${header('成績與弱點')}
    <main class="stack">
      <section class="panel">
        <h2 class="panel-title">最近 7 天 <small>🔥 連續 ${streak()} 天・每日目標 ${settings.dailyGoal} 題</small></h2>
        <div class="week">
          ${week.map(d => {
            const wd = WEEKDAY[new Date(`${d.date}T00:00`).getDay()];
            return `<div class="week-day">
              <span class="week-n">${d.count || ''}</span>
              <div class="week-bar"><i class="${d.count >= settings.dailyGoal ? 'is-done' : ''}" style="height:${d.count / max * 100}%"></i></div>
              <span class="week-label">${wd}</span>
            </div>`;
          }).join('')}
        </div>
      </section>

      ${due.length ? `
        <section class="panel review-panel">
          <h2 class="panel-title">今日複習 <small>${due.length} 個字到期了</small></h2>
          <p class="muted review-desc">依記憶曲線安排：答對的字隔 1、3、7、14、30 天再複習，答錯的馬上複習。</p>
          <div class="chips due-chips">
            ${due.slice(0, 40).map(d => `<button class="chip chip-sm kana" data-say="${d.hira}">${d.item.char}</button>`).join('')}
            ${due.length > 40 ? `<span class="muted">…還有 ${due.length - 40} 個</span>` : ''}
          </div>
          <h3 class="sub-title">用哪種方式複習？</h3>
          ${modeChips()}
          <button class="btn btn-primary btn-block weak-start" data-start="due">開始複習 ${due.length} 個字</button>
        </section>` : ''}

      ${total === 0 ? `
        <section class="panel empty">
          <p class="kana empty-kana">？</p>
          <p>還沒有練習紀錄<br>先去練幾題吧！</p>
          <a class="btn btn-primary" href="#/setup/choice">開始練習</a>
        </section>` : `
        <section class="stat-row">
          <div class="stat"><b>${total}</b><span>總答題數</span></div>
          <div class="stat"><b class="ok-text">${Math.round(totalR / total * 100)}%</b><span>正確率</span></div>
          <div class="stat"><b>${good}<small>/${KANA.length * 2}</small></b><span>已熟練</span></div>
        </section>
        <section class="panel">
          <h2 class="panel-title">最常錯的字 <small>點一下聽發音</small></h2>
          ${weak.length ? `
            <div class="weak-list">
              ${weak.map(w => `
                <button class="weak-item" data-say="${w.hira}">
                  <span class="kana weak-kana">${w.item.char}</span>
                  <span class="weak-info">
                    <b class="romaji">${w.item.kana.romaji[0]}</b>
                    <span>答錯 ${w.w} 次・答對 ${w.r} 次</span>
                  </span>
                  <span class="weak-bar"><i style="width:${Math.round(w.r / (w.r + w.w) * 100)}%"></i></span>
                </button>`).join('')}
            </div>
            <h3 class="sub-title">用哪種方式練？</h3>
            ${modeChips()}
            <button class="btn btn-primary btn-block weak-start" data-start="weak">練習這 ${weak.length} 個弱點字</button>
          ` : '<p class="muted">目前沒有答錯過的字，太厲害了！</p>'}
        </section>`}
      <p class="note">紀錄只存在這台裝置的瀏覽器。可以在「設定」匯出備份或清除。</p>
    </main>`;

  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.say) speak(b.dataset.say, { force: true });
    else if (b.dataset.mode) {
      mode = b.dataset.mode;
      el.querySelectorAll('[data-mode]').forEach(x => {
        const on = x.dataset.mode === mode;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', on);
      });
    } else if (b.dataset.start) {
      const list = b.dataset.start === 'due' ? due : weak;
      const pool = list.map(w => w.item);
      session.current = { mode, pool, count: b.dataset.start === 'due' ? pool.length : pool.length * 2 };
      location.hash = '#/play';
    }
  });
}
