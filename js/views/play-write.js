// 聽音手寫：聽發音 → 在畫布寫出假名 → 自動辨識（不確定時讓使用者自己判斷）
import { KANA } from '../data/kana.js';
import { settings } from '../core/settings.js';
import { record } from '../core/stats.js';
import { speak, preloadKana } from '../core/speech.js';
import { Quiz } from '../core/quiz.js';
import { createPad } from '../handwriting/canvas.js';
import { judge, strokeIssues, ACCEPT } from '../handwriting/recognizer.js';
import { strokeViewer } from '../stroke.js';
import { session } from '../state.js';
import { ICON } from '../ui.js';

// 候選字：同字種、不含拗音
const CANDS = {
  hira: KANA.filter(k => k.group !== 'yoon').map(k => k.hira),
  kata: KANA.filter(k => k.group !== 'yoon').map(k => k.kata),
};

export function render(el, s) {
  const pool = s.pool.filter(i => i.kana.group !== 'yoon');
  if (!pool.length) { location.replace('#/setup/write'); return; }

  preloadKana(pool.map(i => i.kana.hira));
  const quiz = new Quiz(pool, s.count);
  const log = [];
  const t0 = Date.now();
  let item = null, done = false, timer = 0, nOk = 0, nNg = 0, hintLevel = 0, viewer = null;

  el.innerHTML = `
    <header class="topbar play-top">
      <a class="icon-btn" href="#/" aria-label="離開練習">${ICON.close}</a>
      ${s.count
        ? '<div class="progress" role="progressbar" aria-label="進度"><div class="progress-bar" id="bar"></div></div>'
        : '<div class="progress-text" id="bar"></div>'}
      <div class="score"><span class="ok-text">✔ <b id="nOk">0</b></span><span class="ng-text">✘ <b id="nNg">0</b></span></div>
    </header>
    <main class="play play-write">
      <div class="write-top">
        <button class="listen-btn listen-sm" id="say" aria-label="再聽一次">${ICON.sound}</button>
        <div class="write-ask"><b id="ask"></b><span>聽發音，寫在下面的格子裡</span></div>
        <button class="btn btn-ghost btn-sm" id="hint">提示</button>
      </div>
      <div class="pad" id="pad"></div>
      <div class="pad-tools" id="tools">
        <button class="btn btn-ghost" id="undo">↶ 復原</button>
        <button class="btn btn-ghost" id="clear">清除</button>
        <button class="btn btn-primary" id="submit" disabled>送出</button>
      </div>
      <section class="write-result" id="result" hidden>
        <div class="write-answer">
          <div class="stroke-box" id="answerStrokes"></div>
          <div class="write-answer-info">
            <div class="feedback-title" id="fbTitle"></div>
            <div class="kana write-answer-kana" id="ansKana"></div>
            <div class="romaji" id="ansRomaji"></div>
            <div class="write-note" id="note"></div>
          </div>
        </div>
        <div class="self-check" id="selfCheck" hidden>
          <p>看不太出來，請對照標準字，自己判斷：</p>
          <div class="self-check-btns">
            <button class="btn btn-ghost" data-self="ng">✘ 寫錯了</button>
            <button class="btn btn-primary" data-self="ok">✔ 寫對了</button>
          </div>
        </div>
        <pre class="hw-debug" id="debug" hidden></pre>
        <div class="write-next">
          <button class="btn btn-ghost" id="replayStrokes">${ICON.replay} 筆順</button>
          <button class="btn btn-primary" id="next">下一題</button>
        </div>
      </section>
      ${s.count ? '' : '<button class="btn btn-ghost btn-block" id="finish">結束練習</button>'}
    </main>`;

  const $ = id => el.querySelector('#' + id);
  const padEl = $('pad'), tools = $('tools'), result = $('result'), submit = $('submit');
  const pad = createPad(padEl, { onChange: n => { submit.disabled = n === 0 || done; } });

  const say = () => speak(item.kana.hira, { force: true });

  function updateTop() {
    $('nOk').textContent = nOk;
    $('nNg').textContent = nNg;
    const bar = $('bar');
    if (s.count) bar.style.width = `${(quiz.asked - (done ? 0 : 1)) / s.count * 100}%`;
    else bar.textContent = `第 ${quiz.asked} 題`;
  }

  function show() {
    clearTimeout(timer);
    viewer?.stop();
    item = quiz.next();
    if (!item) return finish();
    done = false;
    hintLevel = 0;
    pad.clear();
    pad.lock(false);
    padEl.className = 'pad';
    $('ask').textContent = item.script === 'hira' ? '寫出平假名' : '寫出片假名';
    $('hint').disabled = false;
    tools.hidden = false;
    result.hidden = true;
    submit.disabled = true;
    updateTop();
    say();
  }

  function check() {
    if (done || !pad.count) return;
    const r = judge(pad.strokes, item.char, CANDS[item.script]);
    if (r.result === 'empty') return;
    done = true;
    pad.lock(true);
    tools.hidden = true;
    result.hidden = false;

    // 標準答案的筆順
    $('ansKana').textContent = item.char;
    $('ansRomaji').textContent = item.kana.romaji[0];
    viewer = strokeViewer($('answerStrokes'), item.char);

    const notes = [];
    const countOff = r.strokeCount !== r.expected;
    if (countOff) notes.push(`標準寫法是 ${r.expected} 畫（你寫了 ${r.strokeCount} 畫）`);
    // 字形對了才檢查筆順、方向（只提示，不影響對錯）
    if (!countOff && r.result !== 'ng') notes.push(...strokeIssues(pad.strokes, item.char).map(i => i.text));
    if (hintLevel) notes.push('有用提示');
    $('note').innerHTML = notes.map(n => `<span>${n}</span>`).join('');

    // 嚴格模式：筆畫數不對就算錯
    if (settings.hwStrict && countOff && r.result !== 'ng') {
      r.result = 'ng';
      r.best = item.char;
      r.strictFail = true;
    }

    if (settings.hwDebug) {
      $('debug').hidden = false;
      $('debug').textContent = `門檻 ${ACCEPT}｜正解排第 ${r.pos + 1}，距離 ${r.dTarget.toFixed(3)}\n`
        + r.list.slice(0, 5).map((x, i) => `${i + 1}. ${x.ch}  ${x.d.toFixed(3)}`).join('\n');
    } else {
      $('debug').hidden = true;
    }

    if (r.result === 'unsure') {
      $('fbTitle').className = 'feedback-title';
      $('fbTitle').textContent = '🤔 請自己判斷';
      $('selfCheck').hidden = false;
      $('next').hidden = true;
      viewer.play();
      return;
    }
    const msg = r.strictFail ? '筆畫數不對（嚴格模式）'
      : r.result === 'ng' && r.best !== item.char ? `你寫的比較像「${r.best}」` : '';
    finalize(r.result === 'ok', msg);
  }

  function finalize(ok, msg = '') {
    record(item, ok);
    log.push({ item, ok, given: '' });
    if (ok) nOk++; else { nNg++; quiz.retryLater(item); }
    $('selfCheck').hidden = true;
    $('next').hidden = false;
    padEl.classList.add(ok ? 'is-ok' : 'is-ng');
    $('fbTitle').className = 'feedback-title ' + (ok ? 'ok-text' : 'ng-text');
    $('fbTitle').textContent = ok ? '✔ 寫對了' : `✘ ${msg || '再練習一下'}`;
    navigator.vibrate?.(ok ? 15 : [30, 40, 30]);
    say();
    viewer.play();
    updateTop();
    $('next').focus({ preventScroll: true });
    if (ok && settings.autoNext) timer = setTimeout(show, 2200);
  }

  function finish() {
    clearTimeout(timer);
    if (!log.length) { location.hash = '#/'; return; }
    session.result = { log, ms: Date.now() - t0 };
    location.hash = '#/result';
  }

  $('say').addEventListener('click', say);
  $('undo').addEventListener('click', () => pad.undo());
  $('clear').addEventListener('click', () => pad.clear());
  submit.addEventListener('click', check);
  $('hint').addEventListener('click', () => {
    hintLevel++;
    pad.showHint(item.char, hintLevel);
    say();
  });
  $('selfCheck').addEventListener('click', e => {
    const v = e.target.closest('[data-self]')?.dataset.self;
    if (v) finalize(v === 'ok');
  });
  $('replayStrokes').addEventListener('click', () => viewer?.play());
  $('next').addEventListener('click', show);
  $('finish')?.addEventListener('click', finish);

  const onKey = e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (!done) pad.undo(); }
    else if (e.key === 'Enter') { e.preventDefault(); done ? (!$('next').hidden && show()) : check(); }
    else if (e.key === 'r' || e.key === 'R') say();
  };
  document.addEventListener('keydown', onKey);

  show();

  return () => {
    clearTimeout(timer);
    viewer?.stop();
    pad.destroy();
    document.removeEventListener('keydown', onKey);
  };
}
