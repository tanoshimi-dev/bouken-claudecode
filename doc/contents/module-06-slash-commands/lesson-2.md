# 開発支援コマンド

## はじめに

前のレッスンではセッション管理のための基本コマンドを学びました。このレッスンでは、コード開発の現場で直接役立つ**開発支援コマンド**を学びます。コードレビュー、プロジェクトの初期化、環境診断、そしてメモリ管理という4つの強力なコマンドが対象です。

## /review - コードレビュー

`/review` コマンドは、現在のGit変更差分（diff）に基づいて自動的にコードレビューを実施します。

```
> /review
```

### 動作の仕組み

`/review` を実行すると、Claude Codeは内部で以下を行います。

1. `git diff` を実行して変更内容を取得
2. 変更されたファイルのコンテキストを読み込む
3. 変更内容を分析してレビューコメントを生成
4. 問題点、改善提案、良い点をまとめて出力

**出力例:**

```
Code Review Summary
===================

Files changed: 3
  - src/api/users.ts (+45, -12)
  - src/middleware/auth.ts (+8, -0)
  - tests/api/users.test.ts (+32, -5)

Issues Found:
  [HIGH] src/api/users.ts:42
    - SQLインジェクションの可能性あり
    - パラメータをそのままクエリに使用しています
    + プリペアドステートメントまたはORMのパラメータバインディングを使用してください

  [MEDIUM] src/api/users.ts:78
    - エラーハンドリングが不足しています
    - データベースエラー時の処理が未実装です
    + try-catchブロックを追加し、適切なHTTPステータスコードを返してください

  [LOW] src/middleware/auth.ts:15
    - マジックナンバーが使用されています（3600）
    + 定数として定義することを推奨します（例: TOKEN_EXPIRY_SECONDS）

Positive Aspects:
  - テストカバレッジが適切に追加されています
  - 型定義が明確で読みやすいコードです

Overall: このPRはいくつかの重要な問題を修正する必要があります。
```

### PRレビューへの応用

特定のブランチやコミット範囲を指定することもできます。

```bash
# 特定のブランチとの差分をレビュー
> /review
# → 自動的に現在のブランチとmainブランチの差分を使用

# 指示を追加することで、レビューの観点を絞り込む
> セキュリティに特化してコードをレビューしてください
> パフォーマンスの観点からこのPRをレビューしてください
```

### チェックリストとの組み合わせ

```bash
# レビュー観点を指定してより詳細なフィードバックを得る
> /review

# レビュー後、特定の問題を修正
> src/api/users.ts の42行目のSQLインジェクション問題を修正してください

# 修正後に再レビュー
> /review
```

## /init - プロジェクトの初期化

`/init` コマンドは、プロジェクトを分析して `CLAUDE.md` ファイルを自動生成します。新しいプロジェクトでClaude Codeを使い始めるときに最初に実行するべきコマンドです。

```
> /init
```

### 動作の仕組み

1. プロジェクトのディレクトリ構造を探索
2. `package.json`、`pyproject.toml`、`go.mod` などの設定ファイルを読み込む
3. 技術スタックとフレームワークを自動検出
4. 既存のREADME.mdや設定ファイルを参照
5. `CLAUDE.md` を生成してプロジェクトルートに配置

**出力例:**

```
Analyzing project structure...

Detected:
  - Language: TypeScript (Node.js)
  - Framework: Express.js 4.18
  - Database: PostgreSQL (via Prisma ORM)
  - Testing: Jest + Supertest
  - Build tool: tsc

Reading configuration files:
  - package.json ✓
  - tsconfig.json ✓
  - prisma/schema.prisma ✓
  - .env.example ✓

Generating CLAUDE.md...

CLAUDE.md created successfully!
Location: /Users/dev/my-project/CLAUDE.md
```

### 生成されるCLAUDE.mdの例

```markdown
# プロジェクト概要

RESTful APIサーバー。ユーザー管理とデータ処理を担当。

## 技術スタック

- 言語: TypeScript 5.x
- ランタイム: Node.js 20.x
- フレームワーク: Express.js 4.18
- ORM: Prisma 5.x
- データベース: PostgreSQL 16
- テスト: Jest 29 + Supertest

## よく使うコマンド

- `npm run dev` - 開発サーバー起動（ts-node-dev使用）
- `npm test` - テスト実行
- `npm run build` - TypeScriptコンパイル
- `npm run migrate` - DBマイグレーション実行

## ディレクトリ構造

src/
  controllers/  # リクエストハンドラー
  services/     # ビジネスロジック
  middleware/   # Express ミドルウェア
  models/       # Prismaモデル定義
  utils/        # ユーティリティ関数

## コーディング規約

- ESLint + Prettier でコードフォーマット統一
- 非同期処理は async/await を使用
- エラーは AppError クラスで統一的に扱う
```

### /init 実行のタイミング

```bash
# 新しいプロジェクトをクローンした直後
git clone https://github.com/example/project.git
cd project
claude
> /init

# 既存プロジェクトにCLAUDE.mdがない場合
cd existing-project
claude
> /init

# プロジェクト構成が大きく変わった後（依存関係の更新など）
> /init
```

> **ヒント:** `/init` で生成されたCLAUDE.mdは出発点です。プロジェクト固有のルールや注意事項を手動で追記してカスタマイズしましょう。

## /doctor - 環境診断

`/doctor` は、Claude Codeの動作環境を診断し、設定上の問題や潜在的な不具合を検出してレポートします。

```
> /doctor
```

**出力例:**

```
Claude Code Diagnostics
=======================

System Information:
  OS:           macOS 15.3 (Darwin 25.3.0)
  Node.js:      v20.11.0 ✓
  npm:          10.2.4 ✓
  Git:          2.43.0 ✓
  Claude Code:  1.2.5 ✓

Configuration:
  API Key:      ✓ Set (ANTHROPIC_API_KEY)
  Config file:  ~/.claude/config.json ✓
  Permissions:  All required permissions granted ✓

Project Context:
  Working dir:  /Users/dev/my-project
  CLAUDE.md:    ✓ Found (project root)
  Git repo:     ✓ Detected (main branch)

Potential Issues:
  [WARNING] Context window usage is high (82%)
    Recommendation: Run /compact to free up context space

  [INFO] Model cache is cold
    First request may be slightly slower than usual

All critical checks passed.
```

### 問題が検出された場合

```
Potential Issues:
  [ERROR] API key not found
    ANTHROPIC_API_KEY environment variable is not set
    Fix: export ANTHROPIC_API_KEY="your-key-here"
    Or add it to ~/.claude/config.json

  [WARNING] Git not initialized in current directory
    /review and git-related features will be limited
    Fix: Run `git init` to initialize a repository

  [WARNING] CLAUDE.md not found
    Claude Code has no project context
    Fix: Run /init to generate a CLAUDE.md file
```

### /doctor の活用シーン

```bash
# セットアップ後の確認
npm install -g @anthropic-ai/claude-code
claude
> /doctor

# 動作がおかしいと感じたとき
> /doctor

# 新しい環境（CI/CDサーバーなど）での動作確認
> /doctor
```

## /memory - メモリ管理

`/memory` コマンドは、Claude Codeが参照する「メモリ」（プロジェクト設定ファイルや永続的なコンテキスト）を管理します。

```
> /memory
```

**出力例:**

```
Memory Sources
==============

Active memory files:
  1. ~/.claude/CLAUDE.md (user memory)
     Size: 380 tokens
     Content: グローバル設定、個人の作業スタイル

  2. /Users/dev/my-project/CLAUDE.md (project memory)
     Size: 1,240 tokens
     Content: プロジェクト概要、技術スタック、コーディング規約

Total memory tokens: 1,620

Commands:
  /memory show    - Show current memory content
  /memory edit    - Edit memory files
  /memory clear   - Clear session memory (not files)
```

### メモリの種類

Claude Codeのメモリには2種類あります。

| 種類 | ファイルパス | 範囲 |
|------|------------|------|
| ユーザーメモリ | `~/.claude/CLAUDE.md` | すべてのプロジェクトで共有 |
| プロジェクトメモリ | `./CLAUDE.md` | 現在のプロジェクト専用 |

### メモリの表示と編集

```bash
# 現在のメモリ内容を表示
> /memory show

# メモリファイルを直接編集
> /memory edit

# 特定のメモリを追加（自然言語でも可能）
> このプロジェクトでは常にTypeScriptのstrictモードを使うことを覚えておいて
# → Claude Codeがプロジェクトの CLAUDE.md に追記を提案します
```

### ユーザーメモリの活用例

```markdown
# ~/.claude/CLAUDE.md の例

## 私の作業スタイル

- コードのコメントは日本語で書く
- 関数は必ずJSDocを付ける
- テストファイルは必ず作成する（TDDを好む）

## よく使うツール

- エディタ: VS Code
- ターミナル: iTerm2
- バージョン管理: Git Flow スタイル

## 出力形式の好み

- コードブロックには言語を明記する
- 複数のオプションを提示する場合は表形式にする
```

## コマンドを組み合わせた開発ワークフロー

```bash
# 新しいプロジェクトの開始
cd new-project
claude
> /init              # CLAUDE.md を生成
> /doctor            # 環境を確認
> /status            # 状態を把握

# 機能実装の作業フロー
> フィーチャーXを実装してください
> # ...実装作業...
> /review            # 変更内容をレビュー
> テストを実行して確認してください

# 長時間作業中のメンテナンス
> /cost              # コスト確認
> /compact           # コンテキスト圧縮
> /memory show       # メモリ内容を確認

# 別のタスクへの切り替え
> /clear             # コンテキストをクリア
> /model             # 必要に応じてモデル変更
```

## まとめ

開発支援コマンドを活用することで、Claude Codeが単なるチャットボットを超えた**開発パートナー**になります。

| コマンド | 役割 |
|---------|------|
| `/review` | Git変更差分のコードレビューを自動実施 |
| `/init` | プロジェクトを分析してCLAUDE.mdを自動生成 |
| `/doctor` | 環境診断と問題の自動検出 |
| `/memory` | プロジェクト・ユーザーメモリの管理 |

次のレッスンでは、さらに高度なコマンドの活用方法と、カスタムワークフローの構築について学びます。
