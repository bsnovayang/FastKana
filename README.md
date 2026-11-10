# 速學五十音

用手機練習日文平假名、片假名的小網站。

👉 **線上使用：https://bsnovayang.github.io/FastKana/**

## 功能

- **學習模式**：五十音表，點假名聽發音、看易混淆字
- **輸入羅馬拼音**：看假名打拼音，打完自動判定
- **選擇羅馬拼音**：三選一，不用打字
- **聽音選字**：聽發音，三選一選出假名
- **成績與弱點**：列出最常錯的字，一鍵專門練
- 可選平假名 / 片假名 / 混合，以及要練哪幾行
- 記錄每個假名的對錯，常錯的字會多出題
- **可加到主畫面、離線使用**（PWA，第一次開啟後自動下載約 0.5MB）
- **筆順動畫**：學習模式一筆一筆播放，可逐筆觀看
- 聽音手寫：開發中

## 本機執行

需要透過網頁伺服器開啟（直接開檔案無法載入 ES Modules），例如：

```
npx serve .
```

## 發音音檔

`audio/` 裡的 102 個 MP3 是用 [VOICEVOX](https://voicevox.hiroshiba.jp/)（No.7 アナウンス）產生的，瀏覽器不支援時才改用裝置語音。重新產生：

```
npm install
# 開啟 VOICEVOX 後
node tools/gen-audio.mjs
```

## 發佈

推送前先執行，幫 JS / CSS / 音檔加上版本號，並更新 Service Worker 的離線快取清單：

```
node tools/stamp.mjs
```

## 授權

- 發音：VOICEVOX:No.7（依 VOICEVOX 及角色使用規約標註）
- 筆順：[KanjiVG](https://kanjivg.tagaini.net/) © Ulrich Apel，CC BY-SA 3.0。由此轉換的 `js/data/strokes.js` 依同樣授權釋出（重新產生：`node tools/build-strokes.mjs`）
- 字體：Klee One、Nunito（SIL Open Font License 1.1），授權條款見 [fonts/](fonts/)
