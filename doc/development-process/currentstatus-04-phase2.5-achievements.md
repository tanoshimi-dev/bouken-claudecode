# Phase 2.5: Achievement System — 進捗レポート

**日付**: 2026-03-02
**ステータス**: 完了（100%）
**コミット**: プッシュ済み

---

## 概要

Phase 2.5 では、学習体験をゲーミフィケーションするバッジ/アチーブメントシステムを実装した。13種類のバッジ定義（レッスン・クイズ・ストリーク・スペシャルの4カテゴリ）、自動付与ロジック、アチーブメント API エンドポイント、フロントエンドのバッジギャラリーとトースト通知を追加。既存の `UserAchievement` テーブル（Phase 1 で作成済み）を活用し、Prisma マイグレーション不要。

---

## 完了した作業

### 1. 共有型定義（100%）

| ファイル | 変更内容 |
|---------|---------|
| `sys/packages/shared-types/src/achievement.ts` | 新規: `Badge`, `UserAchievement`, `AchievementProgress`, `NewAchievement` |
| `sys/packages/shared-types/src/index.ts` | achievement 型エクスポート追加 |

### 2. AchievementService（100%）

`sys/backend/api/src/services/achievement.service.ts` — 新規作成

**バッジ定義（13件ハードコード）:**

| slug | name | category | 条件 |
|------|------|----------|------|
| `first-lesson` | はじめの一歩 | lesson | 1レッスン完了 |
| `five-lessons` | 学習の習慣 | lesson | 5レッスン完了 |
| `ten-lessons` | 知識の探求者 | lesson | 10レッスン完了 |
| `all-lessons` | マスター学習者 | lesson | 全レッスン完了 |
| `first-module` | モジュール制覇 | lesson | 1モジュール完了 |
| `three-modules` | 中級者 | lesson | 3モジュール完了 |
| `first-quiz` | クイズ挑戦者 | quiz | 1クイズ回答 |
| `perfect-score` | パーフェクト | quiz | クイズ満点 |
| `five-quizzes` | クイズマスター | quiz | 5クイズ回答 |
| `streak-3` | 3日連続 | streak | 3日連続学習 |
| `streak-7` | 一週間の努力 | streak | 7日連続学習 |
| `streak-30` | 継続の達人 | streak | 30日連続学習 |
| `first-snippet` | コード保存 | special | 1スニペット保存 |

**メソッド:**

| メソッド | 説明 |
|---------|------|
| `getUserAchievements(userId)` | 獲得済みバッジ一覧（earnedAt 降順） |
| `getAchievementProgress(userId)` | 全バッジの獲得状況 + 未獲得バッジの進捗 |
| `checkAndAwardBadges(userId)` | 全条件チェック → 新規バッジ付与 → `NewAchievement[]` 返却 |

### 3. 既存サービスへのバッジチェック統合（100%）

| ファイル | 変更内容 |
|---------|---------|
| `sys/backend/api/src/services/progress.service.ts` | `completeLesson()` 終了後に `checkAndAwardBadges()` を呼び出し、`newAchievements` を返却 |
| `sys/backend/api/src/services/quiz.service.ts` | `submitQuiz()` 終了後に `checkAndAwardBadges()` を呼び出し、`newAchievements` を返却 |
| `sys/backend/api/src/services/playground.service.ts` | `createSnippet()` 終了後に `checkAndAwardBadges()` を呼び出し、`newAchievements` を返却 |

### 4. API ルート（100%）

`sys/backend/api/src/routes/achievements.ts` — 新規作成

| ルート | メソッド | 認証 | 説明 |
|--------|---------|------|------|
| `/achievements` | GET | 必須 | 獲得済みバッジ一覧 |
| `/achievements/progress` | GET | 必須 | 全バッジ + 進捗情報 |

`sys/backend/api/src/app.ts` — `achievementRoutes` マウント追加

### 5. API クライアント更新（100%）

`sys/packages/api-client/src/client.ts` に2メソッド追加:

| メソッド | 説明 |
|---------|------|
| `getAchievements()` | GET `/api/achievements` |
| `getAchievementProgress()` | GET `/api/achievements/progress` |

### 6. フロントエンド — コンポーネント（100%）

**BadgeCard** (`sys/frontend/user/web/src/components/achievements/BadgeCard.tsx`):
- バッジアイコン（絵文字、大）+ 名前 + 説明
- 獲得済み: フルカラー、獲得日表示
- 未獲得: グレースケール + opacity-50 + プログレスバー（該当する場合）

**AchievementGallery** (`sys/frontend/user/web/src/components/achievements/AchievementGallery.tsx`):
- `getAchievementProgress()` を `useApi` で取得
- カテゴリタブ: すべて | レッスン | クイズ | ストリーク | スペシャル
- バッジグリッド（2列〜4列レスポンシブ）
- 獲得数カウント: "X / Y バッジ獲得"

**AchievementToast** (`sys/frontend/user/web/src/components/achievements/AchievementToast.tsx`):
- `showAchievementToasts(achievements)` — `sonner` トーストで新規バッジ通知
- バッジアイコン + 名前 + "バッジを獲得しました！"

**Toaster 追加** (`sys/frontend/user/web/src/app/(app)/layout.tsx`):
- `<Toaster position="top-right" richColors />` を追加（sonner の Toaster コンポーネントが未設置だったため）

### 7. フロントエンド — 既存ページ統合（100%）

| ファイル | 変更内容 |
|---------|---------|
| `ProfileContent.tsx` | AchievementGallery セクションを学習統計の下に追加 |
| `DashboardContent.tsx` | "最近獲得したバッジ" セクション追加（直近3件表示 + プロフィールへのリンク） |
| `LessonContent.tsx` | `handleComplete()` でレスポンスの `newAchievements` を取得しトースト表示 |
| `QuizContent.tsx` | `handleSubmit()` でレスポンスの `newAchievements` を取得しトースト表示 |

### 8. E2E テスト（100%）

`sys/backend/api/src/__tests__/e2e.test.ts` に `describe('E2E: Achievements')` を追加:

| # | テスト | 期待値 |
|---|--------|--------|
| 1 | `GET /api/achievements`（認証あり） | 200、空配列（初期状態） |
| 2 | `GET /api/achievements/progress`（認証あり） | 200、全バッジ（13件以上）+ 進捗情報 |
| 3 | `POST /api/progress/lessons/:lessonId` | 200、`newAchievements` に `first-lesson` バッジ含む |
| 4 | `GET /api/achievements`（レッスン完了後） | 200、獲得済みバッジ1件以上 |
| 5 | `GET /api/achievements`（認証なし） | 401 |
| 6 | `GET /api/achievements/progress`（認証なし） | 401 |

**全28テスト合格**（既存22件 + 新規6件）。

---

## 設計判断

1. **バッジはハードコード** — バッジ定義はサービス内の定数。DB テーブル不要、マイグレーション不要
2. **冪等な付与** — `checkAndAwardBadges` は何度呼んでも安全。`skipDuplicates` + 既獲得チェックで二重付与を防止
3. **全条件一括チェック** — バッジ種別ごとの個別チェックではなく、1回の呼び出しで全条件を評価
4. **レスポンスにインライン返却** — レッスン完了/クイズ送信/スニペット保存のレスポンスに `newAchievements[]` を含めることで、フロントエンドが即座にトースト表示可能
5. **トースト（モーダルではない）** — `sonner` トーストで軽量な通知。既存の UX パターンに合致
6. **絵文字アイコン** — SVG アセット不要。シンプルかつクロスプラットフォーム対応
7. **Prisma マイグレーション不要** — `UserAchievement` テーブルは Phase 1 で作成済み

---

## ファイル変更サマリー（17ファイル）

### 新規作成（5ファイル）

| ファイル | 概要 |
|---------|------|
| `sys/packages/shared-types/src/achievement.ts` | Achievement 共有型定義 |
| `sys/backend/api/src/services/achievement.service.ts` | AchievementService（バッジ定義 + CRUD + 自動付与） |
| `sys/backend/api/src/routes/achievements.ts` | Achievement API ルート（2エンドポイント） |
| `sys/frontend/user/web/src/components/achievements/BadgeCard.tsx` | バッジカードコンポーネント |
| `sys/frontend/user/web/src/components/achievements/AchievementGallery.tsx` | バッジギャラリー（カテゴリタブ + グリッド） |
| `sys/frontend/user/web/src/components/achievements/AchievementToast.tsx` | バッジ獲得トースト通知ヘルパー |

### 修正（11ファイル）

| ファイル | 変更内容 |
|---------|---------|
| `sys/packages/shared-types/src/index.ts` | achievement 型エクスポート追加 |
| `sys/packages/api-client/src/client.ts` | Achievement API メソッド2件追加 |
| `sys/backend/api/src/app.ts` | `achievementRoutes` マウント追加 |
| `sys/backend/api/src/services/progress.service.ts` | `completeLesson()` にバッジチェック統合 |
| `sys/backend/api/src/services/quiz.service.ts` | `submitQuiz()` にバッジチェック統合 |
| `sys/backend/api/src/services/playground.service.ts` | `createSnippet()` にバッジチェック統合 |
| `sys/frontend/user/web/src/app/(app)/layout.tsx` | `<Toaster>` 追加 |
| `sys/frontend/user/web/src/app/(app)/profile/ProfileContent.tsx` | AchievementGallery セクション追加 |
| `sys/frontend/user/web/src/app/(app)/dashboard/DashboardContent.tsx` | 最近獲得バッジセクション追加 |
| `sys/frontend/user/web/src/app/(app)/modules/[moduleId]/lessons/[lessonId]/LessonContent.tsx` | バッジ獲得トースト追加 |
| `sys/frontend/user/web/src/app/(app)/quiz/[quizId]/QuizContent.tsx` | バッジ獲得トースト追加 |
| `sys/backend/api/src/__tests__/e2e.test.ts` | Achievement E2E テスト6件追加 |

---

## 検証手順

1. `pnpm --filter api test` — 全28件テスト合格 ✅
2. `pnpm turbo dev` → レッスン完了 → `newAchievements` トースト表示
3. `/profile` → Achievement Gallery（獲得/未獲得バッジ + 進捗バー）
4. ダッシュボード → 最近獲得したバッジ表示
5. クイズ満点 → `perfect-score` バッジトースト表示

---

## 参考資料

- 設計仕様書: `doc/development/02-phase2-core.md`（セクション 2.5）
- Phase 1 進捗レポート: `doc/development-process/currentstatus-01-phase1-mvp.md`
- Phase 2.1 進捗レポート: `doc/development-process/currentstatus-02-phase2.1-oauth-linking.md`
- Phase 2.4 進捗レポート: `doc/development-process/currentstatus-03-phase2.4-playground.md`
