# Gitの基本操作とClaude Code

## はじめに

Gitはソフトウェア開発において欠かせないバージョン管理システムです。Claude Codeはターミナル上でGitコマンドを直接実行できるため、バージョン管理の操作を自然言語で指示しながら効率的に行うことができます。このレッスンでは、Claude Codeを使った基本的なGit操作、コミットメッセージの自動生成、プロジェクト履歴の分析方法を学びます。

## Claude CodeによるGitコマンドの実行

Claude Codeはシェルコマンドを直接実行できるため、Gitの操作をすべて自然言語で依頼できます。

### git statusの確認

```bash
# Claude Codeへの指示例
> 現在のgitの状態を確認して

# Claude Codeが実行するコマンド
git status
```

Claude Codeはコマンドの出力を解釈し、どのファイルが変更されているか、ステージングエリアの状態などをわかりやすく説明します。

```
出力例:
On branch feature/user-authentication
Changes not staged for commit:
  modified:   src/api/auth.ts
  modified:   src/components/LoginForm.tsx
Untracked files:
  src/utils/tokenHelper.ts
```

> **Claude Codeの解釈**: `feature/user-authentication`ブランチで作業中です。`auth.ts`と`LoginForm.tsx`が変更されており、`tokenHelper.ts`は新規ファイルとして追跡されていません。

### git diffによる変更内容の確認

```bash
# ステージング前の差分を確認
> 今の変更内容をdiffで見せて

# ステージング済みの差分を確認
> ステージングした変更の差分を確認して

# 特定のファイルの差分
> src/api/auth.tsの変更内容を詳しく見せて
```

Claude Codeは差分を表示するだけでなく、変更の意図を理解して説明します。

```bash
# Claude Codeが実行するコマンドの例
git diff
git diff --staged
git diff src/api/auth.ts
```

### git logによるプロジェクト履歴の確認

```bash
# 最近のコミット履歴を確認
> 最近のコミット履歴を10件表示して

# 特定のファイルの変更履歴
> src/api/auth.tsの変更履歴を見せて

# ブランチ間の差分を確認
> mainブランチとの差分をログで見せて
```

Claude Codeが実行するコマンドの例:

```bash
git log --oneline -10
git log --oneline --follow src/api/auth.ts
git log --oneline main..HEAD
git log --graph --oneline --all
```

## コミットメッセージの自動生成

Claude Codeの優れた機能のひとつが、変更内容を分析して適切なコミットメッセージを自動生成する機能です。

### 基本的なコミット操作

```bash
# 変更をすべてステージングしてコミット
> 今の変更を適切なコミットメッセージでコミットして

# 特定のファイルだけコミット
> src/api/auth.tsとsrc/components/LoginForm.tsxの変更をコミットして

# 詳細なコミットメッセージの生成
> 変更内容を分析して、Conventional Commits形式でコミットして
```

### Conventional Commitsへの対応

Claude CodeはConventional Commits規約に従ったメッセージを生成できます。

```bash
# コミットタイプの例
feat: 新機能の追加
fix: バグの修正
docs: ドキュメントの変更
style: コードフォーマットの変更
refactor: リファクタリング
test: テストの追加・修正
chore: ビルドプロセスやツールの変更
```

指示の例と生成されるコミットメッセージ:

```bash
# 指示
> JWTトークンの検証ロジックを追加した変更をConventional Commitsでコミットして

# Claude Codeが生成するコミットメッセージの例
feat(auth): JWTトークン検証ロジックを追加

- tokenHelper.tsにJWT検証ユーティリティを実装
- auth.tsのミドルウェアで検証処理を統合
- 期限切れトークンのエラーハンドリングを追加
```

### コミット前の確認フロー

```bash
# ステップ1: 変更内容の確認
> 今どんな変更をしたか確認して

# ステップ2: 差分のレビュー
> これらの変更のdiffを見せて、問題がないか確認して

# ステップ3: コミット
> 問題なければ、適切なメッセージでコミットして
```

## プロジェクト履歴の理解と分析

Claude Codeはgit logの出力を分析して、プロジェクトの変更履歴を理解するサポートを行います。

### コミット履歴の分析

```bash
# 最近の変更概要を把握
> 先週からどんな変更が加えられたか教えて

# 特定の機能の実装経緯を確認
> 認証機能がいつどのように実装されたか履歴で確認して

# コントリビューターの貢献を確認
> 誰がどのファイルを最も多く変更しているか確認して
```

```bash
# Claude Codeが実行するコマンドの例
git log --since="1 week ago" --oneline
git log --all --oneline --follow src/auth/
git shortlog -sn --all
```

### 差分の説明と理解

パイプを使ってdiffの内容をClaude Codeに渡し、変更内容を説明させることもできます。

```bash
# コマンドラインから直接渡す方法
git diff | claude "この変更内容を日本語でわかりやすく説明して"

# 特定のコミットの変更を説明
git show abc1234 | claude "このコミットで何が変わったか説明して"

# PRのレビュー
git diff main..feature/user-auth | claude "この変更のコードレビューをして"
```

### 特定コミットの内容確認

```bash
# Claude Codeへの指示
> コミットabc1234の変更内容を詳しく説明して

> 最後のコミットで何が変更されたか確認して

> 過去5件のコミットで変更されたファイルの一覧を見せて
```

## .gitignoreの管理

Claude Codeは`.gitignore`ファイルの作成と管理も行えます。

```bash
# .gitignoreの作成
> このNode.jsプロジェクトに適した.gitignoreを作成して

# 特定のファイルを除外
> .envファイルと.env.localをgitignoreに追加して

# 現在のignore設定の確認
> gitignoreに含まれているパターンの一覧を見せて
```

Claude Codeが生成する`.gitignore`の例:

```gitignore
# 依存関係
node_modules/
.pnp
.pnp.js

# ビルド出力
dist/
build/
.next/

# 環境変数
.env
.env.local
.env.*.local

# ログ
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# エディタ設定
.vscode/
.idea/
*.swp
*.swo

# OS関連
.DS_Store
Thumbs.db
```

## タグの管理

```bash
# バージョンタグの作成
> v1.0.0のリリースタグを作成して

# タグの一覧確認
> これまでのリリースタグを一覧で見せて

# タグへのアノテーション付与
> v1.0.0タグに「初回リリース - 基本的なユーザー管理機能」という説明を付けてタグを作成して
```

## まとめ

このレッスンでは、Claude CodeとGitを組み合わせた基本的な操作方法を学びました。`git status`、`git diff`、`git log`などのコマンドを自然言語で実行し、その結果を理解しやすい形で解説してもらえます。また、変更内容を分析した上でConventional Commits規約に沿ったコミットメッセージを自動生成できることも大きなメリットです。次のレッスンでは、ブランチ管理とマージについて学びます。
