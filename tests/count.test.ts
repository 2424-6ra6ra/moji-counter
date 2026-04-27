import { describe, it, expect } from 'vitest';
import { count, countDetail, segment } from '../src/index.js';

describe('count() — grapheme 数の簡易版', () => {
  it('空文字列は 0', () => {
    expect(count('')).toBe(0);
  });

  it('ASCII は文字数と一致', () => {
    expect(count('hello')).toBe(5);
  });

  it('日本語は人間視点の文字数', () => {
    expect(count('日本語')).toBe(3);
    expect(count('こんにちは')).toBe(5);
  });

  it('絵文字 ZWJ シーケンスは 1 文字', () => {
    // 家族絵文字: 👨 + ZWJ + 👩 + ZWJ + 👧 + ZWJ + 👦
    expect(count('👨‍👩‍👧‍👦')).toBe(1);
  });

  it('濁点結合は 1 文字（NFC でも NFD でも）', () => {
    // 「が」NFC: U+304C 1 字
    expect(count('が')).toBe(1);
    // 「が」NFD: か(U+304B) + 結合用濁点(U+3099)
    expect(count('が')).toBe(1);
  });

  it('国旗絵文字（リージョナルインジケータ）は 1 文字', () => {
    // 🇯🇵 = U+1F1EF + U+1F1F5
    expect(count('🇯🇵')).toBe(1);
  });
});

describe('countDetail() — 詳細版', () => {
  describe('境界値: 空文字', () => {
    it('全項目が 0', () => {
      const r = countDetail('');
      expect(r).toEqual({
        grapheme: 0,
        codePoint: 0,
        withoutWhitespace: 0,
        withoutNewline: 0,
        lineCount: 0,
        utf8Bytes: 0,
        charTypes: {
          hiragana: 0,
          katakana: 0,
          kanji: 0,
          alphanumeric: 0,
          symbol: 0,
          other: 0,
        },
      });
    });
  });

  describe('境界値: ASCII のみ', () => {
    it('hello の各値', () => {
      const r = countDetail('hello');
      expect(r.grapheme).toBe(5);
      expect(r.codePoint).toBe(5);
      expect(r.utf8Bytes).toBe(5);
      expect(r.charTypes.alphanumeric).toBe(5);
      expect(r.charTypes.hiragana).toBe(0);
    });

    it('Hello, World! の記号判定', () => {
      const r = countDetail('Hello, World!');
      expect(r.grapheme).toBe(13);
      expect(r.charTypes.alphanumeric).toBe(10); // H,e,l,l,o,W,o,r,l,d
      expect(r.charTypes.symbol).toBe(2); // , !
      expect(r.charTypes.other).toBe(1); // 半角スペース
      expect(r.withoutWhitespace).toBe(12);
    });
  });

  describe('境界値: 絵文字 ZWJ', () => {
    it('家族絵文字は 1 grapheme だがコードポイントは 7', () => {
      const family = '👨‍👩‍👧‍👦';
      const r = countDetail(family);
      expect(r.grapheme).toBe(1);
      // 4 emoji * 2 surrogate pairs each = 8 code units, but 4 emoji + 3 ZWJ = 7 code points
      expect(r.codePoint).toBe(7);
      expect(r.charTypes.symbol).toBe(1);
    });

    it('絵文字 + 日本語混在', () => {
      const r = countDetail('日本🇯🇵語');
      expect(r.grapheme).toBe(4); // 日, 本, 🇯🇵, 語
      expect(r.charTypes.kanji).toBe(3);
      expect(r.charTypes.symbol).toBe(1);
    });
  });

  describe('境界値: 濁点結合', () => {
    it('NFC の が（U+304C）は 1 文字 1 コードポイント', () => {
      const r = countDetail('が');
      expect(r.grapheme).toBe(1);
      expect(r.codePoint).toBe(1);
      expect(r.charTypes.hiragana).toBe(1);
    });

    it('NFD の が（か + 結合用濁点）は 1 grapheme 2 コードポイント', () => {
      const r = countDetail('が');
      expect(r.grapheme).toBe(1);
      expect(r.codePoint).toBe(2);
      expect(r.charTypes.hiragana).toBe(1); // 先頭 か で判定
    });
  });

  describe('境界値: 半角全角混在', () => {
    it('半角カナ・全角カナ・半角英数・全角英数', () => {
      const r = countDetail('ｱｲｳABCＡＢＣ１２３');
      expect(r.grapheme).toBe(12);
      expect(r.charTypes.katakana).toBe(3); // ｱｲｳ
      expect(r.charTypes.alphanumeric).toBe(9); // ABC ＡＢＣ １２３
    });

    it('日本語パラグラフ', () => {
      const r = countDetail('私はAIエンジニア123人と話した。');
      // 私(漢)は(平)A(英)I(英)エ(片)ン(片)ジ(片)ニ(片)ア(片)1(英)2(英)3(英)人(漢)と(平)話(漢)し(平)た(平)。(記)
      expect(r.charTypes.kanji).toBe(3); // 私, 人, 話
      expect(r.charTypes.hiragana).toBe(4); // は, と, し, た
      expect(r.charTypes.katakana).toBe(5); // エンジニア
      expect(r.charTypes.alphanumeric).toBe(5); // AI 123
      expect(r.charTypes.symbol).toBe(1); // 。
      expect(r.grapheme).toBe(18);
    });
  });

  describe('境界値: 改行混在', () => {
    it('単一行', () => {
      const r = countDetail('abc');
      expect(r.lineCount).toBe(1);
      expect(r.withoutNewline).toBe(3);
    });

    it('末尾改行は行数に含めない', () => {
      const r = countDetail('abc\n');
      expect(r.lineCount).toBe(1);
      expect(r.grapheme).toBe(4); // \n も grapheme として数える
      expect(r.withoutNewline).toBe(3);
    });

    it('複数行', () => {
      const r = countDetail('abc\ndef\nghi');
      expect(r.lineCount).toBe(3);
      expect(r.grapheme).toBe(11); // 9 文字 + \n 2 つ
      expect(r.withoutNewline).toBe(9);
    });

    it('複数行 + 末尾改行', () => {
      const r = countDetail('abc\ndef\n');
      expect(r.lineCount).toBe(2);
    });

    it('CRLF も 1 grapheme として扱う', () => {
      const r = countDetail('abc\r\ndef');
      // Intl.Segmenter は \r\n を 1 grapheme としてまとめる
      expect(r.grapheme).toBe(7); // a,b,c,\r\n,d,e,f
      expect(r.lineCount).toBe(2);
    });

    it('空行を含む', () => {
      const r = countDetail('a\n\nb');
      expect(r.lineCount).toBe(3); // a, 空, b
      expect(r.withoutNewline).toBe(2);
    });
  });

  describe('UTF-8 バイト数', () => {
    it('ASCII は 1 文字 1 バイト', () => {
      expect(countDetail('hello').utf8Bytes).toBe(5);
    });

    it('ひらがなは 1 文字 3 バイト', () => {
      expect(countDetail('あ').utf8Bytes).toBe(3);
      expect(countDetail('あいうえお').utf8Bytes).toBe(15);
    });

    it('絵文字は 4 バイト', () => {
      expect(countDetail('🎉').utf8Bytes).toBe(4);
    });
  });

  describe('charTypes 合計の整合性', () => {
    it('charTypes の合計は grapheme 数と一致する', () => {
      const samples = [
        '日本語',
        'Hello, World!',
        'ｱｲｳABCＡＢＣ１２３',
        'abc\ndef\nghi',
        '私はAIエンジニア123人と話した。',
      ];
      for (const text of samples) {
        const r = countDetail(text);
        const sum =
          r.charTypes.hiragana +
          r.charTypes.katakana +
          r.charTypes.kanji +
          r.charTypes.alphanumeric +
          r.charTypes.symbol +
          r.charTypes.other;
        expect(sum).toBe(r.grapheme);
      }
    });
  });

  describe('空白除外', () => {
    it('半角・全角・タブ・改行を除外', () => {
      const r = countDetail('a b\tc　d\ne');
      // a, ' ', b, \t, c, 　(全角), d, \n, e = 9 grapheme
      expect(r.grapheme).toBe(9);
      // 空白扱い: ' ', \t, 　, \n = 4 → withoutWhitespace = 5
      expect(r.withoutWhitespace).toBe(5);
    });
  });
});

describe('segment() — grapheme 配列', () => {
  it('空文字列は空配列', () => {
    expect(segment('')).toEqual([]);
  });

  it('日本語', () => {
    expect(segment('日本語')).toEqual(['日', '本', '語']);
  });

  it('家族絵文字は 1 要素', () => {
    expect(segment('👨‍👩‍👧‍👦')).toHaveLength(1);
  });

  it('濁点結合は 1 要素', () => {
    expect(segment('が')).toEqual(['が']);
  });
});
