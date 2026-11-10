import { ICON } from '../ui.js';

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
      ${card('#/learn', '<span class="kana">あ</span>', '學習模式', '點假名聽發音、比較長得像的字')}
      <h3 class="section-title">練習模式</h3>
      ${card('#/setup/input', '<span class="romaji">ka</span>', '輸入羅馬拼音', '看假名，打出拼音')}
      ${card('#/setup/choice', '<span class="romaji">1·2·3</span>', '選擇羅馬拼音', '三選一，不用打字')}
      ${card('', '<span class="kana">書</span>', '聽音手寫', '聽發音，寫出假名', '<span class="badge">即將推出</span>')}
      <h3 class="section-title">其他</h3>
      ${card('#/settings', ICON.gear, '設定', '發音、語速、練習紀錄')}
    </main>`;
}
