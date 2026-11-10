// 假名資料：清音、濁音・半濁音、拗音
const B = '・'; // 空格
const VOWELS = 'aiueo';

const SEION = [
  ['a',  'あいうえお', 'アイウエオ', 'a i u e o'],
  ['ka', 'かきくけこ', 'カキクケコ', 'ka ki ku ke ko'],
  ['sa', 'さしすせそ', 'サシスセソ', 'sa shi su se so'],
  ['ta', 'たちつてと', 'タチツテト', 'ta chi tsu te to'],
  ['na', 'なにぬねの', 'ナニヌネノ', 'na ni nu ne no'],
  ['ha', 'はひふへほ', 'ハヒフヘホ', 'ha hi fu he ho'],
  ['ma', 'まみむめも', 'マミムメモ', 'ma mi mu me mo'],
  ['ya', 'や・ゆ・よ', 'ヤ・ユ・ヨ', 'ya - yu - yo'],
  ['ra', 'らりるれろ', 'ラリルレロ', 'ra ri ru re ro'],
  ['wa', 'わ・・・を', 'ワ・・・ヲ', 'wa - - - wo'],
  ['n',  'ん・・・・', 'ン・・・・', 'n - - - -'],
];

const DAKUON = [
  ['ga', 'がぎぐげご', 'ガギグゲゴ', 'ga gi gu ge go'],
  ['za', 'ざじずぜぞ', 'ザジズゼゾ', 'za ji zu ze zo'],
  ['da', 'だぢづでど', 'ダヂヅデド', 'da ji zu de do'],
  ['ba', 'ばびぶべぼ', 'バビブベボ', 'ba bi bu be bo'],
  ['pa', 'ぱぴぷぺぽ', 'パピプペポ', 'pa pi pu pe po'],
];

// 也接受的拼法
const ALT = {
  し: ['si'], ち: ['ti'], つ: ['tu'], ふ: ['hu'], じ: ['zi'],
  ぢ: ['di', 'dji'], づ: ['du', 'dzu'], を: ['o'], ん: ['nn'],
};

// 拗音：[平假名, 片假名, 標準字首, 其他字首]
const YOON = [
  ['き', 'キ', 'ky', []], ['し', 'シ', 'sh', ['sy']], ['ち', 'チ', 'ch', ['ty', 'cy']],
  ['に', 'ニ', 'ny', []], ['ひ', 'ヒ', 'hy', []], ['み', 'ミ', 'my', []],
  ['り', 'リ', 'ry', []], ['ぎ', 'ギ', 'gy', []], ['じ', 'ジ', 'j', ['zy', 'jy']],
  ['び', 'ビ', 'by', []], ['ぴ', 'ピ', 'py', []],
];
const SMALL = [['ゃ', 'ャ', 'a'], ['ゅ', 'ュ', 'u'], ['ょ', 'ョ', 'o']];

export const KANA = [];
export const GROUPS = [
  { id: 'seion', name: '清音', cols: 5, rows: [] },
  { id: 'dakuon', name: '濁音・半濁音', cols: 5, rows: [] },
  { id: 'yoon', name: '拗音', cols: 3, rows: [] },
];

function add(group, row, hira, kata, romaji, col) {
  const k = { hira, kata, romaji, group: group.id, row, col };
  KANA.push(k);
  return k;
}

function buildTable(group, table) {
  for (const [key, h, k, r] of table) {
    const hs = [...h], ks = [...k], rs = r.split(' ');
    const cells = hs.map((c, i) =>
      c === B ? null : add(group, key, c, ks[i], [rs[i], ...(ALT[c] || [])], VOWELS[i]));
    group.rows.push({ key, cells, label: cells.find(Boolean) });
  }
}

buildTable(GROUPS[0], SEION);
buildTable(GROUPS[1], DAKUON);
for (const [h, k, p, alts] of YOON) {
  const key = p + 'a';
  const cells = SMALL.map(([sh, sk, v]) =>
    add(GROUPS[2], key, h + sh, k + sk, [p + v, ...alts.map(a => a + v)], v));
  GROUPS[2].rows.push({ key, cells, label: cells[0] });
}

// 長得像的字
const SIMILAR = [
  'あおめぬ', 'いりこ', 'うらつ', 'さちき', 'われね', 'はほけ', 'るろ', 'にたこ',
  'まもよ', 'しつ', 'くへ', 'シツ', 'ソンリノ', 'クケタ', 'ウワフラ', 'コユヨ',
  'アマ', 'チテ', 'ハル', 'ナメヌ', 'セサ', 'スヌ', 'カヤ', 'ロコ', 'エユ', 'ニコ',
];
const simMap = new Map();
for (const g of SIMILAR) {
  for (const c of g) {
    if (!simMap.has(c)) simMap.set(c, new Set());
    for (const d of g) if (d !== c) simMap.get(c).add(d);
  }
}
export const similarOf = ch => [...(simMap.get(ch) || [])];

export const KANA_BY_CHAR = new Map();
for (const k of KANA) {
  KANA_BY_CHAR.set(k.hira, { kana: k, script: 'hira' });
  KANA_BY_CHAR.set(k.kata, { kana: k, script: 'kata' });
}

// 用於「打完自動送出」：完整拼法、以及會是其他拼法開頭的字串
export const ALL_ROMAJI = new Set(KANA.flatMap(k => k.romaji));
export const PREFIXES = new Set();
for (const r of ALL_ROMAJI) for (let i = 1; i < r.length; i++) PREFIXES.add(r.slice(0, i));
