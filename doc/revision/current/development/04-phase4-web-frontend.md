# Phase 4: Web フロントエンド

## 目的

コンテンツタイプ選択画面を追加し、ツール別のモジュール・ダッシュボード・Playground を実現する。

---

## 4.1 新規ルート構造

```
sys/frontend/user/web/src/app/(app)/
  contents/
    page.tsx                                    # ツール選択画面
    ContentsContent.tsx                         # Client component
    [contentType]/
      layout.tsx                                # contentType バリデーション + Context
      dashboard/
        page.tsx                                # ツール別ダッシュボード
        DashboardContent.tsx
      modules/
        page.tsx                                # モジュール一覧
        ModulesContent.tsx
        [moduleId]/
          page.tsx                              # モジュール詳細
          ModuleDetailContent.tsx                # 既存コンポーネントを移植
          lessons/
            [lessonId]/
              page.tsx                          # レッスン
              LessonContent.tsx                 # 既存コンポーネントを移植
      playground/
        page.tsx                                # ツール別 Playground
        PlaygroundContent.tsx
```

---

## 4.2 ContentTypeProvider（React Context）

**新規ファイル:** `sys/frontend/user/web/src/components/content/ContentTypeProvider.tsx`

```typescript
'use client';

import { createContext, useContext } from 'react';
import type { ContentTypeSlug } from '@learn-ai/shared-types';

const ContentTypeContext = createContext<ContentTypeSlug | null>(null);

export function ContentTypeProvider({
  contentType,
  children,
}: {
  contentType: string;
  children: React.ReactNode;
}) {
  return (
    <ContentTypeContext.Provider value={contentType as ContentTypeSlug}>
      {children}
    </ContentTypeContext.Provider>
  );
}

export function useContentType(): ContentTypeSlug {
  const ctx = useContext(ContentTypeContext);
  if (!ctx) throw new Error('useContentType must be used within ContentTypeProvider');
  return ctx;
}
```

---

## 4.3 ツール選択画面

**新規:** `sys/frontend/user/web/src/app/(app)/contents/ContentsContent.tsx`

- `apiClient.getContentTypes()` でツール一覧取得
- カード形式でツールを表示（アイコン、名前、説明、モジュール数）
- コンテンツがないツールは「準備中」表示で非クリック
- クリックで `/contents/:contentType/modules` へ遷移

---

## 4.4 [contentType] Layout

**新規:** `sys/frontend/user/web/src/app/(app)/contents/[contentType]/layout.tsx`

- `params.contentType` を `CONTENT_TYPES` で検証、無効なら `notFound()`
- `ContentTypeProvider` でラップ
- 子コンポーネントは `useContentType()` で contentType を取得

---

## 4.5 ツール別モジュール一覧

**新規:** `sys/frontend/user/web/src/app/(app)/contents/[contentType]/modules/ModulesContent.tsx`

- 既存の `(app)/modules/` の ModulesContent をベースに移植
- `useContentType()` で contentType 取得
- `apiClient.getModules(contentType)` でフィルタリング
- リンク先を `/contents/${contentType}/modules/${id}` に変更

---

## 4.6 ツール別ダッシュボード

**新規:** `sys/frontend/user/web/src/app/(app)/contents/[contentType]/dashboard/DashboardContent.tsx`

- ツール別の学習進捗を表示
- `apiClient.getProgress(contentType)` で取得

---

## 4.7 ツール別 Playground

**新規:** `sys/frontend/user/web/src/app/(app)/contents/[contentType]/playground/PlaygroundContent.tsx`

- `claudecode` の場合: 既存の Terminal / CLAUDE.md / Config Builder を表示
- その他: 「Playground 準備中」プレースホルダー
- 将来の拡張: ツール別の Playground コンポーネントを追加

---

## 4.8 Sidebar 更新

**ファイル:** `sys/frontend/user/web/src/components/layout/Sidebar.tsx`

パスからコンテキストを判定してナビゲーション項目を切り替え:

**`/contents/:contentType/*` 内の場合:**
- ← ツール選択
- ダッシュボード (`/contents/:contentType/dashboard`)
- モジュール (`/contents/:contentType/modules`)
- Playground (`/contents/:contentType/playground`)

**グローバル（`/contents` 外）の場合:**
- AIツール選択 (`/contents`)
- ダッシュボード (`/dashboard`)
- プロフィール (`/profile`)
- 設定 (`/profile/settings`)

ツール選択中は Sidebar 上部にツール名・アイコンを表示。

---

## 4.9 Header 更新

**ファイル:** `sys/frontend/user/web/src/components/layout/Header.tsx`

- ロゴ/テキストを「Learn Claude Code」→「AI学習」に変更
- リンク先を `/contents` に変更

---

## 4.10 メタデータ更新

**ファイル:** `sys/frontend/user/web/src/app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: 'AI学習',
  description: 'AIコーディングツールの使い方をインタラクティブに学べる教育アプリ',
};
```

---

## 4.11 グローバルダッシュボード更新

**ファイル:** `sys/frontend/user/web/src/app/(app)/dashboard/DashboardContent.tsx`

- 全体進捗に加え、ツール別進捗サマリーを表示
- `progress.byContentType` を使ってツール別カードを表示
- 各カードクリックで `/contents/:contentType/dashboard` へ遷移

---

## 4.12 旧ルートのリダイレクト（オプション）

既存の `/modules` → `/contents` へリダイレクト:

```typescript
// sys/frontend/user/web/src/app/(app)/modules/page.tsx
import { redirect } from 'next/navigation';
export default function ModulesRedirect() {
  redirect('/contents');
}
```

---

## 検証

1. `/contents` でツール選択画面が表示されること
2. Claude Code カードをクリックで `/contents/claudecode/modules` に遷移
3. モジュール一覧が正しく表示されること（既存の Claude Code コンテンツ）
4. レッスン閲覧・完了マーキングが動作すること
5. ツール別ダッシュボードで正しい進捗が表示されること
6. Gemini / Copilot / Codex は「準備中」表示
7. Sidebar がコンテキストに応じて切り替わること
8. グローバルダッシュボードにツール別サマリーが表示されること
