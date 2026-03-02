# プルリクエストとコードレビュー

## はじめに

プルリクエスト（PR）は現代のチーム開発における重要なプロセスです。Claude Codeは`gh`コマンド（GitHub CLI）と連携して、PRの作成・管理・レビューまで一貫してサポートします。このレッスンでは、Claude Codeを使った効率的なPRワークフローとコードレビューの方法を学びます。

## GitHub CLIとの連携

Claude CodeはGitHub CLI（`gh`コマンド）を直接実行できます。まず`gh`コマンドが使える状態になっているか確認します。

```bash
# GitHub CLIのインストール確認
> gh コマンドが使えるか確認して。使えない場合はインストール方法を教えて。

# GitHub CLIの認証
> GitHubにghコマンドでログインしたい。手順を教えて。
```

```bash
# Claude Codeが実行する確認コマンド
gh --version
gh auth status

# 認証されていない場合
gh auth login
```

## プルリクエストの作成

### 基本的なPRの作成

```bash
# シンプルなPR作成
> 現在のブランチのPRをmainに向けて作成して

# タイトルと説明を指定したPR作成
> 今の変更内容を分析して、適切なタイトルと説明でPRを作成して

# ドラフトPRの作成
> まだレビューの準備ができていないので、ドラフトPRとして作成して
```

Claude Codeが実行するコマンドの例:

```bash
# 基本的なPR作成
gh pr create --title "feat(auth): JWTトークン検証を追加" \
  --body "## 変更概要\n\nJWT認証ミドルウェアを実装しました。\n\n## テスト方法\n..."

# ドラフトPR
gh pr create --draft --title "WIP: ユーザー管理API" \
  --body "作業中のPRです"

# 特定のブランチへのPR
gh pr create --base develop --head feature/payment-integration
```

### PR説明文の自動生成

Claude Codeは変更内容を分析して、詳細なPR説明文を自動生成できます。

```bash
# 変更内容からPR説明文を自動生成
> mainブランチとの差分を分析して、レビュアーにわかりやすいPR説明文を作成して。
> 変更概要、テスト方法、スクリーンショット（必要な場合）のセクションを含めて。
```

Claude Codeが生成するPR説明文の例:

```markdown
## 変更概要

JWT認証ミドルウェアを実装し、APIエンドポイントのセキュリティを強化しました。

### 変更内容
- `src/middleware/auth.ts`: JWTトークン検証ミドルウェアを新規作成
- `src/api/users.ts`: 認証が必要なエンドポイントにミドルウェアを適用
- `src/utils/tokenHelper.ts`: トークンの生成・検証ユーティリティを追加

### 動作の変更
- すべての`/api/users/*`エンドポイントがJWT認証を必要とするようになりました
- 未認証のリクエストは401エラーを返します
- 期限切れトークンは403エラーを返します

## テスト方法

```bash
# 認証なしでアクセス（401が返ることを確認）
curl -X GET http://localhost:3000/api/users

# 有効なトークンでアクセス
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <valid-token>"
```

## チェックリスト
- [x] ユニットテストを追加
- [x] 既存のテストがパスすることを確認
- [x] ドキュメントを更新
```

### レビュアーとラベルの設定

```bash
# レビュアーを指定してPRを作成
> PRを作成して、yamada-taro と suzuki-hanakoをレビュアーとして指定して

# ラベルを付けてPRを作成
> 「enhancement」と「needs-review」ラベルを付けてPRを作成して

# マイルストーンを設定
> v1.2.0のマイルストーンに紐づけてPRを作成して
```

```bash
# Claude Codeが実行するコマンドの例
gh pr create \
  --title "feat(auth): JWT認証を実装" \
  --reviewer yamada-taro,suzuki-hanako \
  --label "enhancement,needs-review" \
  --milestone "v1.2.0"
```

## PRのレビュー

### PRの一覧と状態確認

```bash
# オープン中のPR一覧
> 現在オープンしているPRの一覧を見せて

# 自分がレビュアーになっているPR
> 自分がレビュアーに指定されているPRを見せて

# 特定のPRの詳細確認
> PR #42の詳細内容を確認して
```

```bash
# Claude Codeが実行するコマンドの例
gh pr list
gh pr list --reviewer @me
gh pr view 42
gh pr diff 42
```

### Claude Codeによるコードレビュー

Claude Codeはdiffを分析して、詳細なコードレビューを行えます。

```bash
# PRの差分をレビュー
> PR #42の変更内容をレビューして。
> セキュリティ、パフォーマンス、コード品質の観点でフィードバックをお願いします。

# 特定の観点でレビュー
> このPRのセキュリティ上の問題点を特に注意して確認して

# ベストプラクティスとの比較
> このPRのコードがTypeScriptのベストプラクティスに従っているか確認して
```

差分をClaude Codeに渡してレビューする例:

```bash
# PRの差分をClaudeに渡す
gh pr diff 42 | claude "このコードレビューをして。問題点と改善案を具体的に教えて。"

# 特定ファイルだけレビュー
gh pr diff 42 -- src/api/auth.ts | claude "このファイルのセキュリティレビューをして"
```

### /reviewコマンドの活用

Claude Codeの`/review`スラッシュコマンドを使うと、体系的なコードレビューを行えます。

```bash
# Claude Code内でのレビュー実行
> /review

# レビュー観点を指定
> このコードをレビューして。以下の点を確認してください:
> 1. セキュリティの脆弱性
> 2. パフォーマンスの問題
> 3. エラーハンドリングの適切さ
> 4. TypeScriptの型安全性
> 5. テストのカバレッジ
```

Claude Codeが提供するレビューフィードバックの例:

```
レビュー結果: src/api/auth.ts

[重要] セキュリティ問題:
- 行23: JWTシークレットがハードコードされています。
  環境変数（process.env.JWT_SECRET）から読み込むよう変更してください。

[推奨] パフォーマンス改善:
- 行45: データベースクエリがループ内で実行されています（N+1問題）。
  Promise.all()を使って並列化することを検討してください。

[提案] コード品質:
- 行67: エラーメッセージが英語です。プロジェクトの規約に従い日本語に統一してください。
```

### PRにコメントを追加する

```bash
# PRにコメントを投稿
> PR #42に「認証ロジックのテストを追加してください」というコメントを投稿して

# 特定行にコメント
> PR #42のsrc/api/auth.tsの23行目に、JWTシークレットの扱いについてコメントして

# 承認またはリクエスト変更
> PR #42のレビューを承認して
> PR #42にchanges requestedとして、指摘したセキュリティ問題の修正をリクエストして
```

```bash
# Claude Codeが実行するコマンドの例
gh pr comment 42 --body "認証ロジックのテストを追加してください"
gh pr review 42 --approve --body "LGTMです！"
gh pr review 42 --request-changes --body "セキュリティ上の問題を修正してください"
```

## PRのマージ

### マージ方法の選択

```bash
# 通常のマージ
> PR #42をmainにマージして

# Squashマージ（コミットをひとつにまとめる）
> PR #42のコミットをsquashしてmainにマージして

# リベースマージ
> PR #42をリベースしてmainにマージして
```

```bash
# Claude Codeが実行するコマンドの例
gh pr merge 42                    # デフォルトのマージ
gh pr merge 42 --squash           # Squashマージ
gh pr merge 42 --rebase           # リベースマージ
gh pr merge 42 --delete-branch    # マージ後にブランチを削除
```

### マージ前のチェックリスト

```bash
# マージ前の確認
> PR #42をマージする前に、以下を確認して:
> - CIが通っているか
> - 必要なレビュアーが承認しているか
> - コンフリクトがないか
> - ブランチが最新のmainと同期しているか
```

```bash
# Claude Codeが実行する確認コマンドの例
gh pr checks 42      # CIの状態確認
gh pr status         # PR全体のステータス確認
gh pr view 42 --json mergeable,reviewDecision,statusCheckRollup
```

## 実践的なPRワークフロー

### 標準的なフィーチャー開発フロー

```bash
# ステップ1: ブランチ作成とコミット
> feature/payment-integrationブランチを作成して作業を開始して
> 実装が完了したらConventional Commitsでコミットして

# ステップ2: リモートへのプッシュ
> 現在のブランチをリモートにプッシュして

# ステップ3: PR作成
> mainに向けてPRを作成して。変更内容を分析して説明文を自動生成して。
> チームメンバーのtanakaをレビュアーに指定して。

# ステップ4: レビュー対応
> レビューのコメントを確認して、指摘された点を修正して
> 修正したことをコメントで返信して

# ステップ5: マージ
> CIが通り、承認を得たのでPRをSquashマージして
```

### hotfixワークフロー

```bash
# 緊急バグ修正のフロー
> mainブランチからhotfix/security-patchブランチを作成して

> セキュリティパッチを適用してコミットして

> hotfix/security-patchをmainとdevelopの両方にPRを作成して。
> 緊急対応であることを説明文に明記して。

> PRが承認されたら両方のブランチにマージして
```

## まとめ

このレッスンでは、Claude Codeと`gh`コマンドを組み合わせたプルリクエストワークフローを学びました。PRの作成から説明文の自動生成、レビューの実施、マージまで、すべての工程をClaude Codeからの自然言語指示で行えます。特に差分を分析したコードレビュー機能は、コード品質の向上に大きく貢献します。これでGit連携モジュールのレッスンはすべて完了です。次はクイズで学んだ内容を確認しましょう。
