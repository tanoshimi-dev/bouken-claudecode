# ブランチ管理とマージ

## はじめに

ブランチ管理はチーム開発において非常に重要なスキルです。Claude Codeを使えば、ブランチの作成・切り替え・マージを自然言語で行えるだけでなく、マージコンフリクトの解消まで支援してもらえます。このレッスンでは、実践的なブランチワークフローとClaude Codeを組み合わせた効率的な開発方法を学びます。

## ブランチの作成と切り替え

### 新しいブランチの作成

```bash
# 機能開発用ブランチの作成
> feature/user-authenticationという名前で新しいブランチを作成して

# バグ修正用ブランチの作成
> fix/login-redirectバグを修正するためのブランチを作成して切り替えて

# リリース準備ブランチ
> release/1.2.0という名前のリリースブランチをmainから作成して
```

Claude Codeが実行するコマンドの例:

```bash
# ブランチを作成して切り替え
git checkout -b feature/user-authentication

# 特定のブランチから分岐
git checkout -b feature/user-authentication main

# 最新のmainから分岐
git fetch origin
git checkout -b fix/login-redirect origin/main
```

### ブランチの命名規則

Claude Codeに命名規則を伝えることで、一貫したブランチ名を維持できます。

```bash
# CLAUDE.mdでブランチ命名規則を定義
> CLAUDE.mdに以下のブランチ命名規則を追加して:
> - 機能追加: feature/<機能名>
> - バグ修正: fix/<バグの説明>
> - ホットフィックス: hotfix/<緊急修正内容>
> - リリース: release/<バージョン番号>
> - リファクタリング: refactor/<対象>
```

命名規則の例:

| 種類 | パターン | 例 |
|------|---------|-----|
| 機能追加 | `feature/<機能名>` | `feature/user-authentication` |
| バグ修正 | `fix/<説明>` | `fix/login-redirect-error` |
| ホットフィックス | `hotfix/<説明>` | `hotfix/security-vulnerability` |
| リリース | `release/<バージョン>` | `release/1.2.0` |
| リファクタリング | `refactor/<対象>` | `refactor/api-layer` |

### ブランチの一覧と切り替え

```bash
# ローカルブランチの一覧
> 現在のブランチ一覧を見せて

# リモートも含めたブランチの一覧
> ローカルとリモートすべてのブランチを一覧表示して

# ブランチの切り替え
> mainブランチに切り替えて

# 前のブランチに戻る
> 前にいたブランチに戻って
```

```bash
# Claude Codeが実行するコマンドの例
git branch
git branch -a
git checkout main
git checkout -
```

## マージの実行

### 基本的なマージ

```bash
# 機能ブランチをmainにマージ
> feature/user-authenticationブランチをmainにマージして

# マージ前の確認
> mainブランチにマージする前に、変更内容の差分を確認して

# マージの取り消し
> 今行ったマージを取り消して
```

```bash
# Claude Codeが実行するコマンドの例
git checkout main
git merge feature/user-authentication
git merge --no-ff feature/user-authentication  # マージコミットを明示的に作成
git merge --abort  # コンフリクト発生時に中断
```

### マージ戦略の選択

```bash
# Fast-forwardマージ（デフォルト）
> feature/hotfixブランチをmainにfast-forwardでマージして

# マージコミットを作成するマージ
> マージコミットを明示的に作成してfeature/loginをmainにマージして

# Squashマージ（コミットをひとつにまとめる）
> feature/experimentalブランチの変更を1つのコミットにまとめてmainにマージして
```

## マージコンフリクトの解消

マージコンフリクトはチーム開発で避けられない問題です。Claude Codeはコンフリクトの解消を強力にサポートします。

### コンフリクトの検出

```bash
# マージを試みてコンフリクトが発生した場合
> feature/api-refactoringブランチをmainにマージして

# 出力例（コンフリクトが発生した場合）
# Auto-merging src/api/users.ts
# CONFLICT (content): Merge conflict in src/api/users.ts
# Automatic merge failed; fix conflicts and then commit the result.
```

### Claude Codeによるコンフリクト解消

```bash
# コンフリクトの状況を確認
> マージコンフリクトが発生したファイルの一覧を見せて

# 特定ファイルのコンフリクトを解消
> src/api/users.tsのコンフリクトを解消して。
> 両方の変更を統合して、機能が壊れないようにして。

# すべてのコンフリクトを解消
> すべてのコンフリクトを確認して、適切に解消して
```

コンフリクトが発生したファイルの例:

```typescript
// src/api/users.ts（コンフリクト発生状態）
export async function getUser(id: string) {
<<<<<<< HEAD
  const user = await db.users.findById(id);
  return user;
=======
  const user = await db.users.findOne({ id });
  if (!user) throw new Error('User not found');
  return user;
>>>>>>> feature/api-refactoring
}
```

Claude Codeによる解消後:

```typescript
// src/api/users.ts（コンフリクト解消後）
export async function getUser(id: string) {
  const user = await db.users.findById(id);
  if (!user) throw new Error('User not found');
  return user;
}
```

```bash
# 解消後のコミット
> コンフリクトを解消したのでマージを完了してコミットして
```

### コンフリクト解消のベストプラクティス

```bash
# コンフリクト解消前に変更の背景を理解する
> HEADとfeature/api-refactoringの変更で、それぞれ何を意図した変更か説明して

# 解消方針を相談する
> このコンフリクトはどちらの変更を優先すべきか教えて。
> HEADはパフォーマンス改善、featureはエラーハンドリング追加の変更のようです。

# 解消後の動作確認
> コンフリクトを解消したので、テストを実行して問題がないか確認して
```

## リベースの活用

リベースはコミット履歴をきれいに保つための重要な操作です。

### インタラクティブリベース

```bash
# 直近5件のコミットを整理
> 直近5件のコミットをインタラクティブリベースで整理したい。
> コミットメッセージの修正と不要なコミットの削除を手伝って。

# mainの最新変更を取り込む
> mainブランチの最新変更を取り込んで、現在のブランチをリベースして
```

```bash
# Claude Codeが実行するコマンドの例
git rebase main
git rebase origin/main

# コンフリクトが発生した場合
git rebase --continue  # 解消後に続行
git rebase --abort     # リベースを中断
```

### リベースとマージの使い分け

```bash
# リベースが適している場合を確認
> このブランチはリベースとマージのどちらが適しているか教えて。
> ブランチの状態: 個人の機能開発ブランチ、まだプッシュしていない
```

| 状況 | 推奨 | 理由 |
|------|------|------|
| ローカルのみのブランチ | リベース | 履歴がきれいになる |
| チームで共有済みのブランチ | マージ | 歴史の書き換えを避ける |
| 公開リポジトリのブランチ | マージ | 他者への影響を防ぐ |
| フィーチャーブランチ | リベース後マージ | きれいな履歴を保ちつつ |

## 実践的なブランチワークフロー

### Git Flowの実践

```bash
# ステップ1: 機能開発の開始
> developブランチからfeature/payment-integrationブランチを作成して

# ステップ2: 開発とコミット
> 実装した変更をfeature/payment-integrationにコミットして。
> Conventional Commitsに従ってメッセージを生成して。

# ステップ3: 最新のdevelopを取り込む
> developブランチの最新変更をfeature/payment-integrationにリベースして取り込んで

# ステップ4: developへマージ
> feature/payment-integrationをdevelopにマージして。
> マージコミットを作成して。
```

### ブランチの削除と整理

```bash
# マージ済みブランチの削除
> マージ済みのローカルブランチを一覧表示して、不要なものを削除して

# リモートブランチの削除
> リモートのfeature/old-featureブランチを削除して

# 古いブランチの確認
> 3ヶ月以上更新されていないブランチの一覧を見せて
```

```bash
# Claude Codeが実行するコマンドの例
git branch --merged main | grep -v "^\*\|main" | xargs git branch -d
git push origin --delete feature/old-feature
git branch -vv | grep "gone"
```

## まとめ

このレッスンでは、Claude Codeを使ったブランチ管理の基本から応用まで学びました。ブランチの作成・切り替え・命名規則の統一、マージコンフリクトの解消、そしてリベースを使った履歴管理まで、自然言語で指示するだけで複雑なGit操作を実行できます。特にマージコンフリクトの解消では、Claude Codeが変更の意図を理解した上で最適な解決策を提案してくれます。次のレッスンでは、プルリクエストとコードレビューについて学びます。
