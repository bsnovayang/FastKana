# 速學五十音

用手機練習日文平假名、片假名的小網站。

👉 **線上使用：https://bsnovayang.github.io/FastKana/**

## 功能

- **學習模式**：五十音表，點假名聽發音、看易混淆字、字源、描字練習
- **輸入羅馬拼音**：看假名打拼音，打完自動判定
- **選擇羅馬拼音**：三選一，不用打字
- **看拼音選字**：看羅馬拼音，三選一選出假名
- **聽音選字**：聽發音，三選一選出假名
- **平假名 ↔ 片假名**：看一種，選出對應的另一種
- **每日目標、連續天數**：首頁顯示今天進度
- **間隔重複複習**：依記憶曲線（1、3、7、14、30 天）提醒該複習的字
- **成績與弱點**：最近 7 天紀錄、最常錯的字，一鍵專門練
- **匯出／匯入練習紀錄**：換手機時可以帶走
- 可選平假名 / 片假名 / 混合，以及要練哪幾行
- 記錄每個假名的對錯，常錯的字會多出題
- **可加到主畫面、離線使用**（PWA，第一次開啟後自動下載約 0.5MB）
- **筆順動畫**：學習模式一筆一筆播放，可逐筆觀看
- **聽音手寫**：聽發音用手指寫，自動辨識（$P 點雲辨識 + 筆畫數比對，不確定時讓使用者自己判斷），提示筆順與筆畫方向錯誤，可開嚴格模式

## 本機執行

需要透過網頁伺服器開啟（直接開檔案無法載入 ES Modules），例如：

```
npx serve .
```

## 發音音檔

`audio/` 裡的 102 個 MP3 是用 Google Gemini TTS（`gemini-3.8-flash-tts`，聲音 Kore）產生的，瀏覽器不支援時才改用裝置語音。

重新產生需要 Gemini API 金鑰。請在專案資料夾建立 `.env.local`（已列入 `.gitignore`，不會上傳）：

```
GEMINI_API_KEY=你的金鑰
```

然後執行：

```
npm install
node --env-file=.env.local tools/gen-audio.mjs      # 全部重新產生
ONLY=wo,n node --env-file=.env.local tools/gen-audio.mjs  # 只重新產生指定的音
node tools/review-page.mjs                           # 產生音檔檢查頁 voice-test/（確認完可刪除）
```

原始音檔會快取在 `.cache/`，調整修剪參數時加 `FRESH=1` 才會重新呼叫 API。也可以改用 VOICEVOX：`ENGINE=voicevox node tools/gen-audio.mjs`。

## 發佈

推送前先執行，幫 JS / CSS / 音檔加上版本號，並更新 Service Worker 的離線快取清單：

```
node tools/stamp.mjs
```

## 授權

- 發音：Google Gemini TTS 產生
- 筆順：[KanjiVG](https://kanjivg.tagaini.net/) © Ulrich Apel，CC BY-SA 3.0。由此轉換的 `js/data/strokes.js` 依同樣授權釋出（重新產生：`node tools/build-strokes.mjs`）
- 字體：Klee One、Nunito（SIL Open Font License 1.1），授權條款見 [fonts/](fonts/)
