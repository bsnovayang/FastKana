import { ALL_ROMAJI, PREFIXES, KANA_BY_CHAR } from '../data/kana.js';
import { settings } from '../core/settings.js';
import { record } from '../core/stats.js';
import { speak, preloadKana } from '../core/speech.js';
import { Quiz, choices, kanaChoices, normalize } from '../core/quiz.js';
import { session } from '../state.js';
import { ICON, esc } from '../ui.js';

export function render(el) {
  const s = session.current;
  if (!s) { location.replace('#/'); return; }

  preloadKana(s.pool.map(i => i.kana.hira));
  const quiz = new Quiz(s.pool, s.count);
  const log = [];
  const t0 = Date.now();
  const isInput = s.mode === 'input';
  const isListen = s.mode === 'listen';
  let item = null, done = false, timer = 0, nOk = 0, nNg = 0;

  el.innerHTML = `
    <header class="topbar play-top">
      <a class="icon-btn" href="#/" aria-label="離開練習">${ICON.close}</a>
      ${s.count
        ? '<div class="progress" role="progressbar" aria-label="進度"><div class="progress-bar" id="bar"></div></div>'
        : '<div class="progress-text" id="bar"></div>'}
      <div class="score"><span class="ok-text">✔ <b id="nOk">0</b></span><span class="ng-text">✘ <b id="nNg">0</b></span></div>
    </header>
    <main class="play">
      <div class="q-card" id="qcard">
        <div class="q-kana kana" id="qk"></div>
        <button class="icon-btn q-sound" id="replay" aria-label="再聽一次" hidden>${ICON.sound}</button>
      </div>
      <div class="feedback" id="fb" aria-live="polite"></div>
      <div id="ans">
        ${isInput ? `
          <form class="input-row" id="form" autocomplete="off">
            <input id="inp" class="romaji-input" type="text" enterkeyhint="go"
              autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false"
              placeholder="輸入羅馬拼音" aria-label="羅馬拼音">
            <button class="btn btn-primary" id="go">確認</button>
          </form>` : `<div class="choices${isListen ? ' choices-kana' : ''}" id="choices"></div>`}
      </div>
      ${isInput ? '' : '<button class="btn btn-primary btn-block" id="next" hidden>下一題</button>'}
      ${s.count ? '' : '<button class="btn btn-ghost btn-block" id="finish">結束練習</button>'}
    </main>`;

  const $ = id => el.querySelector('#' + id);
  const qcard = $('qcard'), qk = $('qk'), fb = $('fb'), replay = $('replay');
  const inp = $('inp'), go = $('go'), next = $('next'), choicesEl = $('choices');

  const say = () => speak(item.kana.hira, { force: isListen });
  const romajiOf = c => KANA_BY_CHAR.get(c)?.kana.romaji[0] ?? '';

  function updateTop() {
    $('nOk').textContent = nOk;
    $('nNg').textContent = nNg;
    const bar = $('bar');
    if (s.count) bar.style.width = `${(quiz.asked - (done ? 0 : 1)) / s.count * 100}%`;
    else bar.textContent = `第 ${quiz.asked} 題`;
  }

  function showKana() {
    qk.textContent = item.char;
    qk.classList.toggle('is-long', item.char.length > 1);
    qk.classList.remove('pop'); void qk.offsetWidth; qk.classList.add('pop');
  }

  function show() {
    clearTimeout(timer);
    item = quiz.next();
    if (!item) return finish();
    done = false;
    qcard.className = 'q-card';
    fb.className = 'feedback';
    fb.innerHTML = '';
    if (isListen) {
      qk.classList.remove('is-long');
      qk.innerHTML = `<button class="listen-btn" id="bigPlay" aria-label="播放發音">${ICON.sound}</button>`;
      replay.hidden = true;
      say();
    } else {
      showKana();
      replay.hidden = true;
    }
    if (isInput) {
      inp.value = '';
      go.textContent = '確認';
      inp.focus({ preventScroll: true });
    } else {
      next.hidden = true;
      const opts = isListen ? kanaChoices(item, s.pool) : choices(item, s.pool);
      choicesEl.innerHTML = opts.map((r, i) =>
        `<button class="choice ${isListen ? 'kana' : 'romaji'}" data-r="${r}"><span class="choice-key">${i + 1}</span>${r}</button>`).join('');
    }
    updateTop();
  }

  function judge(given) {
    if (done) return;
    done = true;
    const ok = isListen ? given === item.char : item.kana.romaji.includes(given);
    record(item, ok);
    log.push({ item, ok, given });
    if (ok) nOk++; else { nNg++; quiz.retryLater(item); }
    if (isListen) showKana();
    say();
    replay.hidden = false;
    qcard.classList.add(ok ? 'is-ok' : 'is-ng');
    fb.className = 'feedback ' + (ok ? 'is-ok' : 'is-ng');
    const std = item.kana.romaji[0];
    if (isListen) {
      fb.innerHTML = ok
        ? `<strong>✔ 正確</strong><span class="given"><b class="kana">${item.char}</b> 念 <b class="romaji">${std}</b></span>`
        : `<strong>✘ 正解是 <span class="kana">${item.char}</span>（<span class="romaji">${std}</span>）</strong>
           <span class="given">你選的 <b class="kana">${given}</b> 念 <b class="romaji">${romajiOf(given)}</b></span>`;
    } else {
      fb.innerHTML = ok
        ? `<strong>✔ 正確</strong>${given !== std ? `<span class="given">標準寫法：<b class="romaji">${std}</b></span>` : ''}`
        : `<strong>✘ 正解是 <span class="romaji">${std}</span></strong>${given ? `<span class="given">你的答案：${esc(given)}</span>` : ''}`;
    }
    navigator.vibrate?.(ok ? 15 : [30, 40, 30]);

    if (isInput) {
      go.textContent = '下一題';
    } else {
      choicesEl.querySelectorAll('.choice').forEach(b => {
        b.disabled = true;
        const r = b.dataset.r;
        const right = isListen ? r === item.char : item.kana.romaji.includes(r);
        if (right) b.classList.add('is-ok');
        else if (r === given) b.classList.add('is-ng');
      });
    }
    updateTop();
    if (ok && settings.autoNext) timer = setTimeout(show, isListen ? 1200 : 900);
    else if (!isInput) { next.hidden = false; next.focus({ preventScroll: true }); }
  }

  function finish() {
    clearTimeout(timer);
    if (!log.length) { location.hash = '#/'; return; }
    session.result = { log, ms: Date.now() - t0 };
    location.hash = '#/result';
  }

  replay.addEventListener('click', () => speak(item.kana.hira, { force: true }));
  qk.addEventListener('click', e => { if (e.target.closest('#bigPlay')) say(); });
  $('finish')?.addEventListener('click', finish);

  if (isInput) {
    // 按鈕不搶焦點，讓手機鍵盤一直開著
    el.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });

    $('form').addEventListener('submit', e => {
      e.preventDefault();
      if (done) return show();
      const v = normalize(inp.value);
      if (v) judge(v);
      else inp.focus();
    });
    inp.addEventListener('input', () => {
      if (done) return;
      const v = normalize(inp.value);
      if (settings.quickSubmit && ALL_ROMAJI.has(v) && !PREFIXES.has(v)) return judge(v);
      // 「n」可能是 ん，也可能是 na、ni… 的開頭，提示使用者
      if (settings.quickSubmit && v === 'n') {
        fb.className = 'feedback is-hint';
        fb.innerHTML = '<span>是「ん」的話：再打一個 <b class="romaji">n</b>，或按確認</span>';
      } else if (fb.classList.contains('is-hint')) {
        fb.className = 'feedback';
        fb.innerHTML = '';
      }
    });
  } else {
    choicesEl.addEventListener('click', e => {
      const b = e.target.closest('.choice');
      if (b && !done) judge(b.dataset.r);
    });
    next.addEventListener('click', show);
  }

  const onKey = e => {
    if (isInput) return;
    if (!done && ['1', '2', '3'].includes(e.key)) {
      choicesEl.querySelectorAll('.choice')[e.key - 1]?.click();
    } else if (isListen && (e.key === 'r' || e.key === 'R')) {
      speak(item.kana.hira, { force: true });
    } else if (done && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      show();
    }
  };
  document.addEventListener('keydown', onKey);

  show();

  return () => {
    clearTimeout(timer);
    document.removeEventListener('keydown', onKey);
  };
}
