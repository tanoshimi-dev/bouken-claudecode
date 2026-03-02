# Hooksの基本概念

## はじめに

Claude CodeのHooks機能は、AIエージェントの動作に対してプログラム的な制御を追加するための強力な仕組みです。Hooksを使うことで、特定のイベントが発生したときに任意のシェルコマンドやスクリプトを自動的に実行させることができます。

例えば、Claude Codeがファイルを編集した直後に自動的にリンターを実行したり、危険な操作の前に確認スクリプトを挟んだりと、開発ワークフローを細かくカスタマイズすることが可能です。

## Hooksとは何か

Hooksとは、Claude Codeの**ライフサイクルイベント**に対してフックする（引っかかる）コマンドのことです。特定のタイミングで自動的に実行されるシェルコマンドを定義することで、Claude Codeの動作を拡張・制御できます。

### Hooksが解決する課題

通常のClaude Codeの動作では、AIがツールを呼び出してファイルを操作したり、コマンドを実行したりします。しかし、開発現場ではこうした操作の前後で追加の処理が必要になることが多くあります。

- ファイルを書き込む前に、書き込み先が保護されていないか確認したい
- コードを編集した後、自動的にフォーマッターを実行したい
- エージェントが完了したときにSlackに通知を送りたい
- テストファイルを変更したとき、即座にテストを実行して結果を確認したい

Hooksはこうした要件に対応するための仕組みです。

## イベントの種類

Claude CodeのHooksには、5種類のイベントが存在します。

### 1. PreToolUse（ツール実行前）

ツールが呼び出される**直前**に実行されます。このフックはツールの実行を**ブロック**（中止）することができます。

```
ユーザー指示 → Claude判断 → [PreToolUse Hook] → ツール実行 → 結果
```

主な用途:
- 特定のファイルへの書き込みを防ぐ
- 危険なコマンドの実行前に確認を行う
- 入力値のバリデーション

### 2. PostToolUse（ツール実行後）

ツールが呼び出された**直後**に実行されます。ツールの実行結果を受け取って処理を行います。

```
ツール実行 → 結果 → [PostToolUse Hook] → 次の処理
```

主な用途:
- コード編集後にリンターを実行する
- ファイル変更後に自動フォーマットを適用する
- 変更内容をログに記録する

### 3. Notification（通知）

Claude Codeがユーザーに対して通知を送ろうとしたときに実行されます。

主な用途:
- カスタム通知システムとの連携
- Slack/Discordへの通知転送
- デスクトップ通知の表示

### 4. Stop（エージェント停止）

メインのエージェントが**タスクを完了**して停止するときに実行されます。

主な用途:
- タスク完了時の後処理
- 作業サマリーの生成
- 完了通知の送信

### 5. SubagentStop（サブエージェント停止）

サブエージェント（並列実行されるエージェント）が停止するときに実行されます。

主な用途:
- 並列タスクの完了監視
- サブエージェントの結果集約

## Hooksの設定場所

HooksはClaude Codeの設定ファイルである `.claude/settings.json` に記述します。

### 設定ファイルの場所

```
プロジェクトルート/
├── .claude/
│   └── settings.json   ← Hooksをここに定義する
├── src/
│   └── ...
└── package.json
```

> **注意**: `.claude/settings.json` はプロジェクト固有の設定ファイルです。グローバルな設定は `~/.claude/settings.json` に記述します。

## 基本的なHookの構造

Hooksの設定は `hooks` キーの下にイベント名を指定し、その配下にフック定義を記述します。

### 最小構成の例

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'ツールが実行されました'"
          }
        ]
      }
    ]
  }
}
```

### フィールドの説明

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `matcher` | string | どのツールにマッチするかを指定するパターン |
| `hooks` | array | 実行するフックの配列 |
| `type` | string | フックの種類（現在は `"command"` のみ） |
| `command` | string | 実行するシェルコマンド |

### matchers（マッチャー）の基本

`matcher` フィールドは、どのツール呼び出しに対してフックを適用するかを制御します。

```json
{
  "matcher": ""
}
```

空文字列 `""` を指定するとすべてのツールにマッチします。

```json
{
  "matcher": "Edit"
}
```

ツール名を指定すると、そのツールが呼び出されたときのみフックが実行されます。

## 設定ファイルの全体構造

実際のプロジェクトで使用する設定ファイルの例を見てみましょう。

```json
{
  "permissions": {
    "allow": [],
    "deny": []
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "echo '書き込み操作が試みられました'"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'ファイルが編集されました'"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'タスクが完了しました'"
          }
        ]
      }
    ]
  }
}
```

## Hooksの実行環境

Hookのコマンドは、Claude Codeが動作しているディレクトリと同じカレントディレクトリで実行されます。環境変数もClaude Codeの実行環境を引き継ぎます。

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "echo $PWD"
          }
        ]
      }
    ]
  }
}
```

### 標準入力（stdin）からの情報取得

HookコマンドはJSONフォーマットで詳細なコンテキスト情報を標準入力から受け取ることができます。

```bash
#!/bin/bash
# フックスクリプトの例（hook.sh）

# stdinからJSONを読み込む
INPUT=$(cat)

# jqで必要な情報を抽出する
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.path // ""')

echo "ツール: $TOOL_NAME"
echo "ファイル: $FILE_PATH"
```

このスクリプトをフックとして登録する場合:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash /path/to/hook.sh"
          }
        ]
      }
    ]
  }
}
```

## まとめ

このレッスンでは、Claude CodeのHooks機能の基本概念を学びました。

- **Hooks**はClaude Codeのライフサイクルイベントにコマンドを紐付ける仕組み
- 5種類のイベント（**PreToolUse, PostToolUse, Notification, Stop, SubagentStop**）が存在する
- 設定は `.claude/settings.json` の `hooks` キーに記述する
- `matcher` でどのツールに適用するかを制御し、`command` で実行するコマンドを指定する

次のレッスンでは、最も重要な **PreToolUse** と **PostToolUse** フックの詳細な使い方と実践的な応用例を学びます。
