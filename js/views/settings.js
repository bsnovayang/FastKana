import { settings, saveSettings } from '../core/settings.js';
import { clearStats } from '../core/stats.js';
import { speak, hasSpeech, currentVoice, onVoices } from '../core/speech.js';
import { header, esc } from '../ui.js';

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

      <p class="note">字體：Klee One、Nunito（SIL Open Font License）</p>
    </main>`;

  const voiceEl = el.querySelector('#voice');
  const showVoice = () => {
    const v = currentVoice();
    voiceEl.innerHTML = !hasSpeech()
      ? '這個瀏覽器不支援語音'
      : v ? `使用中：${esc(v.name)}`
      : '<span class="ng-text">找不到日文語音</span>，請在系統設定安裝日文語音（iOS：設定 › 輔助使用 › 朗讀內容 › 聲音；Android：設定 › 文字轉語音）';
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
  el.querySelector('#clear').addEventListener('click', e => {
    if (!confirm('確定要清除所有練習紀錄嗎？')) return;
    clearStats();
    e.target.textContent = '已清除';
    e.target.disabled = true;
  });

  return off;
}
