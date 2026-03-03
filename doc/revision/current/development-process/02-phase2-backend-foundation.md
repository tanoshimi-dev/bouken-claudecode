# Phase 2: DB スキーマ & バックエンド基盤 — 完了レポート

**実施日:** 2026-03-04
**ステータス:** 完了

---

## 概要

Module テーブルに `contentType` フィールドを追加し、バックエンド API でコンテンツタイプ別のフィルタリングを実現。共有型定義・Zod スキーマ・API クライアントも同時に更新。

---

## 変更内容

### 新規ファイル

| ファイル | 目的 |
|---------|------|
| `sys/packages/shared-types/src/content-type.ts` | CONTENT_TYPES 定数、ContentTypeSlug / ContentTypeInfo / ContentTypeWithCount 型、isValidContentType() |
| `sys/packages/zod-schemas/src/content-type.ts` | contentTypeSlugSchema バリデーション |
| `sys/backend/api/src/routes/content-types.ts` | `GET /api/content-types` — ツール一覧 + モジュール数 |
| `sys/backend/api/prisma/migrations/20260304120000_add_content_type/migration.sql` | DB マイグレーション |

### 修正ファイル

| ファイル | 変更内容 |
|---------|---------|
| `sys/backend/api/prisma/schema.prisma` | Module: `contentType` 追加、`@unique number` → `@@unique([contentType, number])`、`@@index([contentType])`。PlaygroundSnippet: `contentType` 追加、`@@index([userId, contentType])` |
| `sys/packages/shared-types/src/module.ts` | Module に `contentType: ContentTypeSlug` 追加。LessonDetail の `module` に `contentType` 追加 |
| `sys/packages/shared-types/src/progress.ts` | `ContentTypeProgress` インターフェース追加。`ModuleProgress` に `contentType` 追加。`OverallProgress` に `byContentType` 追加 |
| `sys/packages/shared-types/src/index.ts` | `ContentTypeSlug`, `ContentTypeInfo`, `ContentTypeWithCount`, `ContentTypeProgress`, `CONTENT_TYPES`, `isValidContentType` エクスポート追加 |
| `sys/packages/zod-schemas/src/index.ts` | `contentTypeSlugSchema` エクスポート追加 |
| `sys/backend/api/src/services/module.service.ts` | `getAllModules(userId, contentType?)` — contentType フィルタ追加。`getModuleDetail` / `getLessonDetail` — レスポンスに `contentType` 追加 |
| `sys/backend/api/src/services/progress.service.ts` | `getOverallProgress(userId, contentType?)` — contentType フィルタ + `byContentType` 集計追加 |
| `sys/backend/api/src/routes/modules.ts` | `GET /api/modules?contentType=` クエリパラメータ対応 |
| `sys/backend/api/src/routes/progress.ts` | `GET /api/progress?contentType=` クエリパラメータ対応 |
| `sys/backend/api/src/app.ts` | `/content-types` ルート登録 |
| `sys/packages/api-client/src/client.ts` | `getContentTypes()` 新規メソッド。`getModules(contentType?)` / `getProgress(contentType?)` パラメータ追加 |

---

## DB マイグレーション詳細

**マイグレーション名:** `20260304120000_add_content_type`

```sql
-- modules テーブル
ALTER TABLE "modules" ADD COLUMN "content_type" TEXT NOT NULL DEFAULT 'claudecode';
DROP INDEX "modules_number_key";
CREATE UNIQUE INDEX "modules_content_type_number_key" ON "modules"("content_type", "number");
CREATE INDEX "modules_content_type_idx" ON "modules"("content_type");

-- playground_snippets テーブル
ALTER TABLE "playground_snippets" ADD COLUMN "content_type" TEXT NOT NULL DEFAULT 'claudecode';
CREATE INDEX "playground_snippets_user_id_content_type_idx" ON "playground_snippets"("user_id", "content_type");
```

既存データは `DEFAULT 'claudecode'` により自動的に Claude Code コンテンツとして分類。

---

## API エンドポイント変更

| メソッド | パス | 変更 |
|---------|------|------|
| GET | `/api/content-types` | **新規** — ツール一覧 + モジュール数を返す（認証不要） |
| GET | `/api/modules` | `?contentType=` クエリパラメータ追加（省略時は全件） |
| GET | `/api/progress` | `?contentType=` クエリパラメータ追加（省略時は全件） |

---

## 検証結果

### DB マイグレーション
- `prisma migrate deploy` 成功
- `prisma generate` 成功

### type-check 結果

| ワークスペース | 結果 |
|---------------|------|
| `@learn-ai/shared-types` | pass |
| `@learn-ai/zod-schemas` | pass |
| `@learn-ai/api-client` | pass |
| `web` | pass |
| `mobile` | pass |
| `api` | fail（既存エラーのみ — Hono c.get('user') 型問題 + e2e.test.ts） |

Phase 2 で新規に導入された型エラーは 0 件。

---

## 次のステップ

→ [Phase 3: Seed スクリプト更新](../development/03-phase3-seed-script.md)
