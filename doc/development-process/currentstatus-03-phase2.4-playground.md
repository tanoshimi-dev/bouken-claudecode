# Phase 2.4: Code Playground — 進捗レポート

**日付**: 2026-03-02
**ステータス**: 完了（100%）
**コミット**: 未コミット（Phase 2.4 実装完了）

---

## 概要

Phase 2.4 では、Claude Code の操作を安全に試せるインタラクティブな Code Playground を実装した。3つのツール（ターミナルシミュレーター、CLAUDE.md エディタ、Config Builder）をタブ切り替えの単一ページ `/playground` として提供。バックエンドではスニペット保存/読み込み API を追加。23ファイルを変更・作成。コスト: ほぼゼロ（全てクライアントサイド、外部 API 呼び出しなし）。

---

## 完了した作業

### 1. Monaco Editor 導入（100%）

`@monaco-editor/react ^4.7.0` をフロントエンドに追加。`React.lazy()` + `Suspense` で遅延読み込みし、SSR エラーを回避しつつ初期バンドルサイズへの影響を最小化。

### 2. Prisma スキーマ + マイグレーション（100%）

| ファイル | 変更内容 |
|---------|---------|
| `sys/backend/api/prisma/schema.prisma` | `PlaygroundSnippet` モデル追加、`User` に `playgroundSnippets` リレーション追加 |
| `prisma/migrations/20260302072156_add_playground_snippets/` | マイグレーション自動生成・適用済み |

**PlaygroundSnippet モデル**:
- `id`, `userId`, `title`, `type`（terminal / claude_md / hook_config）, `content`（Text）, `createdAt`, `updatedAt`
- `@@index([userId, type])` でクエリ最適化
- `onDelete: Cascade` で User 削除時に自動クリーンアップ

### 3. 共有パッケージ更新（100%）

| ファイル | 変更内容 |
|---------|---------|
| `sys/packages/shared-types/src/playground.ts` | 新規: `SnippetType`, `PlaygroundSnippet`, `CreateSnippetInput`, `PlaygroundTemplate` |
| `sys/packages/shared-types/src/index.ts` | playground 型エクスポート追加 |
| `sys/packages/zod-schemas/src/playground.ts` | 新規: `createSnippetSchema`（title 1-100文字, type enum, content 1-50000文字） |
| `sys/packages/zod-schemas/src/index.ts` | `createSnippetSchema` エクスポート追加 |

### 4. バックエンドサービス + ルート（100%）

**PlaygroundService** (`sys/backend/api/src/services/playground.service.ts`):

| メソッド | 説明 |
|---------|------|
| `getSnippets(userId, type?)` | ユーザーのスニペット一覧。`updatedAt` 降順。type フィルタ対応 |
| `createSnippet(userId, data)` | スニペット作成。ユーザーあたり最大50件制限 |
| `deleteSnippet(userId, snippetId)` | 所有権チェック + 削除 |
| `getTemplates()` | ハードコード済み CLAUDE.md テンプレート3件を返却 |

**テンプレート**（3件ハードコード、DB不要）:
1. **個人用** — 個人開発向けの基本テンプレート
2. **プロジェクト用** — チーム開発プロジェクト向けの詳細テンプレート
3. **チーム用** — チーム全員が参照する標準ルール集

**ルート** (`sys/backend/api/src/routes/playground.ts`):

| ルート | メソッド | 認証 | 説明 |
|--------|---------|------|------|
| `/playground/templates` | GET | 必須 | テンプレート一覧取得 |
| `/playground/snippets` | GET | 必須 | ユーザーのスニペット一覧（?type= フィルタ対応） |
| `/playground/snippets` | POST | 必須 | スニペット作成（Zod バリデーション付き） |
| `/playground/snippets/:id` | DELETE | 必須 | スニペット削除（所有権チェック付き） |

### 5. API クライアント更新（100%）

`sys/packages/api-client/src/client.ts` に4メソッド追加:

| メソッド | 説明 |
|---------|------|
| `getSnippets(type?)` | GET `/api/playground/snippets` |
| `createSnippet(body)` | POST `/api/playground/snippets` |
| `deleteSnippet(id)` | DELETE `/api/playground/snippets/:id` |
| `getPlaygroundTemplates()` | GET `/api/playground/templates` |

### 6. フロントエンド — 共有コンポーネント（100%）

**MonacoEditorWrapper** (`MonacoEditorWrapper.tsx`):
- `React.lazy()` で遅延読み込み、ロード中はスケルトン表示
- Props: value, onChange, language（markdown/json/yaml/shell）, readOnly, height
- テーマ: vs-dark、ミニマップ無効、ワードラップ有効

**SnippetManager** (`SnippetManager.tsx`):
- 保存ボタン → タイトル入力 → `apiClient.createSnippet()`
- 保存済み一覧 → クリックで読み込み → `apiClient.getSnippets(type)`
- 削除ボタン → `apiClient.deleteSnippet(id)`
- `sonner` トーストでフィードバック表示

### 7. フロントエンド — ターミナルシミュレーター（100%）

**TerminalCommandProcessor** (`TerminalCommandProcessor.ts`):
- `processCommand(input)` → `{ lines: TerminalLine[], shouldClear: boolean }`
- `getCompletions(partial)` → Tab 補完候補
- 対応コマンド（20以上）:
  - `claude`（--version, --help, ワンショットモード）
  - スラッシュコマンド: `/help`, `/model`, `/clear`, `/compact`, `/config`, `/cost`, `/doctor`, `/init`, `/memory`, `/permissions`, `/review`, `/status`
  - シェルコマンド: `help`, `ls`, `cat <file>`, `pwd`, `echo`, `clear`
- 日本語のモックレスポンス + レッスンコンテンツへのヒント付き

**TerminalSimulator** (`TerminalSimulator.tsx`):
- 左パネル: 静的レッスンテキスト（MarkdownRenderer で表示）
- 右パネル: カスタムターミナル UI
  - スクロール可能な出力エリア（色分け: input=緑, output=灰, error=赤, info=青, success=緑）
  - `$` プロンプト付き入力行
  - Enter → コマンド実行、Tab → 自動補完、↑↓ → 履歴ナビゲーション
  - 自動スクロール、macOS 風ウィンドウヘッダー
  - ダークターミナルスタイリング（`bg-[#0d1117]`、monospace フォント）

### 8. フロントエンド — CLAUDE.md エディタ（100%）

**ClaudeMdTemplates** (`ClaudeMdTemplates.ts`):
- 3テンプレート: 個人用、プロジェクト用、チーム用
- 各テンプレートにリアルな CLAUDE.md コンテンツ（日本語）

**ClaudeMdValidator** (`ClaudeMdValidator.ts`):
- `validateClaudeMd(content)` → `{ isValid, sections, warnings }`
- 推奨セクションチェック: Memory, Preferences, Project Rules
- タイトル見出しの有無チェック
- 内容が短すぎる場合の警告

**ClaudeMdEditor** (`ClaudeMdEditor.tsx`):
- テンプレート選択バー（3ボタン）
- 分割ビュー: MonacoEditorWrapper（markdown モード、左）+ MarkdownRenderer（プレビュー、右）
- 検証ステータスバー（緑チェック / 黄色警告）
- 警告メッセージの詳細表示
- SnippetManager で保存/読み込み

### 9. フロントエンド — Config Builder（100%）

**ConfigBuilderTypes** (`ConfigBuilderTypes.ts`):
- `HookEvent` 型: PreToolUse, PostToolUse, Notification, Stop, SubagentStop
- `HookDefinition`: event, command, matcher（tool_name?, file_pattern?）
- `HOOK_EVENTS` 配列（日本語ラベル + 説明付き）
- `TOOL_NAMES`: Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, Agent, NotebookEdit
- `generateHooksJson(hooks)` → `.claude/settings.json` 形式の JSON 文字列生成

**ConfigBuilder** (`ConfigBuilder.tsx`):
- 動的フォーム: Hook エントリのリスト（追加/削除可能）
- 各エントリ: イベントドロップダウン + コマンド入力 + オプショナルマッチャー
- PreToolUse/PostToolUse 時のみツール名・ファイルパターンのマッチャー表示
- 出力パネル: MonacoEditorWrapper（json モード、読み取り専用）で生成済み設定を表示
- クリップボードコピーボタン（`navigator.clipboard.writeText()`）
- スニペット読み込み時の JSON パース + Hook 復元
- SnippetManager で保存/読み込み

### 10. フロントエンド — Playground ページ + ナビゲーション（100%）

**PlaygroundContent** (`PlaygroundContent.tsx`):
- タブナビゲーション: ターミナル | CLAUDE.md エディタ | Config Builder
- アクティブタブは `border-primary` の下線インジケーター
- タブ切り替えでコンポーネントを条件レンダリング

**page.tsx**: サーバーコンポーネントラッパー（既存パターンに準拠）

**Sidebar.tsx**: 「Playground」ナビアイテムを追加（モジュールとプロフィールの間）

### 11. E2E テスト（100%）

`sys/backend/api/src/__tests__/e2e.test.ts` に `describe('E2E: Playground')` を追加:

| # | テスト | 期待値 |
|---|--------|--------|
| 1 | `GET /api/playground/templates` | 200、テンプレート配列（3件以上） |
| 2 | `POST /api/playground/snippets` | 201、スニペット作成成功 |
| 3 | `GET /api/playground/snippets` | 200、ユーザーのスニペット一覧 |
| 4 | `GET /api/playground/snippets?type=claude_md` | 200、type フィルタ済み結果 |
| 5 | `DELETE /api/playground/snippets/:id` | 200、削除成功 |
| 6 | `GET /api/playground/snippets`（認証なし） | 401 |

**全22テスト合格**（既存16件 + 新規6件）。

---

## 設計判断

1. **タブベース単一ページ** — 3ツールを `/playground` 配下のタブで管理。別ルートに分割せず UX をシンプルに
2. **Monaco 遅延読み込み** — `React.lazy()` + `Suspense` で SSR エラー回避 + 初期バンドル削減
3. **ターミナルは Monaco 不使用** — カスタム div + input フィールドで本物のターミナル感を再現
4. **テンプレートはハードコード** — CLAUDE.md テンプレート3件は DB 不要（静的データ）
5. **スニペット制限** — ユーザーあたり50件、コンテンツ最大50KB（濫用防止）
6. **JSON 出力** — Claude Code の設定ファイルは JSON（`.claude/settings.json`）なので、Config Builder も JSON 出力
7. **MarkdownRenderer 再利用** — CLAUDE.md プレビューは既存の `@/components/content/MarkdownRenderer` を活用

---

## ファイル変更サマリー（23ファイル）

### 新規作成（16ファイル）

| ファイル | 概要 |
|---------|------|
| `sys/packages/shared-types/src/playground.ts` | Playground 共有型定義 |
| `sys/packages/zod-schemas/src/playground.ts` | スニペット作成バリデーションスキーマ |
| `sys/backend/api/src/services/playground.service.ts` | Playground サービス（CRUD + テンプレート） |
| `sys/backend/api/src/routes/playground.ts` | Playground API ルート（4エンドポイント） |
| `sys/frontend/user/web/src/components/playground/MonacoEditorWrapper.tsx` | Monaco エディタラッパー（遅延読み込み） |
| `sys/frontend/user/web/src/components/playground/SnippetManager.tsx` | スニペット保存/読み込み/削除 UI |
| `sys/frontend/user/web/src/components/playground/TerminalCommandProcessor.ts` | コマンドレジストリ + Tab 補完 |
| `sys/frontend/user/web/src/components/playground/TerminalSimulator.tsx` | ターミナルシミュレーター UI |
| `sys/frontend/user/web/src/components/playground/ClaudeMdTemplates.ts` | CLAUDE.md テンプレート3件 |
| `sys/frontend/user/web/src/components/playground/ClaudeMdValidator.ts` | CLAUDE.md バリデーター |
| `sys/frontend/user/web/src/components/playground/ClaudeMdEditor.tsx` | CLAUDE.md エディタ（分割ビュー + 検証） |
| `sys/frontend/user/web/src/components/playground/ConfigBuilderTypes.ts` | Hook 型定義 + JSON 生成 |
| `sys/frontend/user/web/src/components/playground/ConfigBuilder.tsx` | Config Builder（動的フォーム + JSON 出力） |
| `sys/frontend/user/web/src/app/(app)/playground/page.tsx` | Playground ページ（サーバーコンポーネント） |
| `sys/frontend/user/web/src/app/(app)/playground/PlaygroundContent.tsx` | タブナビゲーション + コンテンツ切り替え |
| `sys/backend/api/prisma/migrations/.../migration.sql` | PlaygroundSnippet テーブル作成 |

### 修正（7ファイル）

| ファイル | 変更内容 |
|---------|---------|
| `sys/backend/api/prisma/schema.prisma` | `PlaygroundSnippet` モデル + `User` リレーション追加 |
| `sys/packages/shared-types/src/index.ts` | playground 型エクスポート追加 |
| `sys/packages/zod-schemas/src/index.ts` | `createSnippetSchema` エクスポート追加 |
| `sys/packages/api-client/src/client.ts` | Playground API メソッド4件追加 |
| `sys/backend/api/src/app.ts` | `playgroundRoutes` マウント追加 |
| `sys/frontend/user/web/src/components/layout/Sidebar.tsx` | 「Playground」ナビアイテム追加 |
| `sys/backend/api/src/__tests__/e2e.test.ts` | Playground E2E テスト6件追加 |

---

## 検証手順

1. `pnpm db:migrate --name add_playground_snippets` — マイグレーション実行済み ✅
2. `pnpm --filter api test` — 全22件テスト合格 ✅
3. `pnpm turbo dev` → `/playground` にアクセス
4. **ターミナルタブ**: `claude`, `help`, `/help`, `/model` 入力 → モックレスポンス表示; Tab 補完 + ↑↓ 履歴動作
5. **CLAUDE.md タブ**: テンプレート選択 → エディタで編集 → ライブプレビュー + 検証ステータス表示
6. **Config Builder タブ**: Hook 追加 → JSON 生成 → クリップボードコピー
7. **全タブ**: スニペット保存/読み込み/削除

---

## 参考資料

- 設計仕様書: `doc/development/02-phase2-core.md`（セクション 2.4）
- Phase 1 進捗レポート: `doc/development-process/currentstatus-01-phase1-mvp.md`
- Phase 2.1 進捗レポート: `doc/development-process/currentstatus-02-phase2.1-oauth-linking.md`
