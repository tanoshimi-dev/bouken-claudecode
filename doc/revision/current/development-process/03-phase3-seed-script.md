# Phase 3: Seed スクリプト更新 — 完了レポート

**実施日:** 2026-03-04
**ステータス:** 完了

---

## 概要

`seed-content.ts` をマルチコンテンツ対応に更新。`doc/contents/<contentType>/module-*` ディレクトリ構造を自動検出し、複合ユニークキー `(contentType, number)` で upsert。外部コンテンツ（codex / gemini / githubcopilot）のフォーマット差異にも対応。

---

## 変更内容

### 修正ファイル

| ファイル | 変更内容 |
|---------|---------|
| `sys/scripts/seed-content.ts` | マルチコンテンツ対応の全面リライト |

### 主な変更点

#### 1. ディレクトリ構造対応

`main()` を `doc/contents/` 配下のサブディレクトリ（`claudecode/`, `codex/`, `gemini/`, `githubcopilot/`）を自動走査するように変更。各ディレクトリ名が `contentType` として使用される。

#### 2. 複合ユニークキーでの upsert

`seedModule(moduleDir, contentType)` に `contentType` 引数を追加。`prisma.module.upsert` の `where` を `contentType_number` 複合キーに変更。

#### 3. Quiz ID のスコープ化

Quiz ID を `quiz-${contentType}-module-${number}` 形式に変更（例: `quiz-claudecode-module-1`, `quiz-codex-module-1`）。

#### 4. `normalizeQuiz()` — 2 フォーマット対応

| フィールド | Format A (claudecode) | Format B (外部) |
|-----------|----------------------|----------------|
| 質問タイプ | `questionType` | `type` |
| 質問文 | `questionText` | `question` |
| 正解 | `correctAnswer` | `correct_answer` |
| 難易度 | トップレベル `difficulty` | 各質問ごと |
| ポイント | トップレベル `points` | 各質問ごと |

`normalizeQuiz()` が最初の質問のキー名で自動判定し、内部形式に正規化。

#### 5. `parseModuleReadme()` — 複数メタデータ形式対応

| 形式 | 検出方法 |
|-----|---------|
| YAML frontmatter | `---\nnumber: 1\n---` |
| ブロック引用メタデータ | `> **モジュール番号:** 1` |
| ディレクトリ名フォールバック | `module-01-xxx` → number=1 |

#### 6. 外部コンテンツのシンボリックリンク

```
doc/contents/codex       → /Volumes/SSD-PSTU3A/work/dev/bouken/bouken.app/contents/codex/doc/contents
doc/contents/gemini      → /Volumes/SSD-PSTU3A/work/dev/bouken/bouken.app/contents/gemini/doc/contents
doc/contents/githubcopilot → /Volumes/SSD-PSTU3A/work/dev/bouken/bouken.app/contents/githubcopilot/doc/contents
```

---

## Seed 実行結果

| コンテンツタイプ | モジュール数 | レッスン数 | クイズ数 |
|---------------|-----------|---------|--------|
| claudecode | 8 | 各モジュール複数 | 8 |
| codex | 12 | 各モジュール複数 | 12 |
| gemini | 12 | 各モジュール複数 | 12 |
| githubcopilot | 12 | 各モジュール複数 | 12 |
| **合計** | **44** | — | **44** |

---

## 修正した問題

### Prisma Client モジュール解決エラー

`pnpm install` 後、生成された Prisma Client が pnpm store の深いパスに配置され `.prisma/client/default` が解決不能に。

**修正:** `schema.prisma` の generator に `output = "../../../node_modules/.prisma/client"` を明示指定。

### 外部 quiz.json フォーマット不一致

codex / gemini / githubcopilot の quiz.json がフィールド名・構造ともに claudecode と異なっていた。

**修正:** `normalizeQuiz()` 関数を作成し、自動判定 + 正規化。

---

## 次のステップ

→ [Phase 4: Web フロントエンド](../development/04-phase4-web-frontend.md)
