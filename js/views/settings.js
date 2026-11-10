import { settings, saveSettings } from '../core/settings.js';
import { clearStats } from '../core/stats.js';
import { speak, speechInfo, onVoices, isAndroid, isIOS, testEnglish, ttsModeName } from '../core/speech.js';
import { header, esc } from '../ui.js';
import { VERSION } from '../version.js';

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
        <label class="row-item">
          <span>語速<small id="rateVal">${settings.rate.toFixed(1)}×</small></span>
          <input type="range" id="rate" min="0.5" max="1.2" step="0.1" value="${settings.rate}" aria-label="語速">
        </label>
        <div class="row-item">
          <span>日文語音<small id="voice"></small></span>
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
        ${toggle('autoNext', '答對自動下一題', '答錯時會停下來讓你看正解')}
        ${toggle('quickSubmit', '打完自動送出', '輸入模式：拼音打完就判定，不用按確認')}
        ${toggle('showRomaji', '五十音表顯示拼音', '關掉可以當作自我測驗')}
      </div>

      <h3 class="section-title">資料</h3>
      <div class="list">
        <div class="row-item">
          <span>練習紀錄<small>只存在這台裝置的瀏覽器</small></span>
          <button class="btn btn-danger btn-sm" id="clear">清除</button>
        </div>
      </div>

      <p class="note">版本 ${VERSION}<br>字體：Klee One、Nunito（SIL Open Font License）</p>
    </main>`;

  const voiceEl = el.querySelector('#voice');
  const helpEl = el.querySelector('#help');
  const diagEl = el.querySelector('#diag');
  let enResult = '尚未測試';
  const showVoice = () => {
    const info = speechInfo();
    const v = info.voice;
    const err = info.lastError;
    voiceEl.innerHTML = !info.supported
      ? '<span class="ng-text">這個瀏覽器不支援語音</span>'
      : !info.voicesLoaded ? '讀取中…'
      : v ? `使用中：${esc(v.name)}`
      : '<span class="ng-text">找不到日文語音</span>';

    const noVoice = info.supported && info.voicesLoaded && !v;
    const failed = err && err !== 'interrupted';
    helpEl.hidden = !(noVoice || failed || !info.supported);
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

  el.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.key) { settings[t.dataset.key] = t.checked; saveSettings(); }
  });
  el.querySelector('#rate').addEventListener('input', e => {
    settings.rate = Number(e.target.value);
    el.querySelector('#rateVal').textContent = `${settings.rate.toFixed(1)}×`;
    saveSettings();
  });
  el.querySelector('#test').addEventListener('click', () => speak('あいうえお', { force: true }));
  el.querySelector('#testEn').addEventListener('click', () => {
    enResult = '測試中…';
    showVoice();
    testEnglish(r => { enResult = r; showVoice(); });
  });
  el.querySelector('#clear').addEventListener('click', e => {
    if (!confirm('確定要清除所有練習紀錄嗎？')) return;
    clearStats();
    e.target.textContent = '已清除';
    e.target.disabled = true;
  });

  return off;
}
