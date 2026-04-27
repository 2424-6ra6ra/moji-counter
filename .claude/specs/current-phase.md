# Phase 1 — moji-counter MVP

確定日: 2026-04-27
ブランチ: main（小規模ライブラリ・1 セッション完走目標のため main 直で進める）

---

## A. 機能の本質

1. **解決したい課題**: 日本語の文字数を「人間が見える文字単位」（grapheme）で正確にカウントしたい。LLM はトークン単位、`String.length` は UTF-16 コードユニット単位なので、絵文字 ZWJ や濁点結合で数字がずれる。
2. **ユーザー**: 息子（就活 AI アプリの開発者）と、そのアプリのエンドユーザー（履歴書・ES の文字数制限チェック）
3. **成功の定義**:
   - `import { count } from 'moji-counter'` で grapheme 数が返る
   - 絵文字 ZWJ（👨‍👩‍👧‍👦）が 1 文字、濁点結合（が = か+゛）が 1 文字
   - Vitest 全テスト pass
   - GitHub Public で息子が clone できる

---

## B. スコープ

### やること
- [ ] `count(text)` API: grapheme 数 / コードポイント数 / 空白除外 / 改行除外 / 行数 / UTF-8 バイト数 / 文字種分類（ひらがな・カタカナ・漢字・英数字・記号・その他）を 1 度の呼び出しで全部返す
- [ ] `Intl.Segmenter` を使用（Node.js 18+ で標準）
- [ ] TypeScript 純粋関数、本番依存ゼロ
- [ ] 開発依存: `typescript`, `vitest`, `@types/node` のみ
- [ ] 境界値テスト: 空文字 / ASCII / 絵文字 ZWJ / 濁点結合 / 半角全角混在 / 改行混在
- [ ] README に「息子が import する手順」明記（clone と直接コピペの両対応）
- [ ] GitHub Public push

### やらないこと（次フェーズ送り）
- ❌ npm publish（必要になったら追加）
- ❌ Cockpit Skill 化（`/count "テキスト"` で呼べるように → 後日 Issue 化）
- ❌ CLI バイナリ（ライブラリのみ）
- ❌ Web UI / プレイグラウンド
- ❌ 多言語対応（日本語＋ASCII で十分）
- ❌ ブラウザ専用最適化（Node.js + ブラウザ両方で動けば OK、特別な polyfill は入れない）
- ❌ 縦書き専用処理 / 段落カウント / 文（句点区切り）カウント
- ❌ パフォーマンス最適化（巨大文書向けストリーム処理）
- ❌ 文字数制限の警告 UI 機能（呼び出し側の責任）

### 想定期間
1 セッション（実装＋テスト＋README＋push まで）

---

## C. 技術的制約

| 項目 | 決定 |
|---|---|
| 言語 | TypeScript 5 系 |
| ランタイム | Node.js 20+ 推奨（18+ で動作、`Intl.Segmenter` は Node 16+） |
| 認証 | 不要（ライブラリ） |
| DB | 不要 |
| 外部 API | なし |
| デプロイ先 | GitHub Public のみ（npm publish なし） |
| モデル | 実装は writer (Sonnet 4.6) |
| ビルド | `tsc` で `dist/` に出力（ESM のみ） |
| エクスポート | `import { count, countDetail } from 'moji-counter'` |

---

## D. セキュリティ

| 項目 | 決定 |
|---|---|
| 機密データ | なし（純関数で文字列を数えるだけ） |
| プロンプトインジェクション対策 | 不要（テキストを `eval` しない、外部送信しない） |
| 多層防御 | 不要 |
| `.gitignore` | `node_modules/` `dist/` `.env*` `coverage/` を最初に置く（lessons/env-secrets-committed.md） |

---

## E. 参照した lessons

- `env-secrets-committed.md` — `.gitignore` を git init 直後に作成（直接該当はしないが規律として）
- `library-latest-breaking.md` — typescript / vitest はバージョン明示で固定
- `no-commit-discipline.md` — 1 セッション完走目標だが、節目で commit する

---

## API 詳細

```ts
export interface CountResult {
  grapheme: number;          // 人間が見える文字数（メイン）
  codePoint: number;         // U+ コードポイント数（参考）
  withoutWhitespace: number; // 空白を除いた grapheme 数
  withoutNewline: number;    // 改行を除いた grapheme 数
  lineCount: number;         // 行数（\n 区切り、末尾改行は数えない）
  utf8Bytes: number;         // UTF-8 バイト数
  charTypes: {
    hiragana: number;
    katakana: number;
    kanji: number;
    alphanumeric: number;    // 半角英数字（半角カナは katakana へ）
    symbol: number;          // 記号（句読点・括弧含む）
    other: number;
  };
}

export function count(text: string): number;             // grapheme 数だけ返す簡易版
export function countDetail(text: string): CountResult;  // 詳細版
```

---

## TODO（実装順）

- [ ] git init + .gitignore + GitHub Public repo 作成
- [ ] package.json + tsconfig.json + vitest.config.ts
- [ ] src/index.ts 実装
- [ ] src/charType.ts 実装（文字種分類）
- [ ] tests/ 境界値テスト
- [ ] `npm run test` 全 pass
- [ ] `npm run build` 成功
- [ ] README.md 完成（息子向けセクション）
- [ ] commit + push

---

## 完了判定

- [ ] テスト全件 pass
- [ ] `npm run build` で `dist/` 生成
- [ ] GitHub Public で公開、URL を息子に渡せる
- [ ] README で「import 1 行で使える」が伝わる
