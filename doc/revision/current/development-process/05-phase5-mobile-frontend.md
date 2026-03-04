# Phase 5: Mobile フロントエンド — 完了レポート

**実施日:** 2026-03-04
**ステータス:** 完了

---

## 概要

React Native モバイルアプリをマルチコンテンツ対応に更新。ツール選択画面（ContentSelectScreen）を追加し、全ナビゲーションに `contentType` パラメータを伝播。ブランディングを「Learn Claude Code」→「AI学習」に変更。

---

## 変更内容

### 新規ファイル

| ファイル | 目的 |
|---------|------|
| `screens/modules/ContentSelectScreen.tsx` | ツール選択画面 — `apiClient.getContentTypes()` でカード表示、コンテンツなしは「準備中」バッジ |

### 修正ファイル

| ファイル | 変更内容 |
|---------|---------|
| `navigation/types.ts` | `ContentSelect` スクリーン追加。`ModuleList`, `ModuleDetail`, `Lesson`, `Quiz`, `QuizResults` に `contentType` パラメータ追加 |
| `navigation/ModuleStack.tsx` | `ContentSelect` を初期スクリーンに設定。`CONTENT_TYPES` からヘッダータイトルを動的生成 |
| `navigation/MainTabs.tsx` | タブラベル「Modules」→「学習」 |
| `screens/modules/ModuleListScreen.tsx` | `route.params.contentType` 取得、`apiClient.getModules(contentType)` でフィルタ、遷移先に `contentType` フォワード |
| `screens/modules/ModuleDetailScreen.tsx` | `contentType` をレッスン・クイズ遷移に引き継ぎ |
| `screens/modules/LessonScreen.tsx` | `contentType` を前後レッスン遷移に引き継ぎ |
| `screens/quiz/QuizScreen.tsx` | `contentType` を `QuizResults` 遷移に引き継ぎ |
| `screens/quiz/QuizResultsScreen.tsx` | `contentType` を `ModuleDetail` 戻り遷移に引き継ぎ |
| `screens/home/HomeScreen.tsx` | `progress.byContentType` を使ったツール別進捗カード追加（アイコン・色・ProgressBar）。タップで該当ツールの ModuleList へ遷移 |
| `screens/auth/LoginScreen.tsx` | タイトル「Learn Claude Code」→「AI学習」、説明文を日本語に変更 |
| `app.json` | `displayName` を「AI学習」に変更（`name` は `LearnClaudeCode` を維持 — 後述） |

---

## ナビゲーションフロー

```
学習タブ (ModuleStack)
  ContentSelect (AIツール選択)
    → ModuleList (contentType)
      → ModuleDetail (contentType, moduleId)
        → Lesson (contentType, moduleId, lessonId)
        → Quiz (contentType, quizId)
          → QuizResults (contentType, moduleId, score...)
            → ModuleDetail (戻り)

HomeTab
  Home (ツール別進捗カード)
    → ModulesTab > ModuleList (contentType) へ遷移
```

---

## 修正した問題

### app.json `name` フィールド変更によるクラッシュ

**症状:** アプリ起動直後に `"LearnClaudeCode" has not been registered` エラーでクラッシュ。

**原因:** `app.json` の `name` を `LearnAI` に変更したが、`index.js` が `AppRegistry.registerComponent(appName, ...)` で `name` を使用しており、ネイティブ Android/iOS ビルドは `LearnClaudeCode` として登録済み。ネイティブ側の再ビルドなしに `name` を変更すると不一致が発生する。

**修正:** `name` を `LearnClaudeCode` に戻し、ユーザー向け表示名の `displayName` のみ「AI学習」に変更。

```json
{
  "name": "LearnClaudeCode",
  "displayName": "AI学習"
}
```

**教訓:** React Native の `app.json` `name` はネイティブプロジェクトの識別子であり、変更にはネイティブ側の再ビルドが必要。`displayName` はユーザー向け表示名で自由に変更可能。

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

全 28 テスト通過。

---

## 全フェーズ完了サマリー

| Phase | 内容 | ステータス |
|-------|------|-----------|
| Phase 1 | パッケージリネーム (`@learn-claude-code/*` → `@learn-ai/*`) | 完了 |
| Phase 2 | DB スキーマ & バックエンド基盤 (`contentType` フィールド、API フィルタ) | 完了 |
| Phase 3 | Seed スクリプト更新 (4 コンテンツタイプ × 44 モジュール) | 完了 |
| Phase 4 | Web フロントエンド (`/contents/[contentType]/` ルート構造) | 完了 |
| Phase 5 | Mobile フロントエンド (`ContentSelectScreen` + ナビゲーション更新) | 完了 |
