# 通知とカスタムイベント

## はじめに

前のレッスンではPreToolUseとPostToolUseという「ツール操作」に関するフックを学びました。このレッスンでは、残る3種類のフック ── **Notification**（通知）、**Stop**（エージェント停止）、**SubagentStop**（サブエージェント停止） ── の使い方を学びます。

これらのフックを活用することで、Claude Codeのタスク状況をリアルタイムに把握したり、外部サービスと連携したりする包括的な自動化が実現できます。

## Notification フック

Notificationフックは、Claude Codeが**ユーザーへの通知を送ろうとしたとき**に実行されます。Claude Codeは長時間実行中のタスクで、状況をユーザーに知らせる際にこのイベントを発火します。

### 主な発火タイミング

- 長時間の処理が完了したとき
- ユーザーの入力が必要になったとき
- 重要な情報を伝えたいとき

### 受け取れる情報

NotificationフックはstdinからJSONを受け取ります。

```json
{
  "type": "notification",
  "message": "タスクが完了しました。確認してください。",
  "session_id": "abc123"
}
```

## 実践例1: デスクトップ通知

Claude Codeの通知をOSのデスクトップ通知に転送する設定です。

### macOS向けスクリプト

```bash
#!/bin/bash
# /scripts/desktop-notification.sh

INPUT=$(cat)
MESSAGE=$(echo "$INPUT" | jq -r '.message // "Claude Codeからの通知"')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""')

# macOSのosascriptを使ったデスクトップ通知
osascript -e "display notification \"$MESSAGE\" with title \"Claude Code\" subtitle \"Session: $SESSION_ID\" sound name \"Glass\""

# 通知をログファイルにも記録
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $MESSAGE" >> "$HOME/.claude/notification.log"

exit 0
```

### 設定ファイル

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash /scripts/desktop-notification.sh"
          }
        ]
      }
    ]
  }
}
```

## 実践例2: Slack通知との連携

Claude Codeの通知をSlackのWebhookに転送します。

### Slack通知スクリプト

```bash
#!/bin/bash
# /scripts/slack-notification.sh

INPUT=$(cat)
MESSAGE=$(echo "$INPUT" | jq -r '.message // "Claude Codeからの通知"')

# SlackのWebhook URL（環境変数から取得）
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

if [ -z "$SLACK_WEBHOOK_URL" ]; then
  echo "SLACK_WEBHOOK_URLが設定されていません"
  exit 0
fi

# Slackへのメッセージ送信
PAYLOAD=$(jq -n \
  --arg text ":robot_face: *Claude Code通知*\n$MESSAGE" \
  '{text: $text}')

curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$SLACK_WEBHOOK_URL" > /dev/null

echo "Slack通知を送信しました: $MESSAGE"
exit 0
```

### 設定ファイル

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash /scripts/slack-notification.sh"
          }
        ]
      }
    ]
  }
}
```

## Stop フック

Stopフックは、メインエージェントが**タスクを完了して停止するとき**に実行されます。このフックはタスクの「締め括り」として使用し、後処理や完了報告に活用できます。

### 実行タイミング

```
Claude Code タスク実行中
        ↓
    タスク完了
        ↓
  [Stop Hook 実行]
        ↓
   Claude Code 終了
```

### 受け取れる情報

```json
{
  "type": "stop",
  "session_id": "abc123",
  "stop_reason": "task_complete"
}
```

## 実践例3: タスク完了時の要約生成

タスクが完了した際に、変更されたファイルの一覧をまとめたレポートを生成します。

### 要約生成スクリプト

```bash
#!/bin/bash
# /scripts/task-completion-summary.sh

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "==================================="
echo "タスク完了レポート"
echo "==================================="
echo "セッションID: $SESSION_ID"
echo "完了時刻: $TIMESTAMP"
echo ""

# Gitで変更されたファイルを確認
if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
  echo "変更されたファイル:"
  git status --short
  echo ""

  echo "変更の差分（最新）:"
  git diff --stat HEAD 2>/dev/null || git diff --stat 2>/dev/null
fi

echo "==================================="

# レポートをファイルに保存
REPORT_FILE=".claude/reports/task-${SESSION_ID}-${TIMESTAMP// /_}.txt"
mkdir -p ".claude/reports"

{
  echo "タスク完了レポート"
  echo "セッションID: $SESSION_ID"
  echo "完了時刻: $TIMESTAMP"
  git status --short 2>/dev/null
} > "$REPORT_FILE"

echo "レポートを保存しました: $REPORT_FILE"
exit 0
```

### 設定ファイル

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash /scripts/task-completion-summary.sh"
          }
        ]
      }
    ]
  }
}
```

## 実践例4: タスク完了後の自動テスト実行

Claude Codeがコード変更を完了した後、自動的にテストスイートを実行します。

```bash
#!/bin/bash
# /scripts/run-tests-on-stop.sh

INPUT=$(cat)

echo "Claude Codeのタスクが完了しました。テストを実行します..."

# package.jsonが存在するプロジェクトの場合
if [ -f "package.json" ]; then
  # テストコマンドが設定されているか確認
  if jq -e '.scripts.test' package.json > /dev/null 2>&1; then
    echo "npm testを実行中..."
    npm test --passWithNoTests 2>&1
    TEST_EXIT_CODE=$?

    if [ $TEST_EXIT_CODE -eq 0 ]; then
      echo "全テストが成功しました"
    else
      echo "テストが失敗しました（終了コード: $TEST_EXIT_CODE）"
    fi
  fi
fi

# Pythonプロジェクトの場合
if [ -f "pytest.ini" ] || [ -f "setup.py" ] || [ -f "pyproject.toml" ]; then
  if command -v pytest &> /dev/null; then
    echo "pytestを実行中..."
    pytest --tb=short 2>&1
  fi
fi

exit 0
```

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash /scripts/run-tests-on-stop.sh"
          }
        ]
      }
    ]
  }
}
```

## SubagentStop フック

SubagentStopフックは、**サブエージェントが停止するとき**に実行されます。Claude Codeが並列でサブエージェントを実行している場合（サブエージェント機能を利用している場合）に活用できます。

### Stopとの違い

| フック | トリガー |
|-------|---------|
| `Stop` | メインエージェントの完了時 |
| `SubagentStop` | 個々のサブエージェントの完了時 |

### 実践例5: サブエージェントの進捗追跡

```bash
#!/bin/bash
# /scripts/track-subagent-progress.sh

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 進捗ログに記録
PROGRESS_LOG=".claude/subagent-progress.log"
mkdir -p ".claude"

echo "[$TIMESTAMP] サブエージェント完了: $SESSION_ID" >> "$PROGRESS_LOG"

# 完了したサブエージェント数をカウント
COMPLETED=$(wc -l < "$PROGRESS_LOG")
echo "完了したサブエージェント: ${COMPLETED}個"

exit 0
```

```json
{
  "hooks": {
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash /scripts/track-subagent-progress.sh"
          }
        ]
      }
    ]
  }
}
```

## 全フックを組み合わせた包括的な自動化

実際のプロジェクトでは、複数のフックを組み合わせて包括的なワークフロー自動化を構築します。

### 総合設定例

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash /scripts/check-protected-files.sh"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash /scripts/check-dangerous-commands.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash /scripts/format-on-save.sh"
          },
          {
            "type": "command",
            "command": "bash /scripts/run-eslint-after-edit.sh"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash /scripts/desktop-notification.sh"
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
            "command": "bash /scripts/task-completion-summary.sh"
          },
          {
            "type": "command",
            "command": "bash /scripts/run-tests-on-stop.sh"
          },
          {
            "type": "command",
            "command": "bash /scripts/slack-notification.sh"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash /scripts/track-subagent-progress.sh"
          }
        ]
      }
    ]
  }
}
```

### この設定が実現するワークフロー

```
ユーザーがClaude Codeにタスクを依頼
        ↓
Claude Codeがファイルを編集しようとする
        ↓ [PreToolUse: 保護ファイルチェック]
編集実行
        ↓ [PostToolUse: Prettier + ESLint]
次のファイルを編集... (繰り返し)
        ↓
Claude Codeが通知を送ろうとする
        ↓ [Notification: デスクトップ通知]
タスクが完了
        ↓ [Stop: 要約生成 → テスト実行 → Slack通知]
完了
```

## まとめ

このレッスンでは、Notification、Stop、SubagentStopフックの詳細と実践例を学びました。

- **Notification**: Claude Codeの通知を外部サービス（デスクトップ、Slack等）に転送できる
- **Stop**: タスク完了時の後処理（要約生成、テスト実行、通知送信）に活用する
- **SubagentStop**: サブエージェントの進捗管理や結果集約に使用する
- 複数のフックを組み合わせることで、包括的な自動化ワークフローを構築できる

次のレッスンでは、実際のプロジェクトで使えるより高度なフック設定と、デバッグ・トラブルシューティングの方法を学びます。
