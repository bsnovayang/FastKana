import { settings, saveSettings } from '../core/settings.js';
import { clearStats, exportStats, importStats, dateKey } from '../core/stats.js';
import { speakSequence, speechInfo, onVoices, isAndroid, isIOS, testEnglish, ttsModeName } from '../core/speech.js';
import { header, esc } from '../ui.js';
import { VERSION } from '../version.js';
import { offlineReady } from '../pwa.js';

const toggle = (key, title, desc) => `
  <label class="row-item">
    <span>${title}${desc ? `<small>${desc}</small>` : ''}</span>
    <input type="checkbox" class="switch" data-key="${key}" ${settings[key] ? 'checked' : ''}>
  </label>`;

export function render(el) {
  el.innerHTML = `
    ${header('設定')}
    <main class="stack">
      <h3 class="section-title">發音</h3>
      <div class="list">
        ${toggle('sound', '播放發音', '答題後念出假名')}
        <div class="row-item">
          <span>聲音來源<small id="voice"></small></span>
          <button class="btn btn-ghost btn-sm" id="test">試聽</button>
        </div>
      </div>
      <div class="panel help" id="help" hidden></div>
      <details class="diag">
        <summary>語音診斷（沒聲音時請截圖給開發者）</summary>
        <pre id="diag"></pre>
        <button class="btn btn-ghost btn-sm" id="testEn">測試英文發音</button>
      </details>

      <h3 class="section-title">練習</h3>
      <div class="list">
        <div class="row-item row-col">
          <span>每日目標<small>首頁會顯示今天的進度和連續天數</small></span>
          <div class="seg" id="goal" role="radiogroup" aria-label="每日目標題數">
            ${[10, 20, 30, 50].map(n => `<button data-v="${n}" role="radio" aria-checked="${n === settings.dailyGoal}" class="${n === settings.dailyGoal ? 'is-on' : ''}">${n} 題</button>`).join('')}
          </div>
        </div>
        ${toggle('autoNext', '答對自動下一題', '答錯時會停下來讓你看正解')}
        ${toggle('quickSubmit', '打完自動送出', '輸入模式：拼音打完就判定，不用按確認')}
        ${toggle('showRomaji', '五十音表顯示拼音', '關掉可以當作自我測驗')}
        ${toggle('hwStrict', '手寫嚴格模式', '筆畫數不對就算錯')}
        ${toggle('hwDebug', '手寫辨識除錯', '送出後顯示候選字與分數（測試用）')}
      </div>

      <h3 class="section-title">資料</h3>
      <div class="list">
        <div class="row-item">
          <span>離線使用<small id="offline">檢查中…</small></span>
        </div>
        <div class="row-item">
          <span>備份練習紀錄<small>換手機時，先匯出，再到新手機匯入</small></span>
          <span class="row-btns">
            <button class="btn btn-ghost btn-sm" id="export">匯出</button>
            <button class="btn btn-ghost btn-sm" id="import">匯入</button>
            <input type="file" id="importFile" accept="application/json,.json" hidden>
          </span>
        </div>
        <div class="row-item">
          <span>練習紀錄<small>只存在這台裝置的瀏覽器</small></span>
          <button class="btn btn-danger btn-sm" id="clear">清除</button>
        </div>
      </div>

      <p class="note">版本 ${VERSION}<br>發音：Google Gemini TTS<br>筆順：<a href="https://kanjivg.tagaini.net/" target="_blank" rel="noopener">KanjiVG</a>（CC BY-SA 3.0）<br>字體：Klee One、Nunito（SIL Open Font License）</p>
    </main>`;

  const voiceEl = el.querySelector('#voice');
  const helpEl = el.querySelector('#help');
  const diagEl = el.querySelector('#diag');
  let enResult = '尚未測試';
  const showVoice = () => {
    const info = speechInfo();
    const v = info.voice;
    const err = info.lastError;
    voiceEl.innerHTML = info.audio
      ? '內建音檔（Gemini TTS）'
      : !info.supported
      ? '<span class="ng-text">音檔載入失敗，且瀏覽器不支援語音</span>'
      : !info.voicesLoaded ? '讀取中…'
      : v ? `音檔載入失敗，改用裝置語音：${esc(v.name)}`
      : '<span class="ng-text">音檔載入失敗，也找不到日文語音</span>';

    // 只有音檔不能用、只能靠裝置語音時，才需要教使用者設定
    const noVoice = info.supported && info.voicesLoaded && !v;
    const failed = err && err !== 'interrupted';
    helpEl.hidden = info.audio || !(noVoice || failed || !info.supported);
    helpEl.innerHTML = !info.supported
      ? '<p>這個瀏覽器不能播放語音，請改用手機內建的 Chrome 或 Safari。</p>'
      : `<p><b>${failed ? `播放失敗（${esc(err)}）` : '沒有找到日文語音'}</b>，請照下面步驟設定後，重新開啟這個網頁：</p>
        ${err === 'synthesis-failed' ? '<p class="help-why">這通常是手機列出了日文語音，但<b>語音資料還沒下載</b>。可以先按下方「測試英文發音」：英文有聲音、日文沒有，就是這個原因，請做第 4 步。</p>' : ''}
        ${isAndroid ? `<ol>
          <li>確認<b>媒體音量</b>有打開（按音量鍵時調的是「媒體」）</li>
          <li>開啟手機「設定」，搜尋「<b>文字轉語音</b>」</li>
          <li>「偏好的引擎」選 <b>Google 語音服務</b></li>
          <li>點引擎旁的齒輪 ⚙ →「安裝語音資料」→ 下載<b>日文（日本）</b></li>
          <li>沒有 Google 語音服務的話，到 Play 商店安裝「Google 語音服務」</li>
        </ol>` : isIOS ? `<ol>
          <li>確認手機沒有開<b>靜音</b>（側邊開關）</li>
          <li>設定 › 輔助使用 › 朗讀內容 › 聲音 › 日文，下載一個聲音</li>
        </ol>` : '<p>請在作業系統的語音設定中安裝日文語音。</p>'}`;

    diagEl.textContent = [
      `版本：${VERSION}`,
      `音檔：${info.audioFailed ? '載入失敗' : info.audio ? '可用' : '瀏覽器不支援 Web Audio'}`,
      `瀏覽器：${navigator.userAgent}`,
      `支援語音：${info.supported ? '是' : '否'}`,
      `語音數量：${info.voiceCount}${info.voicesLoaded ? '' : '（讀取中）'}`,
      `日文語音：${v ? `${v.name}（${v.lang}${v.localService ? '，本機' : '，雲端'}）` : '無'}`,
      `播放方式：${ttsModeName()}`,
      `曾成功播放：${info.lastOk ? '是' : '否'}`,
      `最近錯誤：${err || '無'}`,
      `英文測試：${enResult}`,
    ].join('\n');
  };
  showVoice();
  const off = onVoices(showVoice);

  offlineReady().then(ok => {
    el.querySelector('#offline').innerHTML = ok
      ? '<span class="ok-text">✔ 已下載，沒網路也能練習</span>'
      : 'Wi-Fi 下開啟一次後就會自動下載（約 0.5MB）';
  });

  el.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.key) { settings[t.dataset.key] = t.checked; saveSettings(); }
  });
  el.querySelector('#test').addEventListener('click', async () => {
    await speakSequence(['あ', 'い', 'う', 'え', 'お']);
    showVoice();
  });
  el.querySelector('#testEn').addEventListener('click', () => {
    enResult = '測試中…';
    showVoice();
    testEnglish(r => { enResult = r; showVoice(); });
  });
  el.querySelector('#clear').addEventListener('click', e => {
    if (!confirm('確定要清除所有練習紀錄嗎？（包括每日進度和連續天數）')) return;
    clearStats();
    e.target.textContent = '已清除';
    e.target.disabled = true;
  });

  // 每日目標
  el.querySelector('#goal').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    settings.dailyGoal = Number(b.dataset.v);
    saveSettings();
    el.querySelectorAll('#goal button').forEach(x => {
      x.classList.toggle('is-on', x === b);
      x.setAttribute('aria-checked', x === b);
    });
  });

  // 匯出：手機上用分享選單（可以存到檔案、傳到 LINE），不支援就直接下載
  el.querySelector('#export').addEventListener('click', async () => {
    const { range, ...prefs } = settings;
    const data = { app: 'fastkana', format: 1, exportedAt: new Date().toISOString(), version: VERSION, settings: { ...prefs, range }, ...exportStats() };
    const name = `速學五十音-備份-${dateKey()}.json`;
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const file = new File([blob], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '速學五十音 練習紀錄備份' });
        return;
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // 使用者取消分享
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  // 匯入
  const fileInput = el.querySelector('#importFile');
  el.querySelector('#import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files[0];
    fileInput.value = '';
    if (!f) return;
    try {
      const obj = JSON.parse(await f.text());
      if (obj.app !== 'fastkana') throw new Error('這不是速學五十音的備份檔');
      const n = Object.keys(obj.stats || {}).length;
      if (!confirm(`要匯入這份備份嗎？（${obj.exportedAt?.slice(0, 10) || '日期不明'}，${n} 個字的紀錄）\n目前這台裝置的練習紀錄會被取代。`)) return;
      importStats(obj);
      if (obj.settings && typeof obj.settings === 'object') {
        for (const k of Object.keys(settings)) if (k in obj.settings) settings[k] = obj.settings[k];
        saveSettings();
      }
      alert('匯入完成！');
      location.reload();
    } catch (err) {
      alert(`匯入失敗：${err.message}`);
    }
  });

  return off;
}
