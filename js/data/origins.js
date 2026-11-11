// 字源：假名從哪個漢字演變來的
// 平假名多來自漢字的草書；片假名多取漢字的一部分（偏旁）
const HIRA = 'あ安い以う宇え衣お於か加き幾く久け計こ己さ左し之す寸せ世そ曽た太ち知つ川て天と止な奈に仁ぬ奴ね祢の乃は波ひ比ふ不へ部ほ保ま末み美む武め女も毛や也ゆ由よ与ら良り利る留れ礼ろ呂わ和を遠ん无';
const KATA = 'ア阿イ伊ウ宇エ江オ於カ加キ幾ク久ケ介コ己サ散シ之ス須セ世ソ曽タ多チ千ツ川テ天ト止ナ奈ニ仁ヌ奴ネ祢ノ乃ハ八ヒ比フ不ヘ部ホ保マ末ミ三ム牟メ女モ毛ヤ也ユ由ヨ與ラ良リ利ル流レ礼ロ呂ワ和ヲ乎ン尓';

const map = new Map();
for (const s of [HIRA, KATA]) {
  const cs = [...s];
  for (let i = 0; i + 1 < cs.length; i += 2) map.set(cs[i], cs[i + 1]);
}

// 濁音、半濁音：拆掉濁點找基本字（が → か）
const BASE = Object.fromEntries(
  [...'がかぎきぐくげけごこざさじしずすぜせぞそだたぢちづつでてどとばはびひぶふべへぼほぱはぴひぷふぺへぽほ'
    + 'ガカギキグクゲケゴコザサジシズスゼセゾソダタヂチヅツデテドトバハビヒブフベヘボホパハピヒプフペヘポホ']
    .reduce((acc, c, i, arr) => (i % 2 ? acc : [...acc, [c, arr[i + 1]]]), []),
);

// 回傳 { kanji, base, note }；拗音只看第一個字
export function originOf(ch) {
  const first = [...ch][0];
  const base = BASE[first] || first;
  const kanji = map.get(base);
  if (!kanji) return null;
  const notes = [];
  if (base !== first) notes.push(`「${base}」加上${'ぱぴぷぺぽパピプペポ'.includes(first) ? '半濁點' : '濁點'}`);
  if ([...ch].length > 1) notes.push(`「${first}」加上小「${[...ch][1]}」`);
  if (base === 'ン') notes.push('來源有不同說法');
  return { kanji, base, note: notes.join('，') };
}
