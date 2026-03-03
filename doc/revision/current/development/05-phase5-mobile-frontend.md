# Phase 5: Mobile フロントエンド

## 目的

React Native モバイルアプリにコンテンツタイプ選択画面を追加し、ツール別学習フローを実現する。

---

## 5.1 Navigation 型更新

**ファイル:** `sys/frontend/user/mobile/src/navigation/types.ts`

```typescript
// Module Stack に ContentSelect スクリーンと contentType パラメータ追加
export type ModuleStackParamList = {
  ContentSelect: undefined;                                      // 新規
  ModuleList: { contentType: string };                           // 変更
  ModuleDetail: { contentType: string; moduleId: string };       // 変更
  Lesson: { contentType: string; moduleId: string; lessonId: string };
  Quiz: { quizId: string };
  QuizResults: { /* 既存 */ };
};
```

---

## 5.2 ContentSelect スクリーン

**新規ファイル:** `sys/frontend/user/mobile/src/screens/modules/ContentSelectScreen.tsx`

- `apiClient.getContentTypes()` でツール一覧取得
- カード/リスト形式で表示（アイコン、名前、説明、モジュール数）
- コンテンツなしは「準備中」のバッジ付きで非活性
- タップで `navigation.navigate('ModuleList', { contentType: slug })` へ遷移

---

## 5.3 ModuleStack 更新

**ファイル:** `sys/frontend/user/mobile/src/navigation/ModuleStack.tsx`

```typescript
<Stack.Navigator>
  <Stack.Screen
    name="ContentSelect"
    component={ContentSelectScreen}
    options={{ title: 'AIツール' }}
  />
  <Stack.Screen
    name="ModuleList"
    component={ModuleListScreen}
    options={({ route }) => ({
      title: `${CONTENT_TYPES[route.params.contentType]?.name ?? ''} モジュール`,
    })}
  />
  {/* 既存スクリーン（contentType パラメータ追加） */}
</Stack.Navigator>
```

---

## 5.4 ModuleListScreen 更新

**ファイル:** `sys/frontend/user/mobile/src/screens/modules/ModuleListScreen.tsx`

- `route.params.contentType` を取得
- `apiClient.getModules(contentType)` でフィルタリング
- 遷移先に `contentType` をフォワード

---

## 5.5 ModuleDetailScreen 更新

**ファイル:** `sys/frontend/user/mobile/src/screens/modules/ModuleDetailScreen.tsx`

- `route.params.contentType` を取得してレッスン遷移に引き継ぎ

---

## 5.6 HomeScreen 更新

**ファイル:** `sys/frontend/user/mobile/src/screens/home/HomeScreen.tsx`

- 全体進捗に加え、`progress.byContentType` を使ったツール別サマリーカード追加
- 各カードタップで該当ツールの ModuleList へ遷移

---

## 5.7 Bottom Tab ラベル更新

**ファイル:** `sys/frontend/user/mobile/src/navigation/MainTabs.tsx`

- 「Modules」タブのラベルを「学習」に変更（ツール選択が最初に表示されるため）

---

## 5.8 アプリ名更新

**ファイル:** `sys/frontend/user/mobile/app.json`

```json
{
  "name": "LearnAI",
  "displayName": "AI学習"
}
```

---

## 検証

1. アプリ起動 → 学習タブ → ツール選択画面が表示されること
2. Claude Code タップ → モジュール一覧（8モジュール）が表示されること
3. モジュール → レッスン → 完了フローが正常動作すること
4. Home 画面にツール別進捗が表示されること
5. Gemini / Copilot / Codex は「準備中」表示
6. 戻るボタンでツール選択画面に戻れること
