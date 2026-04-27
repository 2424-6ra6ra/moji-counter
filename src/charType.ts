/**
 * grapheme クラスター単位で文字種を分類する。
 *
 * 入力は通常 1 文字（grapheme）だが、結合文字や ZWJ シーケンスを含む複数コードポイントの場合もある。
 * その場合は **先頭のベースコードポイント** で判定する。
 * 例: 「が」= か(ベース) + ゛ → ひらがな
 * 例: 👨‍👩‍👧‍👦 = 👨(ベース) + ZWJ + 👩 + ... → symbol（先頭の絵文字で判定）
 */

export type CharType =
  | 'hiragana'
  | 'katakana'
  | 'kanji'
  | 'alphanumeric'
  | 'symbol'
  | 'other';

// ひらがな: U+3041–U+309F（ぁ-ゟ、結合用半濁点・濁点・反復記号含む）
const HIRAGANA = /^[\u{3041}-\u{309F}]$/u;

// カタカナ: 全角 U+30A0–U+30FF + 拡張 U+31F0–U+31FF + 半角 U+FF66–U+FF9F
const KATAKANA = /^[\u{30A0}-\u{30FF}\u{31F0}-\u{31FF}\u{FF66}-\u{FF9F}]$/u;

// 漢字: CJK 統合漢字 + 拡張 A–G + 互換漢字
const KANJI =
  /^[\u{4E00}-\u{9FFF}\u{3400}-\u{4DBF}\u{F900}-\u{FAFF}\u{20000}-\u{2A6DF}\u{2A700}-\u{2B73F}\u{2B740}-\u{2B81F}\u{2B820}-\u{2CEAF}\u{2CEB0}-\u{2EBEF}\u{30000}-\u{3134F}]$/u;

// 英数字: ASCII A-Za-z0-9 + 全角 ０-９Ａ-Ｚａ-ｚ
const ALPHANUMERIC =
  /^[A-Za-z0-9\u{FF10}-\u{FF19}\u{FF21}-\u{FF3A}\u{FF41}-\u{FF5A}]$/u;

// 記号: Unicode の Punctuation または Symbol カテゴリ
const SYMBOL = /^[\p{P}\p{S}]$/u;

/**
 * grapheme クラスターから先頭のコードポイントを取り出して文字種を判定する。
 */
export function classify(grapheme: string): CharType {
  if (grapheme.length === 0) return 'other';

  // 先頭コードポイントを取り出す（サロゲートペアを 1 文字として扱う）
  const first = String.fromCodePoint(grapheme.codePointAt(0)!);

  if (HIRAGANA.test(first)) return 'hiragana';
  if (KATAKANA.test(first)) return 'katakana';
  if (KANJI.test(first)) return 'kanji';
  if (ALPHANUMERIC.test(first)) return 'alphanumeric';
  if (SYMBOL.test(first)) return 'symbol';
  return 'other';
}
