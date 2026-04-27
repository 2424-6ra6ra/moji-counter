# moji-counter

日本語の文字数を **grapheme（人間が見える文字単位）** で正確にカウントする TypeScript ライブラリ。

`String.length` は UTF-16 コードユニット数、LLM はトークン数で数えるので、絵文字や濁点結合のある文章だと数字がずれる。`Intl.Segmenter` を使って **「人間がパッと見て数える文字数」** を返す。

- 本番依存ゼロ
- TypeScript 純粋関数
- 標準 API（`Intl.Segmenter`）のみ使用、Node.js 18+ / モダンブラウザで動く

---

## なぜ必要か

```ts
'👨‍👩‍👧‍👦'.length      // → 11（UTF-16 コードユニット数。人間視点では 1 文字）
[...'👨‍👩‍👧‍👦'].length   // → 7（コードポイント数。これも違う）
count('👨‍👩‍👧‍👦')        // → 1（人間視点。これが欲しい）

count('が')              // → 1（NFC でも NFD でも 1）
count('Hello, 世界! 🌏') // → 11
```

履歴書・エントリーシートの「800 文字以内」のような文字数制限を **正確に** 判定したいときに使う。

---

## インストール（息子向け）

このライブラリは **npm publish していません**。GitHub から直接 import するか、ファイルをコピペするかの 2 通り。

### 方法 1: GitHub から直接 import（推奨）

```bash
npm install github:2424-6ra6ra/moji-counter
```

- `package.json` の `dependencies` に GitHub URL が入る
- 普通の npm パッケージと同じように使える

```ts
import { count, countDetail } from 'moji-counter';

const text = '志望動機を 800 文字以内で記入してください。';
console.log(count(text));         // → 21
console.log(countDetail(text));   // → { grapheme: 21, charTypes: {...}, ... }
```

### 方法 2: ファイルコピペ

依存をできるだけ減らしたい / すぐ動かしたいときは、`src/index.ts` と `src/charType.ts` を自分のプロジェクトの好きな場所にコピーする。

```bash
# 例: 自分のアプリの src/lib/ にコピー
mkdir -p src/lib/moji-counter
cp ~/Downloads/moji-counter/src/index.ts src/lib/moji-counter/
cp ~/Downloads/moji-counter/src/charType.ts src/lib/moji-counter/
```

```ts
import { count } from './lib/moji-counter/index';
```

---

## API

### `count(text: string): number`

grapheme 数だけを返す簡易版。

```ts
count('');                 // 0
count('hello');            // 5
count('日本語');           // 3
count('👨‍👩‍👧‍👦');           // 1（家族絵文字 ZWJ）
count('が');               // 1（NFD 結合）
count('🇯🇵');              // 1（国旗）
```

### `countDetail(text: string): CountResult`

詳細版。1 度の走査で全項目を計算する。

```ts
countDetail('私はAIエンジニア123人と話した。')
// {
//   grapheme: 18,           // 人間視点の文字数
//   codePoint: 18,          // Unicode コードポイント数
//   withoutWhitespace: 18,  // 空白除外
//   withoutNewline: 18,     // 改行除外
//   lineCount: 1,
//   utf8Bytes: 50,          // サーバー送信時のサイズ目安
//   charTypes: {
//     hiragana: 4,          // は, と, し, た
//     katakana: 5,          // エ, ン, ジ, ニ, ア
//     kanji: 3,             // 私, 人, 話
//     alphanumeric: 5,      // A, I, 1, 2, 3
//     symbol: 1,            // 。
//     other: 0
//   }
// }
```

### `segment(text: string): string[]`

grapheme クラスター単位で配列に分ける。何文字目を判定したいときに使う。

```ts
segment('日本語👨‍👩‍👧‍👦');
// → ['日', '本', '語', '👨‍👩‍👧‍👦']
```

---

## 文字数制限チェックの実例

```ts
import { count } from 'moji-counter';

function checkEssayLimit(text: string, max: number): {
  ok: boolean;
  current: number;
  remaining: number;
} {
  const current = count(text);
  return {
    ok: current <= max,
    current,
    remaining: max - current,
  };
}

const result = checkEssayLimit('志望動機を書きます👨‍👩‍👧‍👦', 800);
// { ok: true, current: 11, remaining: 789 }
```

---

## テスト

```bash
npm install
npm test
```

境界値テストを 30 件用意してあります（空文字 / ASCII / 絵文字 ZWJ / 濁点結合 / 半角全角混在 / 改行混在 / CRLF / 国旗絵文字 / etc）。

---

## 仕様メモ

- **grapheme クラスター**: `Intl.Segmenter('ja', { granularity: 'grapheme' })` で分割。家族絵文字や ZWJ シーケンス、濁点結合（NFD）を 1 文字として扱う
- **行数の数え方**: `\n` 区切り。末尾の改行は数えない（例: `"abc\n"` は 1 行）。`\r\n` は `Intl.Segmenter` が 1 grapheme として扱う
- **文字種分類**: 結合文字を含む grapheme は **先頭のベースコードポイント** で判定する（例: NFD の「が」= か + 濁点 → ひらがな）
- **空白判定**: `/\s/` に一致する grapheme（半角スペース、タブ、全角スペース U+3000、改行など）

---

## ライセンス

MIT

---

## 関連

- [Intl.Segmenter (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)
- [Unicode® Standard Annex #29: Text Segmentation](https://unicode.org/reports/tr29/)
