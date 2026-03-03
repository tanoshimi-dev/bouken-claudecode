# Fix: Metro シングルトンモジュール解決

**日付**: 2026-03-04
**対象ファイル**: `sys/frontend/user/mobile/metro.config.js`

---

## 問題

モノレポ構成で Metro バンドラーが `react` や `react-native` を複数箇所から解決してしまい、以下のランタイムエラーが発生する：

- `Invalid hook call` — React が二重にロードされている
- `Cannot read property of null` — React 内部状態の不整合
- 黒画面 / クラッシュ

### 原因

pnpm モノレポでは `node_modules` がモノレポルートとプロジェクトルートの2箇所に存在する。Metro の `nodeModulesPaths` に両方を指定しているため、共有パッケージ（`shared-types`, `api-client` 等）が依存する `react` がモノレポルート側から解決され、モバイルプロジェクト側の `react` と二重にロードされる。

```
monorepo-root/
├── node_modules/
│   └── react/          ← 共有パッケージがここから解決
├── sys/frontend/user/mobile/
│   └── node_modules/
│       └── react/      ← モバイルアプリがここから解決
```

React はシングルトンでなければならないため、2つのインスタンスが存在すると Hooks や Context が正しく動作しない。

---

## 対応

`metro.config.js` に `resolveRequest` カスタムリゾルバーを追加し、シングルトンモジュールを強制的にモバイルプロジェクトの `node_modules` から解決する。

### 変更内容

```js
const mobileModules = path.resolve(__dirname, 'node_modules');

// シングルトンとして解決すべきモジュール
const singletonModules = {
  react: path.resolve(mobileModules, 'react'),
  'react-native': path.resolve(mobileModules, 'react-native'),
  'react/jsx-runtime': path.resolve(mobileModules, 'react/jsx-runtime'),
  'react/jsx-dev-runtime': path.resolve(mobileModules, 'react/jsx-dev-runtime'),
};

// resolver 内
resolveRequest: (context, moduleName, platform) => {
  if (singletonModules[moduleName]) {
    return {
      type: 'sourceFile',
      filePath: require.resolve(moduleName, { paths: [mobileModules] }),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
},
```

### ポイント

- `react/jsx-runtime` と `react/jsx-dev-runtime` も含める — JSX トランスパイル時にこれらが別インスタンスから解決されると同じ問題が起こる
- `require.resolve()` に `{ paths: [mobileModules] }` を指定して、確実にモバイル側の `node_modules` から解決する
- シングルトンモジュール以外は通常の解決フロー（`context.resolveRequest`）にフォールバック

---

## 今後の注意

- 新しいシングルトンモジュール（例: `react-dom` 相当のパッケージ）を追加する場合は `singletonModules` マップに追記する
- pnpm の `overrides` や `peerDependencyRules` では解決できない Metro 固有の問題であるため、この設定は維持が必要
