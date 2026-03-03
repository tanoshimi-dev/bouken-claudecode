# Phase 1: パッケージリネーム — 完了レポート

**実施日:** 2026-03-04
**ステータス:** 完了

---

## 概要

パッケージスコープを `@learn-claude-code/*` から `@learn-ai/*` へ一括変更。マルチコンテンツ対応のブランディングに合わせたリネーム。

---

## 変更内容

### パッケージ名変更

| 変更前 | 変更後 |
|--------|--------|
| `learn-claude-code`（root） | `learn-ai` |
| `@learn-claude-code/shared-types` | `@learn-ai/shared-types` |
| `@learn-claude-code/api-client` | `@learn-ai/api-client` |
| `@learn-claude-code/zod-schemas` | `@learn-ai/zod-schemas` |

### 修正ファイル数

- **package.json:** 7ファイル（root, shared-types, api-client, zod-schemas, api, web, mobile）
- **ソースファイル:** 30ファイル（`.ts` / `.tsx` / `.json` の import 文を一括置換）
- **pnpm-lock.yaml:** `pnpm install` により自動再生成

### 修正対象ソースファイル一覧

**backend/api:**
- `src/routes/playground.ts`
- `src/services/achievement.service.ts`
- `src/services/playground.service.ts`

**packages/api-client:**
- `src/client.ts`

**frontend/user/web:**
- `src/app/(app)/dashboard/DashboardContent.tsx`
- `src/app/(app)/modules/ModulesContent.tsx`
- `src/app/(app)/modules/[moduleId]/ModuleDetailContent.tsx`
- `src/app/(app)/modules/[moduleId]/lessons/[lessonId]/LessonContent.tsx`
- `src/app/(app)/profile/ProfileContent.tsx`
- `src/app/(app)/quiz/[quizId]/QuizContent.tsx`
- `src/app/(app)/quiz/[quizId]/results/QuizResultsContent.tsx`
- `src/components/achievements/AchievementGallery.tsx`
- `src/components/achievements/AchievementToast.tsx`
- `src/components/achievements/BadgeCard.tsx`
- `src/components/auth/ProviderManager.tsx`
- `src/components/playground/SnippetManager.tsx`
- `src/lib/api.ts`
- `src/store/authSlice.ts`

**frontend/user/mobile:**
- `src/config/api.ts`
- `src/screens/auth/LoginScreen.tsx`
- `src/screens/home/HomeScreen.tsx`
- `src/screens/modules/LessonScreen.tsx`
- `src/screens/modules/ModuleDetailScreen.tsx`
- `src/screens/modules/ModuleListScreen.tsx`
- `src/screens/profile/ProfileScreen.tsx`
- `src/screens/profile/SettingsScreen.tsx`
- `src/screens/quiz/QuizScreen.tsx`
- `src/services/auth.service.ts`
- `src/store/authSlice.ts`
- `tsconfig.json`

---

## 検証結果

### pnpm install
- 成功。ロックファイル再生成済み。旧名 `@learn-claude-code/` の参照: 0件

### type-check 結果

| ワークスペース | 結果 |
|---------------|------|
| `@learn-ai/shared-types` | pass |
| `@learn-ai/zod-schemas` | pass |
| `@learn-ai/api-client` | pass |
| `web` | pass |
| `mobile` | pass |
| `api` | fail（既知の既存エラー） |

### api type-check の既存エラーについて

`api` ワークスペースの型エラーはリネームとは無関係の既存問題:
- `src/__tests__/e2e.test.ts` — `body` / `data` の型が `unknown` として扱われる
- `src/routes/*.ts` — Hono の `c.get('user')` のオーバーロード型不一致

これらは Phase 1 以前から存在するエラーであり、今回の変更で発生したものではない。

---

## 次のステップ

→ [Phase 2: DB スキーマ & バックエンド基盤](../development/02-phase2-backend-foundation.md)
