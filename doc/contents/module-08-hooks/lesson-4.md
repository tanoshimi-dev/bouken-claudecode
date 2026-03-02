# 実践：Hooksによるワークフロー自動化

## はじめに

このレッスンでは、実際のプロジェクトで活用できる高度なフック設定を学びます。自動フォーマット、テスト自動実行、セキュリティチェック、カスタム通知システムといった実践的なユースケースと、フックが正しく動作しないときのデバッグ・トラブルシューティング方法も取り上げます。

## ディレクトリ構成のベストプラクティス

フックスクリプトを管理しやすくするためのプロジェクト構成例です。

```
プロジェクトルート/
├── .claude/
│   ├── settings.json          ← Hook設定
│   ├── hooks/                 ← フックスクリプト群
│   │   ├── pre-write.sh
│   │   ├── post-edit.sh
│   │   ├── on-stop.sh
│   │   └── on-notify.sh
│   ├── logs/                  ← フック実行ログ
│   │   └── hooks.log
│   └── reports/               ← タスクレポート
└── ...
```

スクリプトファイルへのパスは絶対パスか、プロジェクトルートからの相対パスで指定します。

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/post-edit.sh"
          }
        ]
      }
    ]
  }
}
```

## 実践例1: ファイル保存時の自動フォーマット

言語ごとに適したフォーマッターを自動的に選択して実行します。

```bash
#!/bin/bash
# .claude/hooks/post-edit.sh
# ファイル編集後の自動フォーマット

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.path // .tool_input.file_path // ""')

# ファイルが存在しない場合はスキップ
if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# ログ関数
log() {
  echo "[$(date '+%H:%M:%S')] $1" | tee -a .claude/logs/hooks.log
}

EXTENSION="${FILE_PATH##*.}"

case "$EXTENSION" in
  # JavaScript / TypeScript系
  js|jsx|ts|tsx)
    if [ -f ".prettierrc" ] || [ -f "prettier.config.js" ] || [ -f ".prettierrc.json" ]; then
      npx prettier --write "$FILE_PATH" 2>/dev/null && log "Prettier: $FILE_PATH"
    fi
    # ESLintも実行
    if [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
      npx eslint --fix "$FILE_PATH" 2>/dev/null && log "ESLint --fix: $FILE_PATH"
    fi
    ;;

  # Python系
  py)
    if command -v black &> /dev/null; then
      black --quiet "$FILE_PATH" 2>/dev/null && log "Black: $FILE_PATH"
    fi
    if command -v isort &> /dev/null; then
      isort --quiet "$FILE_PATH" 2>/dev/null && log "isort: $FILE_PATH"
    fi
    ;;

  # Go系
  go)
    if command -v gofmt &> /dev/null; then
      gofmt -w "$FILE_PATH" 2>/dev/null && log "gofmt: $FILE_PATH"
    fi
    ;;

  # Rust系
  rs)
    if command -v rustfmt &> /dev/null; then
      rustfmt "$FILE_PATH" 2>/dev/null && log "rustfmt: $FILE_PATH"
    fi
    ;;

  # JSON / YAML / Markdown
  json)
    npx prettier --write "$FILE_PATH" 2>/dev/null && log "Prettier(json): $FILE_PATH"
    ;;
  yml|yaml)
    if command -v yamlfmt &> /dev/null; then
      yamlfmt "$FILE_PATH" 2>/dev/null && log "yamlfmt: $FILE_PATH"
    fi
    ;;
esac

exit 0
```

## 実践例2: コード変更後のテスト自動実行

コードが変更されたとき、関連するテストを自動実行して素早くフィードバックを得ます。

```bash
#!/bin/bash
# .claude/hooks/run-related-tests.sh
# 変更ファイルに関連するテストを実行

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.path // ""')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

log() {
  echo "[$(date '+%H:%M:%S')] $1"
}

# テストファイルの判定（テストファイル自体が変更された場合）
if [[ "$FILE_PATH" =~ \.(test|spec)\.(js|jsx|ts|tsx)$ ]] || [[ "$FILE_PATH" =~ _test\.(go|py)$ ]]; then
  log "テストファイルが変更されました: $FILE_PATH"
  log "関連テストを実行します..."

  if [ -f "package.json" ]; then
    # JestやVitestで特定ファイルのテストのみ実行
    npx jest "$FILE_PATH" --passWithNoTests 2>&1 | tail -20
  fi
  exit 0
fi

# ソースファイルが変更された場合、対応するテストを探して実行
if [[ "$FILE_PATH" =~ \.(js|jsx|ts|tsx)$ ]]; then
  # src/components/Button.tsx → src/components/Button.test.tsx を探す
  BASE="${FILE_PATH%.*}"
  EXT="${FILE_PATH##*.}"

  TEST_CANDIDATES=(
    "${BASE}.test.${EXT}"
    "${BASE}.spec.${EXT}"
    "${BASE%.tsx}.test.tsx"
    "${BASE%.ts}.test.ts"
  )

  for TEST_FILE in "${TEST_CANDIDATES[@]}"; do
    if [ -f "$TEST_FILE" ]; then
      log "関連テストが見つかりました: $TEST_FILE"
      npx jest "$TEST_FILE" --passWithNoTests 2>&1 | tail -20
      break
    fi
  done
fi

exit 0
```

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/post-edit.sh"
          },
          {
            "type": "command",
            "command": "bash .claude/hooks/run-related-tests.sh"
          }
        ]
      }
    ]
  }
}
```

## 実践例3: セキュリティチェックフック

コードに機密情報が含まれていないか、セキュリティ上の問題がないかを事前にチェックします。

```bash
#!/bin/bash
# .claude/hooks/security-check.sh
# 書き込み前のセキュリティチェック

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.path // .tool_input.file_path // ""')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // ""')

ISSUES_FOUND=0

# 1. シークレット・機密情報の検出
SECRET_PATTERNS=(
  "password\s*=\s*['\"][^'\"]{8,}"
  "api_key\s*=\s*['\"][^'\"]{10,}"
  "secret\s*=\s*['\"][^'\"]{10,}"
  "AWS_SECRET_ACCESS_KEY"
  "PRIVATE KEY"
  "BEGIN RSA"
)

for pattern in "${SECRET_PATTERNS[@]}"; do
  if echo "$CONTENT" | grep -qiE "$pattern"; then
    echo "セキュリティ警告: 機密情報が含まれている可能性があります（パターン: $pattern）"
    echo "ファイル: $FILE_PATH"
    ISSUES_FOUND=1
  fi
done

# 2. 保護ファイルへの書き込みチェック
PROTECTED_FILES=(
  ".env"
  ".env.local"
  ".env.production"
  "config/credentials.yml"
  "secrets.json"
)

for protected in "${PROTECTED_FILES[@]}"; do
  if [[ "$FILE_PATH" == *"$protected" ]]; then
    echo "エラー: '$FILE_PATH' は保護されたファイルです。"
    echo "このファイルへの書き込みはHookによってブロックされました。"
    exit 1
  fi
done

# 問題が見つかった場合は警告を表示（ブロックはしない）
if [ $ISSUES_FOUND -eq 1 ]; then
  echo ""
  echo "上記の警告を確認してから続けてください。"
  echo "意図的な変更の場合は、このメッセージを無視して構いません。"
fi

exit 0
```

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/security-check.sh"
          }
        ]
      }
    ]
  }
}
```

## 実践例4: カスタム通知システムの構築

プロジェクトの状態に応じて、適切なチャンネルに通知を送る高度な通知システムです。

```bash
#!/bin/bash
# .claude/hooks/smart-notify.sh
# インテリジェントな通知システム

INPUT=$(cat)
HOOK_TYPE=$(echo "$INPUT" | jq -r '.type // "unknown"')
MESSAGE=$(echo "$INPUT" | jq -r '.message // ""')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')

# 通知の優先度を判定する関数
get_priority() {
  local msg="$1"
  if echo "$msg" | grep -qi "エラー\|error\|失敗\|failed\|critical"; then
    echo "high"
  elif echo "$msg" | grep -qi "警告\|warning\|注意"; then
    echo "medium"
  else
    echo "low"
  fi
}

PRIORITY=$(get_priority "$MESSAGE")

# 優先度に応じた通知先の選択
case "$PRIORITY" in
  high)
    # 高優先度: デスクトップ通知 + Slack通知
    if [[ "$OSTYPE" == "darwin"* ]]; then
      osascript -e "display notification \"$MESSAGE\" with title \"Claude Code - 要対応\" sound name \"Basso\""
    fi
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
      curl -s -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\":alert: *Claude Code要対応通知*\n$MESSAGE\"}" \
        "$SLACK_WEBHOOK_URL" > /dev/null
    fi
    ;;

  medium)
    # 中優先度: デスクトップ通知のみ
    if [[ "$OSTYPE" == "darwin"* ]]; then
      osascript -e "display notification \"$MESSAGE\" with title \"Claude Code - 警告\""
    fi
    ;;

  low)
    # 低優先度: ログのみ
    mkdir -p .claude/logs
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $MESSAGE" >> .claude/logs/notifications.log
    ;;
esac

exit 0
```

## フックのデバッグ方法

フックが期待通りに動作しない場合のデバッグ手順を説明します。

### デバッグ用ログスクリプト

```bash
#!/bin/bash
# .claude/hooks/debug-logger.sh
# 全フックイベントの詳細ログを記録する

mkdir -p .claude/logs

LOG_FILE=".claude/logs/debug-$(date '+%Y%m%d').log"

{
  echo "================================================"
  echo "タイムスタンプ: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "スクリプト: $0"
  echo "引数: $*"
  echo ""
  echo "--- STDIN (JSON) ---"
  INPUT=$(cat)
  echo "$INPUT" | jq . 2>/dev/null || echo "$INPUT"
  echo ""
  echo "--- 環境変数 ---"
  echo "PWD: $PWD"
  echo "USER: $USER"
  echo "HOME: $HOME"
  echo "================================================"
} >> "$LOG_FILE" 2>&1

exit 0
```

デバッグ中は、通常のフックの**前**にこのスクリプトを追加します。

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/debug-logger.sh"
          },
          {
            "type": "command",
            "command": "bash .claude/hooks/post-edit.sh"
          }
        ]
      }
    ]
  }
}
```

### よくあるトラブルと解決策

#### 問題1: スクリプトが実行されない

```bash
# 実行権限を確認する
ls -la .claude/hooks/

# 実行権限を付与する
chmod +x .claude/hooks/*.sh
```

#### 問題2: コマンドが見つからない（PATH問題）

フックのコマンドは、ユーザーの通常のシェル環境とは異なるPATH設定で実行されることがあります。

```bash
#!/bin/bash
# PATH を明示的に設定する
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# またはコマンドのフルパスを指定する
/usr/local/bin/npx prettier --write "$FILE_PATH"
```

#### 問題3: jqがインストールされていない

```bash
# jqのインストール確認
if ! command -v jq &> /dev/null; then
  echo "警告: jqがインストールされていません。フックの機能が制限されます。"
  exit 0
fi
```

#### 問題4: PreToolUseで意図せずブロックしてしまう

```bash
#!/bin/bash
# デバッグ: 何が原因でブロックされているか確認
INPUT=$(cat)
echo "DEBUG INPUT: $INPUT" >> .claude/logs/preblock-debug.log

# 実際のチェックロジック
# ...

# ブロックするときは必ず理由を明示する
echo "ブロック理由: ..."
exit 1
```

## 本番環境向けの設定例

実際のプロジェクト本番設定として使える完成度の高い `.claude/settings.json` です。

```json
{
  "permissions": {
    "allow": [
      "Bash(git *)",
      "Bash(npm *)",
      "Bash(npx *)"
    ],
    "deny": [
      "Bash(rm -rf *)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/security-check.sh"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/check-dangerous-commands.sh"
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
            "command": "bash .claude/hooks/post-edit.sh"
          },
          {
            "type": "command",
            "command": "bash .claude/hooks/run-related-tests.sh"
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
            "command": "bash .claude/hooks/smart-notify.sh"
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
            "command": "bash .claude/hooks/task-completion-summary.sh"
          }
        ]
      }
    ]
  }
}
```

## まとめ

このレッスンでは、実際のプロジェクトで活用できる高度なフック設定と自動化パターンを学びました。

- **自動フォーマット**: 言語ごとに適切なフォーマッターを自動選択して実行
- **テスト自動実行**: ファイル変更に関連するテストを即座に検出・実行
- **セキュリティチェック**: 機密情報や保護ファイルへの誤書き込みを防止
- **スマート通知**: メッセージの優先度に応じて通知先を自動選択
- **デバッグ**: ログ記録、実行権限確認、PATH問題の対処方法

Hooksを使いこなすことで、Claude Codeの動作を自分のプロジェクトの要件に合わせて細かくカスタマイズできます。最初はシンプルなフックから始め、プロジェクトの成長に合わせて段階的に自動化を拡張していくことをお勧めします。
