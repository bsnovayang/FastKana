import { ICON } from '../ui.js';
import { speechInfo, onVoices } from '../core/speech.js';
import { installMode, promptInstall, onInstallChange } from '../pwa.js';

const card = (href, icon, title, desc, extra = '') => `
  <a class="card card-link${href ? '' : ' is-disabled'}" ${href ? `href="${href}"` : 'aria-disabled="true"'}>
    <span class="card-icon">${icon}</span>
    <span class="card-body"><h2>${title}${extra}</h2><p>${desc}</p></span>
    <span class="chev">${ICON.chev}</span>
  </a>`;

export function render(el) {
  el.innerHTML = `
    <header class="hero">
      <div class="hero-kana kana" aria-hidden="true">あ<span>ア</span></div>
      <h1>速學五十音</h1>
      <p>平假名・片假名，每天練一點</p>
    </header>
    <main class="stack">
      <a class="voice-warn" id="voiceWarn" href="#/settings" hidden>
        ⚠ 這台裝置可能沒有日文語音，點這裡看怎麼設定
      </a>
      <div class="install" id="install" hidden></div>
      ${card('#/learn', '<span class="kana">あ</span>', '學習模式', '點假名聽發音、比較長得像的字')}
      <h3 class="section-title">練習模式</h3>
      ${card('#/setup/input', '<span class="romaji">ka</span>', '輸入羅馬拼音', '看假名，打出拼音')}
      ${card('#/setup/choice', '<span class="romaji">1·2·3</span>', '選擇羅馬拼音', '三選一，不用打字')}
      ${card('#/setup/listen', ICON.sound, '聽音選字', '聽發音，三選一選出假名')}
      ${card('#/setup/write', '<span class="kana">書</span>', '聽音手寫', '聽發音，用手指寫出假名')}
      <h3 class="section-title">其他</h3>
      ${card('#/stats', '<span class="romaji">%</span>', '成績與弱點', '看哪些字最常錯，專門練弱點')}
      ${card('#/settings', ICON.gear, '設定', '發音、練習紀錄')}
      <p class="note credit">發音：VOICEVOX:No.7</p>
    </main>`;

  const warn = el.querySelector('#voiceWarn');
  const check = () => {
    const i = speechInfo();
    // 音檔能用就不需要裝置語音；只有音檔失敗、裝置語音也有問題時才提醒
    warn.hidden = !(i.audioFailed && (!i.supported || (i.voicesLoaded && !i.voice) || i.lastError));
  };
  check();
  const offVoices = onVoices(check);

  // 加到主畫面
  const installEl = el.querySelector('#install');
  const DISMISS = 'fastkana.installDismissed';
  const dismissed = () => { try { return localStorage.getItem(DISMISS) === '1'; } catch { return false; } };
  const drawInstall = () => {
    const mode = installMode();
    installEl.hidden = !mode || dismissed();
    if (installEl.hidden) return;
    installEl.innerHTML = `
      <img src="./icons/icon-192.png" alt="" width="48" height="48">
      <div class="install-text">
        <b>加到主畫面</b>
        <span>${mode === 'ios'
          ? `點下方的分享按鈕 ${SHARE_ICON}，再選「<b>加入主畫面</b>」`
          : '像 App 一樣開啟，沒網路也能練習'}</span>
      </div>
      ${mode === 'prompt' ? '<button class="btn btn-primary btn-sm" data-act="install">安裝</button>' : ''}
      <button class="icon-btn install-close" data-act="dismiss" aria-label="不用了">${ICON.close}</button>`;
  };
  installEl.addEventListener('click', async e => {
    const act = e.target.closest('button')?.dataset.act;
    if (act === 'install') { await promptInstall(); drawInstall(); }
    if (act === 'dismiss') {
      try { localStorage.setItem(DISMISS, '1'); } catch { /* 忽略 */ }
      drawInstall();
    }
  });
  drawInstall();
  const offInstall = onInstallChange(drawInstall);

  return () => { offVoices(); offInstall(); };
}

const SHARE_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px" aria-label="分享"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>';
