/**
 * moji-counter — 日本語の文字数を grapheme 単位で正確にカウント。
 *
 * String.length は UTF-16 コードユニット数なので、絵文字や濁点結合で人間視点と数字がずれる。
 * Intl.Segmenter で grapheme クラスター（人間が見える 1 文字）に分けてから数える。
 */

import { classify, type CharType } from './charType.js';

export type { CharType };

export interface CharTypeBreakdown {
  hiragana: number;
  katakana: number;
  kanji: number;
  alphanumeric: number;
  symbol: number;
  other: number;
}

export interface CountResult {
  /** 人間が見える文字数（grapheme クラスター数）。メイン指標。 */
  grapheme: number;
  /** Unicode コードポイント数（参考値）。grapheme より多くなることがある。 */
  codePoint: number;
  /** 空白（スペース・タブ・全角スペース等）を除いた grapheme 数。 */
  withoutWhitespace: number;
  /** 改行（\n \r）を除いた grapheme 数。 */
  withoutNewline: number;
  /** 行数（\n 区切り、空文字列なら 0、末尾改行は数えない）。 */
  lineCount: number;
  /** UTF-8 バイト数。サーバー送信時のサイズ目安。 */
  utf8Bytes: number;
  /** 文字種ごとの内訳（grapheme 単位）。合計は grapheme 数と一致する。 */
  charTypes: CharTypeBreakdown;
}

const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
const utf8Encoder = new TextEncoder();

/**
 * grapheme（人間が見える文字単位）に分割した配列を返す。
 *
 * @example
 * segment('👨‍👩‍👧‍👦') // ['👨‍👩‍👧‍👦']  ZWJ で結合された家族絵文字は 1 文字
 * segment('が')        // ['が']        か + 濁点でも 1 文字
 */
export function segment(text: string): string[] {
  if (text.length === 0) return [];
  const out: string[] = [];
  for (const seg of segmenter.segment(text)) {
    out.push(seg.segment);
  }
  return out;
}

/**
 * grapheme 数だけ返す簡易版。詳細が要らないとき用。
 */
export function count(text: string): number {
  if (text.length === 0) return 0;
  let n = 0;
  for (const _seg of segmenter.segment(text)) n++;
  return n;
}

/**
 * 全項目を 1 度の走査で計算する詳細版。
 *
 * @example
 * countDetail('日本語の文字')
 * // { grapheme: 6, codePoint: 6, ..., charTypes: { hiragana: 1, kanji: 5, ... } }
 */
export function countDetail(text: string): CountResult {
  const charTypes: CharTypeBreakdown = {
    hiragana: 0,
    katakana: 0,
    kanji: 0,
    alphanumeric: 0,
    symbol: 0,
    other: 0,
  };

  if (text.length === 0) {
    return {
      grapheme: 0,
      codePoint: 0,
      withoutWhitespace: 0,
      withoutNewline: 0,
      lineCount: 0,
      utf8Bytes: 0,
      charTypes,
    };
  }

  let grapheme = 0;
  let withoutWhitespace = 0;
  let withoutNewline = 0;

  for (const seg of segmenter.segment(text)) {
    const g = seg.segment;
    grapheme++;

    if (!isWhitespaceGrapheme(g)) withoutWhitespace++;
    if (!isNewlineGrapheme(g)) withoutNewline++;

    charTypes[classify(g)]++;
  }

  // コードポイント数: for...of は code point 単位で iterate される
  let codePoint = 0;
  for (const _cp of text) codePoint++;

  return {
    grapheme,
    codePoint,
    withoutWhitespace,
    withoutNewline,
    lineCount: countLines(text),
    utf8Bytes: utf8Encoder.encode(text).length,
    charTypes,
  };
}

/**
 * grapheme が空白文字のみで構成されているか。
 * 半角スペース / タブ / 全角スペース / その他の Unicode 空白を含む。
 */
function isWhitespaceGrapheme(g: string): boolean {
  // 改行は別カウント（withoutNewline）なので whitespace にも含める
  return /^\s+$/.test(g);
}

/**
 * grapheme が改行（\n または \r）のみか。\r\n は Intl.Segmenter で 1 grapheme になる。
 */
function isNewlineGrapheme(g: string): boolean {
  return g === '\n' || g === '\r' || g === '\r\n';
}

/**
 * 行数を数える。
 * - 空文字列: 0
 * - "abc": 1
 * - "abc\n": 1（末尾改行は数えない）
 * - "abc\ndef": 2
 * - "abc\ndef\n": 2
 */
function countLines(text: string): number {
  if (text.length === 0) return 0;
  // 末尾の改行を 1 つだけ削ってから \n の数 + 1
  const trimmed = text.endsWith('\n') ? text.slice(0, -1) : text;
  let count = 1;
  for (const ch of trimmed) {
    if (ch === '\n') count++;
  }
  return count;
}
