import { session } from '../state.js';
import { keyOf } from '../core/stats.js';
import { speak } from '../core/speech.js';
import { header, esc } from '../ui.js';

export function render(el) {
  const r = session.result;
  if (!r) { location.replace('#/'); return; }

  const total = r.log.length;
  const ok = r.log.filter(x => x.ok).length;
  const pct = Math.round(ok / total * 100);
  const wrong = [...new Map(r.log.filter(x => !x.ok).map(x => [keyOf(x.item), x.item])).values()];
  const sec = Math.round(r.ms / 1000);
  const time = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  const msg = pct >= 90 ? '太厲害了！' : pct >= 70 ? '不錯喔，繼續加油！' : '多練幾次就會記住了';

  el.innerHTML = `
    ${header('練習結果')}
    <main class="result">
      <section class="result-top">
        <div class="big-pct romaji">${pct}<small>%</small></div>
        <p class="result-msg">${msg}</p>
      </section>
      <section class="stat-row">
        <div class="stat"><b class="ok-text">${ok}</b><span>答對</span></div>
        <div class="stat"><b class="ng-text">${total - ok}</b><span>答錯</span></div>
        <div class="stat"><b>${time}</b><span>時間</span></div>
      </section>
      ${wrong.length ? `
        <section class="panel">
          <h2 class="panel-title">這次答錯的字 <small>點一下聽發音</small></h2>
          <div class="chips">
            ${wrong.map(it => `<button class="wrong-chip" data-say="${esc(it.kana.hira)}">
              <span class="kana">${it.char}</span><span class="romaji">${it.kana.romaji[0]}</span></button>`).join('')}
          </div>
        </section>` : ''}
      <div class="result-actions">
        ${wrong.length ? '<button class="btn btn-primary btn-block" id="retryWrong">只重練答錯的字</button>' : ''}
        <button class="btn ${wrong.length ? 'btn-ghost' : 'btn-primary'} btn-block" id="again">再練一次</button>
        <a class="btn btn-ghost btn-block" href="#/">回首頁</a>
      </div>
    </main>`;

  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.say) speak(b.dataset.say, { force: true });
    else if (b.id === 'retryWrong') {
      session.current = { ...session.current, pool: wrong, count: wrong.length * 2 };
      location.hash = '#/play';
    } else if (b.id === 'again') {
      location.hash = '#/play';
    }
  });
}
