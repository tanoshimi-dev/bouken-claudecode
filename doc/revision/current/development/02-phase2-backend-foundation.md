# Phase 2: DB スキーマ & バックエンド基盤

## 目的

Module テーブルに `contentType` フィールドを追加し、バックエンド API でコンテンツタイプ別のフィルタリングを可能にする。

---

## 2.1 Prisma スキーマ変更

**ファイル:** `sys/backend/api/prisma/schema.prisma`

### Module モデル変更

```prisma
model Module {
  id               String  @id @default(cuid())
  contentType      String  @default("claudecode") @map("content_type")
  number           Int
  title            String
  description      String
  estimatedMinutes Int     @map("estimated_minutes")
  isPublished      Boolean @default(false) @map("is_published")

  lessons  Lesson[]
  quizzes  Quiz[]
  progress UserProgress[]

  @@unique([contentType, number])  // number 単体の @unique を置換
  @@index([contentType])
  @@map("modules")
}
```

### マイグレーション SQL

```sql
-- 1. 既存の number ユニーク制約を削除
ALTER TABLE "modules" DROP CONSTRAINT "modules_number_key";

-- 2. content_type カラム追加（デフォルト値で既存データ自動設定）
ALTER TABLE "modules" ADD COLUMN "content_type" TEXT NOT NULL DEFAULT 'claudecode';

-- 3. 複合ユニーク制約追加
CREATE UNIQUE INDEX "modules_content_type_number_key" ON "modules"("content_type", "number");

-- 4. content_type インデックス
CREATE INDEX "modules_content_type_idx" ON "modules"("content_type");
```

### PlaygroundSnippet にも contentType 追加（将来のツール別 Playground 対応）

```prisma
model PlaygroundSnippet {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  title       String
  type        String
  contentType String   @default("claudecode") @map("content_type")
  content     String   @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, type])
  @@index([userId, contentType])
  @@map("playground_snippets")
}
```

---

## 2.2 コンテンツタイプ定数・型定義

**新規ファイル:** `sys/packages/shared-types/src/content-type.ts`

```typescript
export const CONTENT_TYPES = {
  claudecode: {
    slug: 'claudecode',
    name: 'Claude Code',
    nameJa: 'Claude Code',
    icon: '🤖',
    color: '#D97706',
    description: 'Anthropic の AI コーディングアシスタント',
  },
  gemini: {
    slug: 'gemini',
    name: 'Gemini Code Assist',
    nameJa: 'Gemini Code Assist',
    icon: '💎',
    color: '#4285F4',
    description: 'Google の AI コーディングアシスタント',
  },
  githubcopilot: {
    slug: 'githubcopilot',
    name: 'GitHub Copilot',
    nameJa: 'GitHub Copilot',
    icon: '🐙',
    color: '#238636',
    description: 'GitHub の AI ペアプログラミングツール',
  },
  codex: {
    slug: 'codex',
    name: 'Codex CLI',
    nameJa: 'Codex CLI',
    icon: '🧩',
    color: '#10A37F',
    description: 'OpenAI の AI コーディングエージェント',
  },
} as const;

export type ContentTypeSlug = keyof typeof CONTENT_TYPES;

export interface ContentTypeInfo {
  slug: string;
  name: string;
  nameJa: string;
  icon: string;
  color: string;
  description: string;
}

export interface ContentTypeWithCount extends ContentTypeInfo {
  moduleCount: number;
  hasContent: boolean;
}

export function isValidContentType(slug: string): slug is ContentTypeSlug {
  return slug in CONTENT_TYPES;
}
```

**更新:** `sys/packages/shared-types/src/index.ts` にエクスポート追加

---

## 2.3 shared-types 型更新

**ファイル:** `sys/packages/shared-types/src/module.ts`

```typescript
import type { ContentTypeSlug } from './content-type';

export interface Module {
  id: string;
  contentType: ContentTypeSlug;  // 追加
  number: number;
  title: string;
  description: string;
  estimatedMinutes: number;
}

// ModuleWithProgress, ModuleDetail, LessonDetail にも contentType を追加
```

**ファイル:** `sys/packages/shared-types/src/progress.ts`

```typescript
export interface ContentTypeProgress {
  contentType: ContentTypeSlug;
  totalLessons: number;
  completedLessons: number;
  overallPercent: number;
}

export interface OverallProgress {
  totalLessons: number;
  completedLessons: number;
  overallPercent: number;
  byContentType: ContentTypeProgress[];  // 追加
  modules: ModuleProgress[];
}
```

---

## 2.4 Zod スキーマ追加

**新規ファイル:** `sys/packages/zod-schemas/src/content-type.ts`

```typescript
import { z } from 'zod';

export const contentTypeSlugSchema = z.enum([
  'claudecode', 'gemini', 'githubcopilot', 'codex',
]);
```

---

## 2.5 バックエンドサービス変更

### ModuleService

**ファイル:** `sys/backend/api/src/services/module.service.ts`

- `getAllModules(userId, contentType?)` — `contentType` でフィルタリング
- `getModuleDetail(moduleId, userId)` — レスポンスに `contentType` 追加
- `getLessonDetail(moduleId, lessonId, userId)` — `module.contentType` 追加

### ProgressService

**ファイル:** `sys/backend/api/src/services/progress.service.ts`

- `getOverallProgress(userId, contentType?)` — ツール別フィルタ + `byContentType` 集計

---

## 2.6 バックエンドルート変更

### 既存ルート修正

**ファイル:** `sys/backend/api/src/routes/modules.ts`

```typescript
// GET /api/modules?contentType=claudecode
moduleRoutes.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const contentType = c.req.query('contentType');
  if (contentType && !isValidContentType(contentType)) {
    return c.json({ error: 'Invalid content type' }, 400);
  }
  const modules = await moduleService.getAllModules(user.id, contentType);
  return c.json({ data: modules });
});
```

**ファイル:** `sys/backend/api/src/routes/progress.ts`

```typescript
// GET /api/progress?contentType=claudecode
```

### 新規ルート

**新規ファイル:** `sys/backend/api/src/routes/content-types.ts`

```typescript
// GET /api/content-types
// コンテンツタイプ一覧 + モジュール数を返す
```

**登録:** `sys/backend/api/src/app.ts` に `contentTypeRoutes` を追加

---

## 2.7 API Client 変更

**ファイル:** `sys/packages/api-client/src/client.ts`

```typescript
// 新規メソッド
async getContentTypes(): Promise<ApiResponse<ContentTypeWithCount[]>>

// 既存メソッド変更
async getModules(contentType?: string): Promise<ApiResponse<ModuleWithProgress[]>>
async getProgress(contentType?: string): Promise<ApiResponse<OverallProgress>>
```

---

## 2.8 マイグレーション戦略

1. `content_type` に `DEFAULT 'claudecode'` を設定 → 既存データは自動的に Claude Code に分類
2. ユニーク制約変更: `number` 単体 → `(content_type, number)` 複合 → 既存データは全て `claudecode` なので衝突なし
3. `UserProgress` は `Module.id`（CUID）で参照 → スキーマ変更の影響なし

---

## 検証

- `pnpm db:migrate` が成功すること
- `pnpm db:generate` で Prisma Client が再生成されること
- 既存の Claude Code モジュールが `contentType: 'claudecode'` で取得できること
- `GET /api/modules?contentType=claudecode` で既存モジュールのみ返ること
- `GET /api/content-types` でツール一覧が返ること
- `pnpm type-check` が成功すること
