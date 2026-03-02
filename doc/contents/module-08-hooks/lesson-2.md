# PreToolUseとPostToolUse

## はじめに

前のレッスンでHooksの基本概念を学びました。このレッスンでは、最も頻繁に使用される **PreToolUse** と **PostToolUse** の2つのフックについて、詳細な設定方法と実践的な使用例を学びます。

この2つのフックを使いこなすことで、Claude Codeの動作に対して細かな制御を加え、開発ワークフローを大幅に改善できます。

## PreToolUse フック

PreToolUseフックは、Claude Codeがツールを実行する**直前**に呼び出されます。このフックの最大の特徴は、ツールの実行を**ブロック（中止）できる**ことです。

### 実行フロー

```
Claude判断 → ツール呼び出し要求
                ↓
        [PreToolUse Hook実行]
                ↓
        終了コード確認
       /              \
    0（成功）        非0（エラー）
      ↓                   ↓
  ツール実行        実行ブロック
                  (Claudeに理由を伝える)
```

### ブロックの仕組み

PreToolUseフックのコマンドが**終了コード0以外**で終了すると、ツールの実行がブロックされます。コマンドの**標準出力**がClaude Codeにブロック理由として伝えられます。

```bash
#!/bin/bash
# 終了コード1でブロック
echo "このファイルへの書き込みは禁止されています"
exit 1
```

## matcher（マッチャー）の詳細設定

### ツール名でのマッチング

Claude Codeの主要なツール名は以下の通りです:

| ツール名 | 説明 |
|---------|------|
| `Read` | ファイルの読み込み |
| `Write` | ファイルの新規作成・上書き |
| `Edit` | ファイルの部分編集 |
| `Bash` | シェルコマンドの実行 |
| `Glob` | ファイルパターン検索 |
| `Grep` | ファイル内容の検索 |
| `WebFetch` | Webページの取得 |

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Bashコマンドが実行されます'"
          }
        ]
      }
    ]
  }
}
```

### file_pattern でのマッチング

ツール名だけでなく、操作対象のファイルパスパターンでマッチングすることもできます。

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "/usr/local/bin/check-file-protection.sh"
          }
        ]
      }
    ]
  }
}
```

## 実践例1: 保護ファイルへの書き込みブロック

特定のファイルやディレクトリへの書き込みを防ぐ設定です。

### シナリオ

`.env` ファイルや本番環境の設定ファイルへの誤った書き込みを防ぎたい。

### フックスクリプト

```bash
#!/bin/bash
# /scripts/check-protected-files.sh

# stdinからJSONを読み込む
INPUT=$(cat)

# 操作対象のファイルパスを取得
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.path // .tool_input.file_path // ""')

# 保護するファイルパターン
PROTECTED_PATTERNS=(
  ".env"
  ".env.production"
  "config/secrets.yml"
  "*.pem"
  "*.key"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "エラー: '$FILE_PATH' は保護されたファイルです。直接編集はできません。"
    echo "保護されたファイルを変更するには、手動で編集してください。"
    exit 1
  fi
done

exit 0
```

### 設定ファイル

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
      }
    ]
  }
}
```

## 実践例2: 危険なBashコマンドのブロック

`rm -rf` などの危険なコマンドを実行前に検知してブロックします。

### フックスクリプト

```bash
#!/bin/bash
# /scripts/check-dangerous-commands.sh

INPUT=$(cat)

# 実行されるコマンドを取得
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# 危険なパターンのリスト
DANGEROUS_PATTERNS=(
  "rm -rf /"
  "rm -rf ~"
  "rm -rf \*"
  "dd if=/dev/zero"
  "mkfs"
  "> /etc/passwd"
  "chmod -R 777 /"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qF "$pattern"; then
    echo "エラー: 危険なコマンドが検出されました: '$pattern'"
    echo "このコマンドの実行はブロックされました。"
    exit 1
  fi
done

# sudo使用時に警告（ブロックはしない）
if echo "$COMMAND" | grep -q "^sudo "; then
  echo "警告: sudoコマンドを実行しようとしています。" >&2
fi

exit 0
```

### 設定ファイル

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash /scripts/check-dangerous-commands.sh"
          }
        ]
      }
    ]
  }
}
```

## PostToolUse フック

PostToolUseフックは、ツールが実行された**直後**に呼び出されます。PreToolUseと異なり、ツールの実行を止める機能はありませんが、実行後の後処理に活用できます。

### 実行フロー

```
ツール実行 → 結果取得
                ↓
        [PostToolUse Hook実行]
                ↓
        フック処理完了
                ↓
        Claudeが次の処理へ
```

## 実践例3: コード編集後のESLint自動実行

ファイルを編集するたびに自動的にESLintを実行します。

### フックスクリプト

```bash
#!/bin/bash
# /scripts/run-eslint-after-edit.sh

INPUT=$(cat)

# 編集されたファイルパスを取得
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.path // ""')

# JavaScriptまたはTypeScriptファイルの場合のみ実行
if [[ "$FILE_PATH" =~ \.(js|jsx|ts|tsx)$ ]]; then
  echo "ESLintを実行中: $FILE_PATH"

  # ESLintの実行（自動修正オプション付き）
  if npx eslint --fix "$FILE_PATH" 2>&1; then
    echo "ESLint: 問題なし（または自動修正済み）"
  else
    echo "ESLint: 修正が必要な問題が残っています"
    # PostToolUseはブロックできないが、結果をClaude Codeに伝える
    npx eslint "$FILE_PATH"
  fi
fi

exit 0
```

### 設定ファイル

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash /scripts/run-eslint-after-edit.sh"
          }
        ]
      }
    ]
  }
}
```

## 実践例4: コード編集後のPrettier自動フォーマット

ファイル保存のたびにPrettierで自動フォーマットを実行します。

### 設定ファイル（シンプル版）

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'FILE=$(cat | jq -r \".tool_input.path // .tool_input.file_path // \\\"\\\"\" ); [ -n \"$FILE\" ] && npx prettier --write \"$FILE\" 2>/dev/null || true'"
          }
        ]
      }
    ]
  }
}
```

### スクリプトファイルを使った設定（推奨）

```bash
#!/bin/bash
# /scripts/format-on-save.sh

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.path // ""')

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# 対応する拡張子の確認
EXTENSION="${FILE_PATH##*.}"
case "$EXTENSION" in
  js|jsx|ts|tsx|css|scss|json|md|html)
    # Prettierの設定ファイルが存在する場合のみ実行
    if [ -f ".prettierrc" ] || [ -f "prettier.config.js" ] || [ -f ".prettierrc.json" ]; then
      npx prettier --write "$FILE_PATH" 2>&1
      echo "Prettier: $FILE_PATH をフォーマットしました"
    fi
    ;;
  py)
    # Pythonの場合はblackを使用
    if command -v black &> /dev/null; then
      black "$FILE_PATH" 2>&1
      echo "Black: $FILE_PATH をフォーマットしました"
    fi
    ;;
esac

exit 0
```

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash /scripts/format-on-save.sh"
          }
        ]
      }
    ]
  }
}
```

## 複数フックの組み合わせ

1つのイベントに対して複数のフックを設定することができます。フックは配列の順番通りに実行されます。

```json
{
  "hooks": {
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
          },
          {
            "type": "command",
            "command": "bash /scripts/update-change-log.sh"
          }
        ]
      }
    ]
  }
}
```

この例では、ファイルが編集されるたびに:
1. Prettierでフォーマット
2. ESLintでチェック
3. 変更ログを更新

という3つの処理が順番に実行されます。

## PreToolUseとPostToolUseの使い分け

| 判断基準 | PreToolUse | PostToolUse |
|---------|-----------|------------|
| ツールを止めたい | 使用する | 使用しない |
| 実行後の後処理 | 使用しない | 使用する |
| 入力値のチェック | 使用する | 使用しない |
| 結果のロギング | 使用しない | 使用する |
| 自動フォーマット | 使用しない | 使用する |
| セキュリティチェック | 使用する | 状況による |

## まとめ

このレッスンでは、PreToolUseとPostToolUseフックの詳細な使い方を学びました。

- **PreToolUse**: ツール実行前に呼ばれ、終了コード非0でブロック可能
- **PostToolUse**: ツール実行後に呼ばれ、後処理に使用
- `matcher` でツール名やファイルパターンを指定してフックの適用範囲を制御
- 複数のフックを配列で組み合わせて複合的な自動化が可能
- スクリプトファイルを使うことでメンテナンスしやすいフック設定が実現できる

次のレッスンでは、**Notification**, **Stop**, **SubagentStop** フックを使った通知とカスタムイベント処理を学びます。
