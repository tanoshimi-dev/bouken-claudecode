# Phase 4: Web フロントエンド — 完了レポート

**実施日:** 2026-03-04
**ステータス:** 完了

---

## 概要

Web フロントエンドをマルチコンテンツ対応に更新。ツール選択画面を追加し、`/contents/[contentType]/` 配下にツール別のモジュール・ダッシュボード・Playground ルートを構築。ブランディングを「Learn Claude Code」→「AI学習」に変更。

---

## 変更内容

### 新規ファイル

| ファイル | 目的 |
|---------|------|
| `components/content/ContentTypeProvider.tsx` | React Context — `useContentType()` フック提供 |
| `contents/page.tsx` | ツール選択画面ページ |
| `contents/ContentsContent.tsx` | ツール選択 UI（カード形式、コンテンツなしは「準備中」表示） |
| `contents/[contentType]/layout.tsx` | contentType バリデーション + `ContentTypeProvider` ラップ |
| `contents/[contentType]/modules/page.tsx` | ツール別モジュール一覧ページ |
| `contents/[contentType]/modules/ModulesContent.tsx` | ツール別モジュール一覧 UI |
| `contents/[contentType]/modules/[moduleId]/page.tsx` | ツール別モジュール詳細ページ |
| `contents/[contentType]/modules/[moduleId]/ModuleDetailContent.tsx` | ツール別モジュール詳細 UI |
| `contents/[contentType]/modules/[moduleId]/lessons/[lessonId]/page.tsx` | ツール別レッスンページ |
| `contents/[contentType]/modules/[moduleId]/lessons/[lessonId]/LessonContent.tsx` | ツール別レッスン UI |
| `contents/[contentType]/dashboard/page.tsx` | ツール別ダッシュボードページ |
| `contents/[contentType]/dashboard/DashboardContent.tsx` | ツール別ダッシュボード UI |
| `contents/[contentType]/playground/page.tsx` | ツール別 Playground ページ |
| `contents/[contentType]/playground/PlaygroundContent.tsx` | claudecode: 既存 Playground / 他: 「準備中」 |

### 修正ファイル

| ファイル | 変更内容 |
|---------|---------|
| `components/layout/Sidebar.tsx` | コンテキスト対応ナビゲーション（`/contents/:type/` 内: ツール別メニュー、外: グローバルメニュー） |
| `components/layout/Header.tsx` | 「Learn Claude Code」→「AI学習」、リンク先を `/contents` に変更 |
| `app/layout.tsx` | メタデータ: title「AI学習」、description 更新 |
| `app/page.tsx` | ランディングページブランディング更新 |
| `app/(app)/dashboard/DashboardContent.tsx` | ツール別進捗サマリー（`byContentType` カード）追加、ツール選択リンク追加 |
| `app/(app)/modules/page.tsx` | `/contents` へリダイレクト |
| `app/(app)/playground/page.tsx` | `/contents` へリダイレクト |
| `app/(app)/quiz/[quizId]/results/QuizResultsContent.tsx` | `/modules` リンクを `/contents` に更新 |

---

## ルート構造

```
/contents                                    ツール選択画面
/contents/[contentType]/dashboard            ツール別ダッシュボード
/contents/[contentType]/modules              ツール別モジュール一覧
/contents/[contentType]/modules/[moduleId]   モジュール詳細
/contents/[contentType]/modules/[moduleId]/lessons/[lessonId]   レッスン
/contents/[contentType]/playground           ツール別 Playground
/dashboard                                   グローバルダッシュボード
/modules                                     → /contents リダイレクト
/playground                                  → /contents リダイレクト
```

---

## Sidebar ナビゲーション

### `/contents/:contentType/*` 内

- ← ツール選択（`/contents`）
- ツールアイコン + 名前表示
- ダッシュボード（`/contents/:type/dashboard`）
- モジュール（`/contents/:type/modules`）
- Playground（`/contents/:type/playground`）

### グローバル（`/contents` 外）

- AIツール選択（`/contents`）
- ダッシュボード（`/dashboard`）
- プロフィール（`/profile`）
- 設定（`/profile/settings`）

---

## E2E テスト修正

| ファイル | 変更内容 |
|---------|---------|
| `sys/backend/api/src/__tests__/e2e.test.ts` | `beforeAll` のモジュール取得クエリを修正 — `findFirst` にクイズ・レッスン存在フィルタ (`quizzes: { some: {} }`) と複合ソート (`contentType, number`) を追加 |

**原因:** マルチコンテンツ seed 後、`orderBy: { number: 'asc' }` だけではクイズを持たないモジュール（外部コンテンツの一部）が最初に返される可能性があった。

---

## 検証結果

### type-check 結果

| ワークスペース | 結果 |
|---------------|------|
| `@learn-ai/shared-types` | pass |
| `@learn-ai/api-client` | pass |
| `web` | pass |
| `mobile` | pass |

### E2E テスト結果

```
Tests  28 passed (28)
```

全 28 テスト通過（16 学習フロー + 6 Achievements + 6 Playground）。

---

## 次のステップ

→ [Phase 5: Mobile フロントエンド](../development/05-phase5-mobile-frontend.md)
