# Phase 1: パッケージリネーム

## 目的

パッケージスコープを `@learn-claude-code/*` から `@learn-ai/*` へ変更し、マルチコンテンツ化のブランディングに合わせる。

---

## 変更内容

### 1.1 パッケージ名変更

| 現在 | 変更後 |
|------|--------|
| `@learn-claude-code/shared-types` | `@learn-ai/shared-types` |
| `@learn-claude-code/api-client` | `@learn-ai/api-client` |
| `@learn-claude-code/zod-schemas` | `@learn-ai/zod-schemas` |
| `learn-claude-code`（root） | `learn-ai` |

### 1.2 修正対象ファイル

**package.json ファイル:**
- `sys/package.json` — name を `learn-ai` に
- `sys/packages/shared-types/package.json` — name を `@learn-ai/shared-types` に
- `sys/packages/api-client/package.json` — name と dependencies
- `sys/packages/zod-schemas/package.json` — name と dependencies
- `sys/backend/api/package.json` — dependencies
- `sys/frontend/user/web/package.json` — dependencies
- `sys/frontend/user/mobile/package.json` — dependencies

**import 文の一括置換:**
- `@learn-claude-code/shared-types` → `@learn-ai/shared-types`
- `@learn-claude-code/api-client` → `@learn-ai/api-client`
- `@learn-claude-code/zod-schemas` → `@learn-ai/zod-schemas`

対象: 全 `.ts`, `.tsx` ファイル

### 1.3 手順

```bash
# 1. package.json の name フィールドを変更
# 2. 全ファイルの import を一括置換
grep -rl "@learn-claude-code/" sys/ | xargs sed -i '' 's/@learn-claude-code\//@learn-ai\//g'
# 3. node_modules 再インストール
cd sys && pnpm install
# 4. 型チェック
pnpm type-check
# 5. ビルド確認
pnpm build
```

### 1.4 検証

- `pnpm type-check` がすべてのワークスペースで成功すること
- `pnpm build` が成功すること
- `pnpm dev` でアプリが正常起動すること
