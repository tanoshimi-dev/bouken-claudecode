# AI学習 — マルチコンテンツ対応 開発計画 総合概要

## 背景・目的

**現状:** 「Learn Claude Code」は Claude Code の使い方を学ぶ単一コンテンツの教育アプリ。
**目標:** 複数のAIコーディングツール（Claude Code, Gemini, GitHub Copilot, Codex 等）を学べるマルチコンテンツプラットフォームへ拡張。

**App Name:** AI学習
**パッケージスコープ:** `@learn-ai/*`（`@learn-claude-code/*` から変更）

---

## 対応AIツール（初期）

| Slug | 名前 | アイコン | 状態 |
|------|------|---------|------|
| `claudecode` | Claude Code | 🤖 | コンテンツあり（8モジュール） |
| `gemini` | Gemini Code Assist | 💎 | ディレクトリ作成済・コンテンツ未作成 |
| `githubcopilot` | GitHub Copilot | 🐙 | ディレクトリ作成済・コンテンツ未作成 |
| `codex` | Codex CLI | 🧩 | ディレクトリ作成済・コンテンツ未作成 |

---

## URL構造

パスベースルーティングを採用:

```
/contents                                    # AIツール選択画面
/contents/:contentType/dashboard             # ツール別ダッシュボード
/contents/:contentType/modules               # モジュール一覧
/contents/:contentType/modules/:id           # モジュール詳細
/contents/:contentType/modules/:id/lessons/:id  # レッスン
/contents/:contentType/playground            # ツール別 Playground
```

グローバル画面（ツール選択外）:
```
/dashboard                                   # 全体ダッシュボード
/profile                                     # プロフィール
/profile/settings                            # 設定
```

---

## 開発フェーズ

| Phase | 内容 | 見積 |
|-------|------|------|
| Phase 1 | パッケージリネーム | 0.5日 |
| Phase 2 | DB スキーマ & バックエンド基盤 | 1-2日 |
| Phase 3 | Seed スクリプト更新 | 0.5日 |
| Phase 4 | Web フロントエンド | 2-3日 |
| Phase 5 | Mobile フロントエンド | 1-2日 |
| Phase 6 | ツール別 Playground（将来拡張） | 別途 |

---

## コンテンツディレクトリ構成

```
doc/contents/
  claudecode/
    module-01-introduction/
      README.md
      lesson-1.md, lesson-2.md, lesson-3.md
      quiz.json
    module-02-prompt-engineering/
    ...（module-08まで）
  gemini/
    module-01-*/  （今後追加）
  githubcopilot/
    module-01-*/  （今後追加）
  codex/
    module-01-*/  （今後追加）
```

---

## 主要な変更対象ファイル

### 修正ファイル

| ファイル | 変更内容 |
|---------|---------|
| `sys/backend/api/prisma/schema.prisma` | Module に contentType 追加、複合ユニーク制約 |
| `sys/backend/api/src/app.ts` | `/content-types` ルート登録 |
| `sys/backend/api/src/routes/modules.ts` | contentType クエリパラメータ |
| `sys/backend/api/src/routes/progress.ts` | contentType クエリパラメータ |
| `sys/backend/api/src/services/module.service.ts` | contentType フィルタ・レスポンス |
| `sys/backend/api/src/services/progress.service.ts` | ツール別進捗計算 |
| `sys/packages/shared-types/src/module.ts` | contentType フィールド追加 |
| `sys/packages/shared-types/src/progress.ts` | ContentTypeProgress 追加 |
| `sys/packages/api-client/src/client.ts` | getContentTypes(), contentType パラメータ |
| `sys/scripts/seed-content.ts` | サブディレクトリ走査、複合キー upsert |
| `sys/frontend/user/web/src/components/layout/Sidebar.tsx` | コンテキスト対応ナビ |
| `sys/frontend/user/web/src/components/layout/Header.tsx` | ブランド更新 |
| `sys/frontend/user/web/src/app/layout.tsx` | タイトル・説明更新 |
| `sys/frontend/user/mobile/src/navigation/` | contentType パラメータ追加 |
| `sys/frontend/user/mobile/src/screens/modules/` | ツール選択追加 |
| 全パッケージの `package.json` | スコープ `@learn-ai/*` へ変更 |

### 新規ファイル

| ファイル | 目的 |
|---------|------|
| `sys/packages/shared-types/src/content-type.ts` | コンテンツタイプ定数・型定義 |
| `sys/backend/api/src/routes/content-types.ts` | コンテンツタイプ API |
| `sys/frontend/user/web/src/app/(app)/contents/` | ツール選択画面 |
| `sys/frontend/user/web/src/app/(app)/contents/[contentType]/` | ツール別ルート |
| `sys/frontend/user/web/src/components/content/ContentTypeProvider.tsx` | React Context |
| `sys/frontend/user/mobile/src/screens/modules/ContentSelectScreen.tsx` | Mobile ツール選択 |

---

## 詳細計画

各フェーズの詳細は以下のファイルを参照:

- [Phase 1: パッケージリネーム](./01-phase1-package-rename.md)
- [Phase 2: DB スキーマ & バックエンド基盤](./02-phase2-backend-foundation.md)
- [Phase 3: Seed スクリプト更新](./03-phase3-seed-script.md)
- [Phase 4: Web フロントエンド](./04-phase4-web-frontend.md)
- [Phase 5: Mobile フロントエンド](./05-phase5-mobile-frontend.md)
