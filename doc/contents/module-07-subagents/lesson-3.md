# Worktreeと分離環境

## はじめに

Gitのworktree機能とClaude Codeのサブエージェントを組み合わせることで、メインブランチに影響を与えずに安全な実験や大規模なリファクタリングを行うことができます。このレッスンでは、worktreeの基本からサブエージェントとの連携まで、実践的な活用方法を学びます。

## Git Worktreeとは

通常、一つのGitリポジトリには一つの作業ディレクトリしかありません。`git worktree`コマンドを使うと、同じリポジトリの異なるブランチを、別々のディレクトリで同時にチェックアウトして作業できます。

```bash
# 通常の構造（一つの作業ディレクトリ）
my-project/
├── .git/
├── src/
└── package.json

# worktreeを追加した構造（複数の作業ディレクトリ）
my-project/            ← メインworktree（mainブランチ）
├── .git/
├── src/
└── package.json

my-project-feature/    ← 追加worktree（featureブランチ）
├── src/
└── package.json

my-project-refactor/   ← 追加worktree（refactorブランチ）
├── src/
└── package.json
```

各worktreeは独立したブランチを参照しており、一方での変更がもう一方に影響を与えません。

## Claude CodeのEnterWorktree機能

Claude Codeには`EnterWorktree`という専用のツールがあり、ユーザーが「worktreeで作業して」と指示すると、自動的にworktreeを作成してその環境に切り替えます。

### 基本的な使い方

```bash
# Claude Codeにworktreeでの作業を依頼する
> このリファクタリング作業をworktreeで行ってください

# または
> 新しいworktreeを作成して、そこで機能開発を始めてください
```

Claude CodeはEnterWorktreeツールを使って以下を自動的に行います。

1. `.claude/worktrees/`配下に新しいworktreeを作成
2. 現在のHEADから新しいブランチを作成
3. セッションの作業ディレクトリをそのworktreeに切り替え

### worktreeの命名

```bash
# 名前を指定してworktreeを作成
> "payment-refactor"という名前でworktreeを作成してください

# 名前を指定しない場合はランダムな名前が付けられる
> worktreeで作業を開始してください
```

## サブエージェントとWorktreeの組み合わせ

サブエージェントとworktreeを組み合わせることで、強力な分離環境での並列開発が実現します。

### ユースケース1: 安全な実験環境

```bash
# メインブランチを守りながら実験的な変更を試す
> worktreeを作成して、以下の実験的なリファクタリングを安全に試してください:
> - クラスベースのコンポーネントをすべてフック（Hooks）ベースに移行
> - もし問題が発生してもメインブランチには影響しないようにしてください
> - 移行が成功したら、変更点のサマリーを作成してください
```

### ユースケース2: 並列ブランチ開発

複数のworktreeで異なるサブエージェントが並列に作業します。

```bash
> 以下の3つの機能を並列で開発してください。
> 各機能は独立したworktreeで作業してください:
>
> 機能1: ユーザープロフィール編集機能
>   - worktree名: feature-profile-edit
>   - 担当ファイル: src/pages/ProfileEdit.tsx, src/api/profile.ts
>
> 機能2: 通知センター機能
>   - worktree名: feature-notification-center
>   - 担当ファイル: src/components/NotificationCenter.tsx, src/api/notifications.ts
>
> 機能3: ダークモード対応
>   - worktree名: feature-dark-mode
>   - 担当ファイル: src/styles/theme.ts, src/hooks/useTheme.ts
>
> 各worktreeでサブエージェントが独立して作業し、完了後に結果を報告してください。
```

### ユースケース3: 大規模リファクタリングの安全な実施

```bash
> TypeScriptの型エラーを一括修正する作業をworktreeで行ってください:
>
> 1. "ts-error-fixes"という名前でworktreeを作成
> 2. tscを実行して現在の型エラー数を記録
> 3. エラーをモジュール単位でグループ化し、各グループを並列で修正
> 4. 全修正後にtscを再実行してエラーがゼロになることを確認
> 5. 修正内容のサマリーを作成
>
> メインブランチは変更せずに、worktree内でのみ作業してください。
```

## 分離環境の利点

### 安全性

worktreeを使うことで、実験的な変更がメインブランチを汚染するリスクをゼロにできます。

```bash
# 現在のメインブランチの状態
main: src/App.tsx（安定版）

# worktreeで実験
worktree/experiment: src/App.tsx（大幅な変更）

# 実験が失敗した場合
> worktreeを削除してください
# メインブランチには何も影響しない

# 実験が成功した場合
> この変更をmainブランチにマージする準備をしてください
```

### 独立したファイルシステム

各worktreeは独立したファイルシステムを持つため、サブエージェントが別のworktreeのファイルを誤って変更する心配がありません。

```
worktree-A（サブエージェント1が担当）:
  src/components/Button.tsx ← 変更可能

worktree-B（サブエージェント2が担当）:
  src/components/Input.tsx  ← 変更可能

# サブエージェント1はworktree-Aのファイルのみを操作
# サブエージェント2はworktree-Bのファイルのみを操作
# 互いに干渉しない
```

### ブランチ戦略との統合

worktreeを使った開発はGitのブランチ戦略と自然に統合されます。

```bash
# Feature Branch ワークフローとの統合
> 以下のGitフローで機能開発を進めてください:
>
> 1. developブランチから "feature/user-search" という新しいworktreeを作成
> 2. そのworktreeでユーザー検索機能を実装
> 3. テストを実行して全て通ることを確認
> 4. developブランチへのマージ準備として、変更点のサマリーを作成
```

## 実践シナリオ: 大規模コードベースの移行

実際のプロジェクトで、JavaScriptからTypeScriptへの移行作業をworktreeとサブエージェントで行う例です。

### ステップ1: 移行計画の策定

```bash
> まず、移行計画を立ててください:
> 1. src/以下の全.jsファイルをリストアップ
> 2. ファイルの依存関係を分析
> 3. 依存関係に基づいて移行グループを作成（独立して移行できるグループ）
> 4. 各グループの推定作業量を算出
```

### ステップ2: worktreeの準備

```bash
> TypeScript移行作業用のworktreeを準備してください:
>
> 1. "ts-migration"という名前でworktreeを作成
> 2. そのworktreeにtsconfig.jsonを追加
> 3. package.jsonにTypeScript関連の依存を追加
> 4. 移行前の状態でビルドが通ることを確認
```

### ステップ3: 並列移行の実行

```bash
> 先ほどの計画に基づいて、以下のグループを並列で移行してください:
>
> グループA（ユーティリティ関数）:
> - src/utils/format.js → src/utils/format.ts
> - src/utils/validate.js → src/utils/validate.ts
> - src/utils/helpers.js → src/utils/helpers.ts
>
> グループB（APIクライアント）:
> - src/api/userApi.js → src/api/userApi.ts
> - src/api/productApi.js → src/api/productApi.ts
>
> 各グループをサブエージェントで並列処理し、
> 型エラーがない状態で移行してください。
```

### ステップ4: 検証と統合

```bash
> 全移行完了後、以下を実行してください:
> 1. tsc --noEmit で型チェック（エラーゼロを確認）
> 2. 既存テストがすべて通ることを確認
> 3. 移行前後のバンドルサイズを比較
> 4. 移行作業のレポートを作成
> 5. mainブランチへのマージ準備（PRの説明文を作成）
```

## Worktreeの管理コマンド

サブエージェントと連携して使用するGit worktree管理の主要コマンドです。

```bash
# worktreeの一覧表示
git worktree list

# 新しいworktreeを追加（新規ブランチ）
git worktree add ../my-project-feature -b feature/new-feature

# 新しいworktreeを追加（既存ブランチ）
git worktree add ../my-project-fix bugfix/existing-branch

# worktreeの削除
git worktree remove ../my-project-feature

# 不要なworktreeの一括クリーンアップ
git worktree prune
```

### Claude CodeのEnterWorktreeが作成するパス

```bash
# Claude Codeが自動作成するworktreeの場所
.claude/worktrees/[name]/

# 例
.claude/worktrees/payment-refactor/
.claude/worktrees/ts-migration/
.claude/worktrees/dark-mode/
```

## 注意事項とトラブルシューティング

### 同一ブランチへの重複チェックアウト

同じブランチを複数のworktreeでチェックアウトすることはできません。

```bash
# エラーになるケース
git worktree add ../worktree-1 main  # OK（最初）
git worktree add ../worktree-2 main  # エラー（mainは既にチェックアウト済み）
```

### ディスク容量の考慮

worktreeはファイルシステムの実際のコピーを作成するため、大規模なプロジェクトではディスク容量に注意が必要です。

```bash
# 不要になったworktreeは速やかに削除する
> worktreeの作業が完了しました。不要になったworktreeを削除してください。
```

### node_modulesの扱い

worktreeごとにnode_modulesは共有されないため、新しいworktreeではインストールが必要です。

```bash
# 新しいworktreeでの初期設定
> worktreeを作成後、npm installを実行して依存関係をインストールしてください
```

## まとめ

Gitのworktree機能とサブエージェントを組み合わせることで、安全で効率的な並列開発環境を構築できます。

- worktreeはメインブランチを保護しながら安全な実験を可能にする
- サブエージェントと組み合わせることで真の並列ブランチ開発が実現する
- 大規模なリファクタリングやコード移行作業に特に有効
- Claude CodeのEnterWorktreeツールで簡単にworktree環境を作成できる
- 使い終わったworktreeは速やかに削除してリソースを管理する

次のレッスンでは、これまでの知識を活かして実際の大規模タスクをサブエージェントで分解・実行する実践的なアプローチを学びます。
