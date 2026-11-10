import { KANA, KANA_BY_CHAR } from '../data/kana.js';
import { allStats, level } from '../core/stats.js';
import { speak } from '../core/speech.js';
import { session } from '../state.js';
import { header } from '../ui.js';
import { MODES } from './setup.js';

export function render(el) {
  const rows = allStats().filter(s => KANA_BY_CHAR.has(s.hira));
  const totalR = rows.reduce((a, s) => a + s.r, 0);
  const totalW = rows.reduce((a, s) => a + s.w, 0);
  const total = totalR + totalW;
  const good = rows.filter(s => level(s.script, s.hira) === 'good').length;

  // 弱點：答錯過的字，依錯誤率（加上次數權重）排序，取前 10 個
  const weak = rows
    .filter(s => s.w > 0)
    .map(s => ({ ...s, rate: (s.w + 1) / (s.r + s.w + 2) }))
    .sort((a, b) => b.rate - a.rate || b.w - a.w)
    .slice(0, 10)
    .map(s => {
      const kana = KANA_BY_CHAR.get(s.hira).kana;
      return { ...s, item: { kana, script: s.script, char: kana[s.script] } };
    });

  let mode = 'choice';

  el.innerHTML = `
    ${header('成績與弱點')}
    <main class="stack">
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
            <div class="seg" id="mode" role="radiogroup">
              ${Object.entries(MODES).map(([v, t]) => `<button data-v="${v}" role="radio" aria-checked="${v === mode}" class="${v === mode ? 'is-on' : ''}">${t.replace('羅馬拼音', '拼音')}</button>`).join('')}
            </div>
            <button class="btn btn-primary btn-block weak-start" id="start">練習這 ${weak.length} 個弱點字</button>
          ` : '<p class="muted">目前沒有答錯過的字，太厲害了！</p>'}
        </section>`}
      <p class="note">紀錄只存在這台裝置的瀏覽器。可以在「設定」清除。</p>
    </main>`;

  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.say) speak(b.dataset.say, { force: true });
    else if (b.closest('#mode')) {
      mode = b.dataset.v;
      el.querySelectorAll('#mode button').forEach(x => {
        x.classList.toggle('is-on', x === b);
        x.setAttribute('aria-checked', x === b);
      });
    } else if (b.id === 'start') {
      const pool = weak.map(w => w.item);
      session.current = { mode, pool, count: pool.length * 2 };
      location.hash = '#/play';
    }
  });
}
