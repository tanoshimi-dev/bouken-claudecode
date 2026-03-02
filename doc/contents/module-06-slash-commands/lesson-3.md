# 高度なコマンド活用

## はじめに

これまでのレッスンでセッション管理と開発支援の基本コマンドを習得しました。このレッスンでは、**上級ユーザー向けのコマンド**と**カスタムワークフロー**の構築方法を学びます。権限管理、設定のカスタマイズ、そしてコマンドを組み合わせた生産性の最大化がテーマです。

## /permissions - 権限管理

`/permissions` コマンドは、Claude Codeがどのツール・操作を実行できるかを細かく制御します。セキュリティと利便性のバランスを取るために重要なコマンドです。

```
> /permissions
```

**出力例:**

```
Tool Permissions
================

Current permission mode: default

Allowed tools:
  [✓] Read files         - ファイルの読み取り
  [✓] Write files        - ファイルの書き込み・作成
  [✓] Execute commands   - シェルコマンドの実行
  [✓] Git operations     - Git コマンドの実行
  [✓] Web fetch          - URLコンテンツの取得
  [✗] Browser control    - ブラウザの自動操作

Permission modes:
  strict  - 各操作を実行前に確認
  default - 安全な操作は自動、リスクある操作は確認
  allow   - すべての操作を自動承認（注意が必要）
```

### 権限モードの切り替え

```bash
# strictモード: すべての操作に確認を求める
> /permissions strict

# defaultモード: バランスの取れた設定（推奨）
> /permissions default

# allowモード: すべて自動承認（信頼できる環境のみ）
> /permissions allow
```

### 個別ツールの制御

```bash
# 特定のツールの権限を確認
> /permissions show execute

# 特定の操作を一時的に無効化
> /permissions deny execute
Claude: シェルコマンドの実行が無効化されました。ファイル操作のみ許可されています。

# 再度有効化
> /permissions allow execute
```

### セキュリティのシナリオ別設定

```bash
# シナリオ1: 本番環境のコードを読むだけの作業
> /permissions deny execute   # コマンド実行を禁止
> /permissions deny write     # ファイル書き込みを禁止
# → 読み取り専用モードになり、誤ってファイルを変更するリスクがない

# シナリオ2: CI/CD環境での自動化
> /permissions allow          # すべて自動承認
# → 対話なしに完全自動で作業を実行

# シナリオ3: セキュリティ審査中のコードレビュー
> /permissions strict         # すべての操作を確認
# → Claude Codeが何をするか完全に把握しながら作業
```

## /config - 設定の管理

`/config` コマンドでClaude Codeのさまざまな動作設定を確認・変更できます。

```
> /config
```

**出力例:**

```
Claude Code Configuration
=========================

Current settings:
  model:              claude-opus-4-6
  maxTokens:          4096
  temperature:        1.0
  autoCompact:        true
  autoCompactThreshold: 80%
  theme:              dark
  language:           ja
  autoApprove:        false
  verboseMode:        false

Config file: ~/.claude/config.json
```

### 設定の変更

```bash
# 特定の設定を変更
> /config set autoCompact true
Configuration updated: autoCompact = true

> /config set autoCompactThreshold 70
Configuration updated: autoCompactThreshold = 70%

> /config set maxTokens 8192
Configuration updated: maxTokens = 8192
```

### 設定ファイルの直接確認

```bash
# 設定ファイルの内容を表示
> /config show

# 設定をデフォルトに戻す
> /config reset
```

### 便利な設定例

```bash
# 日本語での応答を優先（多言語環境で有効）
> /config set language ja

# コンテキストが80%を超えたら自動圧縮
> /config set autoCompact true
> /config set autoCompactThreshold 80

# 詳細なデバッグ情報を表示
> /config set verboseMode true
```

`~/.claude/config.json` を直接編集することも可能です。

```json
{
  "model": "claude-opus-4-6",
  "maxTokens": 4096,
  "autoCompact": true,
  "autoCompactThreshold": 80,
  "language": "ja",
  "theme": "dark",
  "verboseMode": false
}
```

## カスタムワークフローの構築

スラッシュコマンドは単独で使うだけでなく、組み合わせることで**繰り返し使えるワークフロー**を作れます。

### ワークフロー例1: 朝の作業開始ルーティン

```bash
# 毎朝の作業開始時に実行するコマンドシーケンス
> /status        # 前回のセッション状態を確認
> /model         # 適切なモデルが選択されているか確認
> /memory show   # プロジェクトのコンテキストを再確認
> /doctor        # 環境に問題がないか確認

# 状態を確認してから作業開始
> 昨日の続きから始めます。src/features/checkout/ の実装を続けてください。
```

### ワークフロー例2: PRマージ前の品質チェック

```bash
# コードをコミット前に実施するチェックシーケンス
> /review                              # 変更内容の総合レビュー
> セキュリティの観点から再度確認してください  # セキュリティレビュー
> /cost                                # コスト確認

# 問題がなければコミット
> テストを実行してすべてパスすることを確認してください
> git commit -m "feat: チェックアウト機能を実装" を実行してください
```

### ワークフロー例3: 新機能開発サイクル

```bash
# 1. 作業環境の準備
> /clear                    # クリーンな状態でスタート
> /status                   # コンテキスト使用量を確認

# 2. 設計フェーズ（軽量モデルで高速に）
> /model claude-haiku-3-5   # 軽量モデルに切り替え
> 新しいユーザー通知機能の設計を提案してください

# 3. 実装フェーズ（高性能モデルで正確に）
> /model claude-opus-4-6    # 高性能モデルに切り替え
> 設計を実装してください

# 4. 中間確認
> /compact                  # 途中でコンテキストを圧縮

# 5. レビューと仕上げ
> /review                   # 変更をレビュー
> テストを追加して実行してください
```

## コマンドショートカットと効率化テクニック

### よく使うコマンドの記憶術

| コマンド | 覚え方 |
|---------|--------|
| `/help` | **H**elp = 助けて |
| `/clear` | **C**lear = 消去 |
| `/compact` | **C**ompact = 圧縮 |
| `/cost` | **C**ost = コスト |
| `/model` | **M**odel = モデル |
| `/review` | **R**eview = レビュー |
| `/init` | **Init**ialize = 初期化 |
| `/doctor` | **D**octor = 診断 |

### タブ補完の活用

Claude Codeのコマンド入力では、`/` と最初の数文字を入力してTabキーを押すとコマンド名が補完されます。

```bash
> /re[Tab]     → /review
> /co[Tab]     → /compact または /config または /cost（候補一覧が表示）
> /com[Tab]    → /compact
> /con[Tab]    → /config
```

### 実行中コマンドのキャンセル

長時間かかる処理をキャンセルしたい場合は `Ctrl + C` を使います。

```bash
> /review
# 大量のファイルを処理中...

[Ctrl+C]  # キャンセル

Cancelled. Partial review completed for 3 of 12 files.
```

## パワーユーザー向けのヒント

### ヒント1: モデルを目的に応じて使い分ける

```bash
# 設計・アーキテクチャの検討 → 最高性能モデル
> /model claude-opus-4-6
> このシステムの認証アーキテクチャを設計してください

# 定型的なコード生成・変換 → 軽量モデル
> /model claude-haiku-3-5
> このJSON構造をTypeScriptのinterfaceに変換してください

# 通常の実装作業 → バランスモデル
> /model claude-sonnet-4-6
> ユーザー一覧APIのエンドポイントを実装してください
```

### ヒント2: /compact のタイミングを最適化する

```bash
# /status でコンテキスト使用量を定期的に確認
> /status
# Context used: 65,000 / 200,000 tokens (32.5%)  → まだ余裕あり

> /status
# Context used: 142,000 / 200,000 tokens (71.0%)  → /compact のタイミング
> /compact
```

### ヒント3: /review を段階的に使う

```bash
# 小さな変更ごとにレビュー → 問題を早期発見
> ユーザーモデルを追加してください
> /review    # この変更をすぐにレビュー

> ユーザー登録APIを追加してください
> /review    # 追加した変更をレビュー

# まとめてレビューするより、段階的にレビューする方が
# 問題を特定しやすく、修正もしやすい
```

### ヒント4: /doctor を定期実行して環境の健全性を維持

```bash
# 週次でのヘルスチェック習慣
> /doctor

# Claude Codeのバージョンアップ後に必ず実行
> /doctor

# 予期しないエラーや動作異常が起きたとき
> /doctor
```

### ヒント5: CLAUDE.mdと/initの組み合わせ

```bash
# プロジェクト構成が変わった後の更新フロー
> /init           # 新しい構成を自動検出して再生成

# 生成されたCLAUDE.mdを確認して手動調整
> CLAUDE.mdを確認して、不足している情報を追記してください

# メモリを更新
> /memory show    # 更新後のメモリを確認
```

## コマンドの組み合わせパターン早見表

| 目的 | コマンドシーケンス |
|------|------------------|
| 新規プロジェクト開始 | `/init` → `/doctor` → `/status` |
| 長時間作業中の最適化 | `/status` → `/compact` → `/cost` |
| PR作成前の品質確認 | `/review` → テスト実行 → `/cost` |
| 別タスクへの切り替え | `/cost` → `/clear` → `/model` |
| 環境トラブルの診断 | `/doctor` → `/status` → `/permissions` |
| 軽量作業（コスト節約） | `/model haiku` → 作業 → `/cost` |

## まとめ

高度なコマンドを習得することで、Claude Codeは単なるアシスタントから**開発インフラの一部**へと昇格します。

- **`/permissions`** でセキュリティと自動化のバランスを制御
- **`/config`** で自分のワークフローに合った設定をカスタマイズ
- **コマンドの組み合わせ**で繰り返し使える効率的なワークフローを構築
- **目的に応じたモデル選択**でコストと品質を最適化

スラッシュコマンドをマスターすることは、Claude Codeを単に「使う」から「使いこなす」へのステップです。日々の開発作業の中で積極的に活用し、自分なりのワークフローを確立していきましょう。
