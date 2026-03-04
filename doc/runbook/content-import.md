# コンテンツインポート仕様

学習コンテンツ（モジュール・レッスン・クイズ）をファイルシステムからデータベースにインポートする仕組みの仕様書。

---

## 概要

```
doc/contents/           ──(pnpm db:seed)──▶   PostgreSQL
  module-XX-*/                                  ├── modules
    README.md                                   ├── lessons
    lesson-*.md                                 ├── quizzes
    quiz.json                                   └── quiz_questions
```

- **インポーター**: `sys/scripts/seed-content.ts`
- **実行コマンド**: `pnpm db:seed`（ルートの `sys/` ディレクトリで実行）
- **冪等性**: Prisma `upsert` により何度実行しても安全

---

## ディレクトリ構成

```
doc/contents/
├── module-01-introduction/
│   ├── README.md
│   ├── lesson-1.md
│   ├── lesson-2.md
│   ├── lesson-3.md
│   └── quiz.json
├── module-02-prompt-engineering/
│   ├── README.md
│   ├── lesson-1.md
│   ├── lesson-2.md
│   ├── lesson-3.md
│   └── quiz.json
└── module-03-practical-projects/
    ├── README.md
    ├── lesson-1.md
    ├── lesson-2.md
    ├── lesson-3.md
    └── quiz.json
```

### ディレクトリ命名規則

- パターン: `module-XX-<name>/`
- `XX`: 2桁のモジュール番号（ソート用、README.md 内の `number` が正式な番号）
- `<name>`: 英語のスラッグ（ハイフン区切り）
- インポーターは `module-` プレフィックスのディレクトリを自動検出する

---

## ファイル形式

### README.md（モジュール定義）

YAML frontmatter + Markdown タイトルで構成。

```markdown
---
number: 1
description: Claude Codeの基本的な使い方と環境設定を学びます
estimatedMinutes: 30
---

# Claude Code 入門
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `number` | int | Yes | モジュール番号（DB の一意キー） |
| `description` | string | Yes | モジュールの説明文 |
| `estimatedMinutes` | int | No | 推定学習時間（デフォルト: 15） |
| `# タイトル` | Markdown H1 | Yes | モジュールタイトル |

**DBマッピング**:

| frontmatter | DB カラム (`modules`) |
|-------------|----------------------|
| `number` | `number` (unique) |
| `# タイトル` | `title` |
| `description` | `description` |
| `estimatedMinutes` | `estimated_minutes` |
| _(自動)_ | `is_published = true` |

### lesson-*.md（レッスン定義）

Markdown ファイル。先頭行の `# タイトル` がレッスンタイトルとして使用される。

```markdown
# Claude Codeとは

Claude Code は Anthropic が提供する...
（本文）
```

| 要素 | 説明 |
|------|------|
| ファイル名 | `lesson-N.md`（N = 数字、ソート順がレッスン順序になる） |
| `# タイトル` | 先頭行の H1 見出しがレッスンタイトル |
| 本文 | Markdown（GFM 対応）。コードブロック、テーブル、リスト等使用可 |

**ソート順序**:
- ファイル名のアルファベット順でソートされる
- `lesson-1.md` → order: 1, `lesson-2.md` → order: 2, ...

**DBマッピング**:

| 要素 | DB カラム (`lessons`) |
|------|----------------------|
| `# タイトル` | `title` |
| ファイル全体 | `content_md` |
| ソート順 | `order` |
| _(自動)_ | `lesson_type = 'tutorial'` |
| _(自動)_ | `is_published = true` |
| _(自動)_ | `module_id` = 親モジュールの ID |

### quiz.json（クイズ定義）

```json
{
  "title": "Claude Code 入門クイズ",
  "difficulty": "easy",
  "points": 100,
  "questions": [
    {
      "questionType": "multiple_choice",
      "questionText": "Claude Codeを起動するコマンドはどれですか？",
      "options": ["claude", "claude-code", "cc", "anthropic"],
      "correctAnswer": "claude",
      "explanation": "Claude Codeはターミナルで `claude` コマンドを実行して起動します。"
    },
    {
      "questionType": "true_false",
      "questionText": "Claude Codeはファイルの読み書きができる。",
      "options": ["正しい", "誤り"],
      "correctAnswer": "正しい",
      "explanation": "Claude Codeはファイルシステムへのアクセスが可能で、ファイルの読み取り・作成・編集ができます。"
    }
  ]
}
```

**トップレベル**:

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `title` | string | Yes | クイズタイトル |
| `difficulty` | `"easy"` \| `"medium"` \| `"hard"` | Yes | 難易度 |
| `points` | int | Yes | 獲得可能ポイント |
| `questions` | array | Yes | 問題の配列 |

**questions[i]**:

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `questionType` | `"multiple_choice"` \| `"true_false"` | Yes | 問題形式 |
| `questionText` | string | Yes | 問題文 |
| `codeSnippet` | string | No | コードスニペット（問題に関連するコード） |
| `options` | string[] | Yes | 選択肢の配列 |
| `correctAnswer` | string | Yes | 正解（`options` の要素の1つ） |
| `explanation` | string | Yes | 解説文 |

**DBマッピング**:

| 要素 | DB テーブル / カラム |
|------|---------------------|
| トップレベル | `quizzes` テーブル |
| `title` | `quizzes.title` |
| `difficulty` | `quizzes.difficulty` |
| `points` | `quizzes.points` |
| _(自動)_ | `quizzes.id = 'quiz-module-{number}'` |
| _(自動)_ | `quizzes.module_id` = 親モジュールの ID |
| `questions[i]` | `quiz_questions` テーブル |
| `questions[i].questionType` | `quiz_questions.question_type` |
| `questions[i].questionText` | `quiz_questions.question_text` |
| `questions[i].codeSnippet` | `quiz_questions.code_snippet` |
| `questions[i].options` | `quiz_questions.options` (JSON) |
| `questions[i].correctAnswer` | `quiz_questions.correct_answer` (JSON) |
| `questions[i].explanation` | `quiz_questions.explanation` |
| _(配列index)_ | `quiz_questions.order` |

---

## インポーター詳細

### 実行方法

```bash
cd sys
pnpm db:seed
```

内部で実行されるコマンド:
```bash
tsx --env-file=.env ../../scripts/seed-content.ts
```

### 処理フロー

```
1. doc/contents/ ディレクトリを走査
2. module-* プレフィックスのサブディレクトリを取得（アルファベット順ソート）
3. 各モジュールディレクトリに対して:
   a. README.md を読み込み → frontmatter + タイトルをパース
   b. modules テーブルに upsert（number をキー）
   c. lesson-*.md をアルファベット順ソートで取得
   d. 各レッスンの # タイトルと全文を取得
   e. lessons テーブルに upsert（moduleId + order をキー）
   f. quiz.json が存在すれば読み込み
   g. quizzes テーブルに upsert（id = 'quiz-module-{number}' をキー）
   h. 既存の quiz_questions を全削除 → 再作成
```

### 冪等性

| テーブル | 方式 | upsert キー |
|---------|------|------------|
| `modules` | upsert | `number` |
| `lessons` | upsert | `moduleId` + `order` |
| `quizzes` | upsert | `id` (`quiz-module-{number}`) |
| `quiz_questions` | delete + recreate | `quizId` で全削除後に再作成 |

### 注意事項

- quiz_questions は upsert ではなく **全削除 + 再作成** のため、問題の順序変更や追加削除が安全に反映される
- `isPublished` フラグは自動で `true` に設定される
- レッスンの `lessonType` はデフォルトで `tutorial` に設定される
- `doc/contents/` ディレクトリが存在しない場合は自動作成される

---

## 新しいモジュールの追加手順

### 1. ディレクトリ作成

```bash
mkdir doc/contents/module-04-advanced-topics
```

### 2. README.md 作成

```markdown
---
number: 4
description: 新しいモジュールの説明
estimatedMinutes: 45
---

# モジュールタイトル
```

### 3. レッスンファイル作成

```bash
# lesson-1.md, lesson-2.md, ... の形式で作成
touch doc/contents/module-04-advanced-topics/lesson-1.md
```

各ファイルの先頭に `# レッスンタイトル` を記載。

### 4. クイズファイル作成

`quiz.json` を作成。上記のフォーマットに従い、`questions` 配列に問題を追加。

### 5. インポート実行

```bash
cd sys
pnpm db:seed
```

### 6. 確認

```bash
pnpm db:studio    # Prisma Studio でブラウザから確認
```

---

## 既存コンテンツの編集

1. `doc/contents/` 内の該当ファイルを直接編集
2. `pnpm db:seed` を再実行
3. upsert により既存データが更新される

**注意**: レッスンのファイル名の番号（`lesson-N.md`）は順序を決定するため、途中に挿入する場合はリナンバリングが必要。

---

## トラブルシューティング

### "Contents directory does not exist yet"

`doc/contents/` ディレクトリが存在しない場合に表示される。自動作成されるので、コンテンツファイルを追加して再実行。

### "No module directories found"

`doc/contents/` 内に `module-` プレフィックスのディレクトリがない場合に表示される。

### "Skipping {dir}: no README.md"

該当ディレクトリに `README.md` が存在しない場合にスキップされる。

### Prisma 接続エラー

```bash
# .env ファイルに DATABASE_URL が設定されているか確認
cat sys/backend/api/.env | grep DATABASE_URL

# PostgreSQL が起動しているか確認
docker compose ps
```

1. bouken.appディレクトリの対象コンテンツをアプリにコピー
例）
/bouken.app/contents/codex/doc/contents
↓
/xxx/bouken.app/ai/doc/contents/codex

2. アプリにインポートする

アプリディレクトリ
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm -v $(pwd)/doc:/doc -v $(pwd)/scripts:/app/scripts api node --import tsx /app/scripts/seed-content.ts 
```