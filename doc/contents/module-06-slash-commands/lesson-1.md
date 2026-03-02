# 基本スラッシュコマンド

## はじめに

Claude Codeには、セッションを効率的に管理するための**スラッシュコマンド**が用意されています。スラッシュコマンドとは、会話の入力欄で `/` から始まる特殊なコマンドです。自然言語の指示とは異なり、Claude Codeの動作そのものを制御するためのインターフェースです。

このレッスンでは、日常的に最もよく使う基本スラッシュコマンドを一通り学びます。

## スラッシュコマンドとは

通常のメッセージはClaudeに「何かをしてもらう」ための指示ですが、スラッシュコマンドはClaudeセッションやツール自体を操作するためのコマンドです。

```bash
# Claude Codeを起動
claude

# セッション中でスラッシュコマンドを入力する例
> /help
> /clear
> /model
```

スラッシュコマンドはどのタイミングでも入力でき、会話の流れを中断せずにセッションを制御できます。

## /help - ヘルプの表示

最初に覚えるべきコマンドは `/help` です。利用可能なすべてのコマンドとその説明を一覧表示します。

```
> /help
```

**出力例:**

```
Claude Code Commands:
  /help              - Show this help message
  /clear             - Clear conversation history
  /compact           - Compact conversation to save context
  /model             - Show or change the current AI model
  /cost              - Show token usage and cost for this session
  /status            - Show current session status
  /review            - Review code changes
  /init              - Initialize project with CLAUDE.md
  /doctor            - Run diagnostics
  /memory            - Manage memory settings
  /permissions       - Manage tool permissions
  /config            - View or edit configuration

Type /help <command> for more details on a specific command.
```

特定のコマンドについて詳細を知りたい場合は、`/help <コマンド名>` と入力します。

```
> /help clear

/clear - Clear conversation history
  Clears the current conversation context window.
  Use when starting a new task to free up context space.
  Alias: /reset
```

## /clear - 会話履歴のクリア

`/clear` は現在の会話履歴（コンテキスト）をすべてクリアし、新鮮な状態でセッションを再開します。

```
> /clear
```

**出力例:**

```
Conversation history cleared. Starting fresh.
```

### いつ使うか

- 新しいタスクや別のファイルの作業に移るとき
- 会話が長くなりすぎてレスポンスの精度が落ちてきたと感じるとき
- 機密情報を含む会話をセッション中に消去したいとき

```bash
# 例: バグ修正作業が終わり、次の機能実装に移る前に
> /clear
> 次はユーザー認証機能を実装します。src/auth/ ディレクトリを確認してください。
```

> **注意:** `/clear` を実行すると、それまでの会話内容はすべて失われます。必要な情報は事前にメモしておきましょう。

## /compact - コンテキストの圧縮

`/compact` は会話履歴を要約・圧縮して、コンテキストウィンドウの使用量を削減するコマンドです。

```
> /compact
```

**出力例:**

```
Compacting conversation history...
Summary: Working on authentication module. Implemented JWT token handling
in src/auth/jwt.ts. Tests passing. Next: implement refresh token logic.
Context reduced from 45,230 tokens to 1,840 tokens.
```

### /clear との違い

| コマンド | 動作 | 使いどころ |
|---------|------|-----------|
| `/clear` | 履歴を完全に削除 | 全く別のタスクに切り替えるとき |
| `/compact` | 履歴を要約して圧縮 | 同じタスクを続けながら容量を節約したいとき |

長い作業セッションでは `/compact` を定期的に使うことで、コンテキストの品質を保ちながら作業を継続できます。

```bash
# 長時間の作業中、コンテキストが重くなってきたら
> /compact
# 要約された状態で作業を続ける
> 次に、リフレッシュトークンのロジックを実装してください。
```

## /model - モデルの確認と変更

`/model` コマンドを使うと、現在使用しているAIモデルを確認したり、別のモデルに切り替えたりできます。

### 現在のモデルを確認

```
> /model
```

**出力例:**

```
Current model: claude-opus-4-6
Available models:
  claude-opus-4-6      (current) - Most capable, best for complex tasks
  claude-sonnet-4-6               - Balanced speed and capability
  claude-haiku-3-5                - Fastest, best for simple tasks
```

### モデルを変更

```
> /model claude-haiku-3-5
```

**出力例:**

```
Model changed to: claude-haiku-3-5
Note: This model is faster but may have reduced capability for complex tasks.
```

### モデル選択の指針

| モデル | 特徴 | 適したタスク |
|--------|------|-------------|
| claude-opus-4-6 | 最高性能・高コスト | 複雑なアーキテクチャ設計、高難度のバグ修正 |
| claude-sonnet-4-6 | バランス型 | 一般的なコーディング、コードレビュー |
| claude-haiku-3-5 | 高速・低コスト | 簡単な質問、フォーマット変換、単純な補完 |

コストを抑えたい場合や、単純な作業をすばやく処理したい場合は軽量モデルへ切り替えましょう。

## /cost - コストの確認

`/cost` は現在のセッションで消費したトークン数とAPIコストを表示します。

```
> /cost
```

**出力例:**

```
Session Cost Summary:
  Input tokens:   23,450
  Output tokens:   8,120
  Total tokens:   31,570

  Estimated cost: $0.0842 USD

  Cache stats:
    Cache writes:  12,300 tokens
    Cache reads:   11,150 tokens
    Cache savings: ~$0.0312 USD
```

### コスト管理のヒント

- 長いファイルを何度も読み込む作業では、キャッシュが効いてコストが下がります
- 複雑なタスクには高性能モデルを、単純な作業には軽量モデルを使い分けることでコストを最適化できます
- セッション終了前に `/cost` を確認する習慣をつけると、月次のコスト予測が立てやすくなります

```bash
# 作業開始時に確認
> /cost
# ... 作業 ...
# 作業終了時に再確認して差分を把握
> /cost
```

## /status - セッションステータスの確認

`/status` はセッションの現在の状態を包括的に表示します。

```
> /status
```

**出力例:**

```
Claude Code Session Status
==========================
Model:          claude-opus-4-6
Session ID:     sess_01abc123
Working dir:    /Users/dev/my-project
Context used:   18,240 / 200,000 tokens (9.1%)
Session start:  2026-03-02 09:15:32

Active permissions:
  - File read/write
  - Shell commands
  - Git operations

Memory:
  - Project memory: CLAUDE.md loaded (1,240 tokens)
  - User memory: ~/.claude/CLAUDE.md loaded (380 tokens)
```

### ステータス確認の活用例

```bash
# 作業前にコンテキスト使用量を確認
> /status
# Context used: 72,400 / 200,000 tokens (36.2%)
# まだ余裕があるので作業を続ける

# コンテキストが多くなってきたら
> /status
# Context used: 168,000 / 200,000 tokens (84.0%)
# /compact か /clear で整理する
> /compact
```

## コマンドの組み合わせ活用

基本コマンドを組み合わせることで、効率的なワークフローが構築できます。

```bash
# 作業開始時のルーティン
> /status          # 現在の状態を確認
> /model           # 適切なモデルが選択されているか確認

# 長時間作業中の管理
> /cost            # コスト状況を把握
> /compact         # 必要に応じてコンテキストを圧縮

# タスク切り替え時
> /clear           # 別タスクに切り替える前にリセット
```

## まとめ

基本スラッシュコマンドを身につけることで、Claude Codeのセッションを自分でコントロールできるようになります。

| コマンド | 役割 |
|---------|------|
| `/help` | 利用可能なコマンドを一覧表示 |
| `/clear` | 会話履歴を完全にクリア |
| `/compact` | 会話履歴を要約・圧縮 |
| `/model` | 使用モデルの確認・変更 |
| `/cost` | トークン消費量とコストの確認 |
| `/status` | セッション全体の状態確認 |

次のレッスンでは、コード開発を支援するより専門的なコマンドを学びます。
