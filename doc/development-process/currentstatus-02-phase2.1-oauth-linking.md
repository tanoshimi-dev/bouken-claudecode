# Phase 2.1: OAuth 全プロバイダー対応 + アカウントリンク — 進捗レポート

**日付**: 2026-03-02
**ステータス**: ほぼ完了（90%）
**コミット**: `d79c21d [backend][frontend]implement phase02 except apple login`

---

## 概要

Phase 2.1 では、Phase 1 で構築済みの Google / GitHub OAuth に加え、Microsoft・Apple・LINE の OAuth ログインを追加し、アカウント連携（リンク/アンリンク）機能を実装した。17ファイルを変更し、+534行を追加。Microsoft と LINE のログインは動作確認済み。Apple は `localhost` 非対応のためローカルでの動作確認は未実施（本番環境またはトンネル使用時に確認予定）。

---

## 完了した作業

### 1. 共有パッケージ更新（100%）

| ファイル | 変更内容 |
|---------|---------|
| `sys/packages/shared-types/src/user.ts` | `LinkedAccount` インターフェース、`OAuthProvider` 型、`UserProfile.linkedAccounts` 追加 |
| `sys/packages/shared-types/src/index.ts` | `LinkedAccount`, `OAuthProvider` エクスポート追加 |
| `sys/packages/zod-schemas/src/auth.ts` | 新規作成: `oauthProviderSchema`（5プロバイダー enum） |
| `sys/packages/zod-schemas/src/index.ts` | `oauthProviderSchema` エクスポート追加 |
| `sys/packages/api-client/src/client.ts` | `unlinkProvider(provider)` メソッド追加（DELETE） |

### 2. バックエンド環境変数（100%）

`sys/backend/api/src/lib/env.ts` に12個の新規環境変数を追加:

| プロバイダー | 環境変数 |
|---|---|
| Microsoft | `MICROSOFT_TENANT`（default: `common`）, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI` |
| Apple | `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_REDIRECT_URI` |
| LINE | `LINE_CLIENT_ID`, `LINE_CLIENT_SECRET`, `LINE_REDIRECT_URI` |

全てデフォルト値 `''` を持ち、未設定でもアプリがクラッシュしない。

### 3. AuthService 拡張（100%）

`sys/backend/api/src/services/auth.service.ts` — +222行

**プロバイダー初期化**（条件付き）:
- `MicrosoftEntraId`: クライアントID/Secret が設定されている場合のみ初期化
- `Apple`: ClientID + TeamID + KeyID + PrivateKey が全て設定されている場合のみ初期化
- `Line`: クライアントID/Secret が設定されている場合のみ初期化

**OAuth フロー**:

| プロバイダー | PKCE | スコープ | ユーザー情報取得方法 |
|---|---|---|---|
| Microsoft | あり（codeVerifier） | `openid`, `profile`, `email` | ID トークン `sub` + Graph API フォールバック |
| Apple | なし | `name`, `email` | ID トークン `decodeIdToken()` |
| LINE | あり（codeVerifier） | `profile`, `openid`, `email` | LINE Profile API + ID トークン（email） |

**新規メソッド**:
- `linkProvider(userId, provider, code, codeVerifier?)` — 既存アカウントに別プロバイダーを連携。他ユーザーとの重複チェックあり
- `unlinkProvider(userId, provider)` — プロバイダー連携解除。最低1プロバイダーのガード付き
- `getUserProfile()` — `linkedAccounts` 配列（`{provider, linkedAt}`）を返却するよう更新

### 4. Auth ルート拡張（100%）

`sys/backend/api/src/routes/auth.ts` — +85行

新規ルート（既存の wildcard ルートの前に配置）:

| ルート | メソッド | 認証 | 説明 |
|--------|---------|------|------|
| `/apple/callback` | POST | なし | Apple の `response_mode=form_post` に対応 |
| `/link/:provider` | GET | 必須 | 連携フロー開始。`oauth_link_user` Cookie をセットし OAuth リダイレクト |
| `/link/:provider` | DELETE | 必須 | プロバイダー連携解除 |

**連携フロー**:
1. `GET /link/:provider` → `oauth_link_user=userId` を httpOnly Cookie（10分TTL）に保存 → プロバイダーの OAuth 画面へリダイレクト
2. OAuth コールバック時に `oauth_link_user` Cookie を検出 → `linkProvider()` を呼び出し（通常の `handleCallback()` ではなく）
3. 連携成功後、`/profile/settings` にリダイレクト

### 5. フロントエンド — ログインフォーム更新（100%）

`sys/frontend/user/web/src/components/auth/LoginForm.tsx` — 3プロバイダー追加:
- Microsoft（🟦）、Apple（🍎）、LINE（🟢）

### 6. フロントエンド — 設定ページ（100%）

新規作成:

| ファイル | 説明 |
|---------|------|
| `sys/frontend/user/web/src/app/(app)/profile/settings/page.tsx` | サーバーコンポーネントラッパー |
| `sys/frontend/user/web/src/app/(app)/profile/settings/SettingsContent.tsx` | 設定ページ本体（アカウント連携管理セクション） |
| `sys/frontend/user/web/src/components/auth/ProviderManager.tsx` | 5プロバイダーの連携状態表示 + リンク/アンリンクボタン |

**ProviderManager の機能**:
- 全5プロバイダーをリスト表示（連携済み / 未連携）
- 「連携する」ボタン → `window.location.href = /api/auth/link/${provider}`
- 「連携解除」ボタン → `apiClient.unlinkProvider(provider)` → リロード
- 最後の1プロバイダーの解除ボタンは無効化
- 日本語ラベル: 「連携済み」「連携する」「連携解除」

### 7. フロントエンド — ナビゲーション更新（100%）

| ファイル | 変更内容 |
|---------|---------|
| `sys/frontend/user/web/src/components/layout/Sidebar.tsx` | 「設定」ナビアイテム追加 |
| `sys/frontend/user/web/src/app/(app)/profile/ProfileContent.tsx` | 設定ページへのリンクボタン追加 |
| `sys/frontend/user/web/next.config.ts` | LINE プロフィール画像ドメイン（`profile.line-scdn.net`）追加 |

### 8. E2E テスト更新（100%）

`sys/backend/api/src/__tests__/e2e.test.ts` — 4テストケース追加（合計16件 all pass）:

| # | テスト | 期待値 |
|---|--------|--------|
| 12 | `DELETE /api/auth/link/google`（認証あり） | 400（プロバイダー不足で解除不可） |
| 13 | `GET /api/auth/link/google`（認証なし） | 401 |
| 14 | `DELETE /api/auth/link/google`（認証なし） | 401 |
| 15 | `GET /api/auth/me` で `linkedAccounts` 配列を返す | 200、`Array.isArray` |

---

## 発生した問題と解決策

### 問題 1: Microsoft ログイン — `unauthorized_client`

**症状**: Microsoft ログインボタンクリック後、`unauthorized_client: The client does not exist or is not enabled for consumers` エラー

**原因**: Azure AD アプリの「サポートされているアカウントの種類」が「この組織ディレクトリのみ（シングルテナント）」になっていた。`MICROSOFT_TENANT=common` はマルチテナント + 個人アカウント対応が必要。

**解決策**: Azure Portal > アプリの登録 > 認証 > 「任意の組織ディレクトリ内のアカウントと個人の Microsoft アカウント」に変更。

### 問題 2: Microsoft ログイン — `providerId: String`（Prisma エラー）

**症状**: Microsoft OAuth コールバック後、`Argument providerId is missing` エラー。Prisma が `providerId: String`（型コンストラクタ）を受け取った。

**原因**: 個人 Microsoft アカウントでは MS Graph API `/v1.0/me` の `id` フィールドが返らない場合がある。`data.id` が `undefined` になり、`String(undefined)` が `"undefined"` ではなく型情報として渡された。

**解決策**: ID トークンの `sub` クレーム（`openid` スコープで常に利用可能）を `providerId` として使用するよう変更。Graph API はフォールバックとして名前・メール取得のみに使用。

### 問題 3: Apple — localhost 非対応

**症状**: Apple Developer Console の Service ID 設定で `localhost` をドメインとして登録できない。

**原因**: Apple は Sign in with Apple のドメインおよびリダイレクト URI に `localhost` を許可しない仕様。

**対応**: ngrok 等のトンネルサービスを使用してローカル開発環境を公開するか、本番/ステージング環境でのみ Apple ログインをテストする。手順は `memo/oauth-setup-all-providers.md` の 4-8 に記載。

---

## 動作確認状況

| プロバイダー | ログイン | アカウント連携 | 備考 |
|---|---|---|---|
| Google | ✅ 動作確認済み | ✅ | Phase 1 から継続 |
| GitHub | ✅ 動作確認済み | ✅ | Phase 1 から継続 |
| Microsoft | ✅ 動作確認済み | ✅ | 問題1,2 を解決後に確認 |
| Apple | ⚠️ 未確認 | ⚠️ 未確認 | localhost 非対応のため。本番環境で確認予定 |
| LINE | ✅ 動作確認済み | ✅ | メールアドレス取得権限は申請済み |

---

## 設計判断

1. **連携フローは Cookie フラグ方式** — `oauth_link_user` Cookie で通常ログインと連携を区別。共有のコールバックハンドラーを活用
2. **メールベースの自動マージなし** — アカウント連携は常に明示的（認証済みユーザーが手動でリンク）
3. **Apple POST コールバック** — Apple は `response_mode=form_post` を使用するため、別途 `POST /apple/callback` で処理
4. **プロバイダーの条件初期化** — クレデンシャル未設定のプロバイダーは `null` のまま。使用時に「not configured」エラーを返す
5. **Prisma マイグレーション不要** — 既存の `OAuthAccount` モデルは `provider: String` で任意のプロバイダー文字列を受け入れ可能

---

## ファイル変更サマリー（17ファイル, +534行）

### 新規作成（4ファイル）

| ファイル | 概要 |
|---------|------|
| `sys/packages/zod-schemas/src/auth.ts` | OAuth プロバイダー Zod スキーマ |
| `sys/frontend/user/web/src/components/auth/ProviderManager.tsx` | プロバイダー連携管理コンポーネント |
| `sys/frontend/user/web/src/app/(app)/profile/settings/page.tsx` | 設定ページ（サーバーコンポーネント） |
| `sys/frontend/user/web/src/app/(app)/profile/settings/SettingsContent.tsx` | 設定ページ本体 |

### 修正（13ファイル）

| ファイル | 変更内容 |
|---------|---------|
| `sys/packages/shared-types/src/user.ts` | `LinkedAccount`, `OAuthProvider` 型追加 |
| `sys/packages/shared-types/src/index.ts` | エクスポート追加 |
| `sys/packages/zod-schemas/src/index.ts` | `oauthProviderSchema` エクスポート追加 |
| `sys/packages/api-client/src/client.ts` | `unlinkProvider()` メソッド追加 |
| `sys/backend/api/src/lib/env.ts` | Microsoft/Apple/LINE 環境変数12個追加 |
| `sys/backend/api/src/services/auth.service.ts` | 3プロバイダー追加、link/unlink メソッド、getUserProfile 拡張 |
| `sys/backend/api/src/routes/auth.ts` | Apple POST callback、link/unlink ルート、コールバック連携フロー |
| `sys/backend/api/src/__tests__/e2e.test.ts` | link/unlink テスト4件追加 |
| `sys/frontend/user/web/src/components/auth/LoginForm.tsx` | 3プロバイダー追加 |
| `sys/frontend/user/web/src/components/layout/Sidebar.tsx` | 「設定」ナビ追加 |
| `sys/frontend/user/web/src/app/(app)/profile/ProfileContent.tsx` | 設定リンク追加 |
| `sys/frontend/user/web/next.config.ts` | LINE 画像ドメイン追加 |
| `sys/.env.example` | 新規 OAuth 環境変数追加 |

---

## 残作業

### Apple ログイン動作確認（本番環境 or ngrok）
- [ ] Apple Developer Program でアプリ登録完了
- [ ] ngrok または本番環境での Apple ログインテスト
- [ ] Apple POST コールバックの動作確認

### 軽微な改善（任意）
- [ ] プロバイダーアイコンを絵文字からSVGアイコンに変更
- [ ] 連携解除時の確認ダイアログ追加
- [ ] 連携成功/失敗時のトースト通知

---

## 参考資料

- 設計仕様書: `doc/development/02-phase2-core.md`（セクション 2.1）
- OAuth セットアップ手順: `memo/oauth-setup-all-providers.md`
- Phase 1 進捗レポート: `doc/development-process/currentstatus-01-phase1-mvp.md`
