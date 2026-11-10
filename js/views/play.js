import { ALL_ROMAJI, PREFIXES } from '../data/kana.js';
import { settings } from '../core/settings.js';
import { record } from '../core/stats.js';
import { speak } from '../core/speech.js';
import { Quiz, choices, normalize } from '../core/quiz.js';
import { session } from '../state.js';
import { ICON, esc } from '../ui.js';

export function render(el) {
  const s = session.current;
  if (!s) { location.replace('#/'); return; }

  const quiz = new Quiz(s.pool, s.count);
  const log = [];
  const t0 = Date.now();
  const isInput = s.mode === 'input';
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
          </form>` : '<div class="choices" id="choices"></div>'}
      </div>
      ${isInput ? '' : '<button class="btn btn-primary btn-block" id="next" hidden>下一題</button>'}
      ${s.count ? '' : '<button class="btn btn-ghost btn-block" id="finish">結束練習</button>'}
    </main>`;

  const $ = id => el.querySelector('#' + id);
  const qcard = $('qcard'), qk = $('qk'), fb = $('fb'), replay = $('replay');
  const inp = $('inp'), go = $('go'), next = $('next'), choicesEl = $('choices');

  function updateTop() {
    $('nOk').textContent = nOk;
    $('nNg').textContent = nNg;
    const bar = $('bar');
    if (s.count) bar.style.width = `${(quiz.asked - (done ? 0 : 1)) / s.count * 100}%`;
    else bar.textContent = `第 ${quiz.asked} 題`;
  }

  function show() {
    clearTimeout(timer);
    item = quiz.next();
    if (!item) return finish();
    done = false;
    qk.textContent = item.char;
    qk.classList.toggle('is-long', item.char.length > 1);
    qk.classList.remove('pop'); void qk.offsetWidth; qk.classList.add('pop');
    qcard.className = 'q-card';
    fb.className = 'feedback';
    fb.innerHTML = '';
    replay.hidden = true;
    if (isInput) {
      inp.value = '';
      go.textContent = '確認';
      inp.focus({ preventScroll: true });
    } else {
      next.hidden = true;
      choicesEl.innerHTML = choices(item, s.pool).map((r, i) =>
        `<button class="choice romaji" data-r="${r}"><span class="choice-key">${i + 1}</span>${r}</button>`).join('');
    }
    updateTop();
  }

  function judge(given) {
    if (done) return;
    done = true;
    const ok = item.kana.romaji.includes(given);
    record(item, ok);
    log.push({ item, ok, given });
    if (ok) nOk++; else { nNg++; quiz.retryLater(item); }
    speak(item.kana.hira);
    replay.hidden = false;
    qcard.classList.add(ok ? 'is-ok' : 'is-ng');
    fb.className = 'feedback ' + (ok ? 'is-ok' : 'is-ng');
    const std = item.kana.romaji[0];
    fb.innerHTML = ok
      ? `<strong>✔ 正確</strong>${given !== std ? `<span class="given">標準寫法：<b class="romaji">${std}</b></span>` : ''}`
      : `<strong>✘ 正解是 <span class="romaji">${std}</span></strong>${given ? `<span class="given">你的答案：${esc(given)}</span>` : ''}`;
    navigator.vibrate?.(ok ? 15 : [30, 40, 30]);

    if (isInput) {
      go.textContent = '下一題';
    } else {
      choicesEl.querySelectorAll('.choice').forEach(b => {
        b.disabled = true;
        if (item.kana.romaji.includes(b.dataset.r)) b.classList.add('is-ok');
        else if (b.dataset.r === given) b.classList.add('is-ng');
      });
    }
    updateTop();
    if (ok && settings.autoNext) timer = setTimeout(show, 900);
    else if (!isInput) { next.hidden = false; next.focus({ preventScroll: true }); }
  }

  function finish() {
    clearTimeout(timer);
    if (!log.length) { location.hash = '#/'; return; }
    session.result = { log, ms: Date.now() - t0 };
    location.hash = '#/result';
  }

  replay.addEventListener('click', () => speak(item.kana.hira, { force: true }));
  $('finish')?.addEventListener('click', finish);

  if (isInput) {
    $('form').addEventListener('submit', e => {
      e.preventDefault();
      if (done) return show();
      const v = normalize(inp.value);
      if (v) judge(v);
      else inp.focus();
    });
    inp.addEventListener('input', () => {
      if (done || !settings.quickSubmit) return;
      const v = normalize(inp.value);
      if (ALL_ROMAJI.has(v) && !PREFIXES.has(v)) judge(v);
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
