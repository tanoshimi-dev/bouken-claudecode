# Phase 1: MVP基盤構築 — 進捗レポート

**日付**: 2026-03-01
**ステータス**: 進行中（約60%完了）

---

## 概要

Phase 1 では、Learn Claude Code アプリのモノレポ基盤・バックエンドAPI・Web フロントエンド・OAuth認証を構築した。gengoka プロジェクト（`/Volumes/SSD-PSTU3A/work/dev/gengoka`）の `sys/` ディレクトリ構造を参考に、TypeScript モノレポとして再構成。

---

## 完了した作業

### 1. モノレポ基盤（100%）

81ファイルを作成し、以下の構造を構築：

```
sys/                                    # モノレポルート (pnpm + Turborepo)
├── package.json                        # ワークスペースルート
├── pnpm-workspace.yaml                 # backend/*, frontend/user/*, packages/*
├── turbo.json                          # build, dev, lint, type-check パイプライン
├── tsconfig.base.json                  # 共有 TS 設定 (ES2022, bundler, strict)
├── docker-compose.yml                  # PostgreSQL 16-alpine + Adminer
├── .env.example                        # 環境変数テンプレート
│
├── backend/api/                        # Hono API サーバー (port 4000)
├── frontend/user/web/                  # Next.js 15 App Router (port 3000)
├── packages/
│   ├── shared-types/                   # 共有型定義
│   ├── zod-schemas/                    # API バリデーションスキーマ
│   └── api-client/                     # Fetch ラッパー (Web/Mobile 共用)
└── scripts/seed-content.ts             # コンテンツインポーター
```

**技術スタック:**
- pnpm 9.15.9 ワークスペース + Turborepo
- TypeScript 5.x（strict モード）
- Node.js 22+

### 2. データベース（100%）

- **PostgreSQL 16** を Docker Compose で起動
- **Prisma ORM** でスキーマ定義・マイグレーション完了
- 8テーブル: User, OAuthAccount, Module, Lesson, Quiz, QuizQuestion, UserProgress, UserQuizAttempt, UserAchievement, UserStreak

```
sys/backend/api/prisma/
├── schema.prisma
└── migrations/20260301062237_initialize_0301/
```

### 3. バックエンド API（100%）

Hono フレームワークでREST API を構築：

| ファイル | 内容 |
|---------|------|
| `src/index.ts` | エントリーポイント、CORS、ロガー、エラーハンドラ |
| `src/lib/env.ts` | Zod による環境変数バリデーション |
| `src/lib/prisma.ts` | PrismaClient シングルトン |
| `src/lib/jwt.ts` | jose ベース JWT（access: 15分, refresh: 7日） |
| `src/middleware/auth.ts` | JWT 検証ミドルウェア（Cookie + Bearer） |
| `src/middleware/error-handler.ts` | AppError クラス + エラーハンドラ |
| `src/routes/auth.ts` | OAuth ルート（/me, /refresh, /logout, /:provider） |
| `src/routes/modules.ts` | モジュール一覧・詳細・レッスン取得 |
| `src/routes/quizzes.ts` | クイズ取得・回答送信 |
| `src/routes/progress.ts` | 進捗・ストリーク管理 |
| `src/services/*.ts` | 各ドメインのビジネスロジック |

### 4. OAuth 認証（100%）

Google と GitHub の OAuth ログインを実装・動作確認済み：

- **Google OAuth**: PKCE フロー（arctic ライブラリ v3）
  - `generateState()` + `generateCodeVerifier()` → Cookie に保存
  - コールバックで state 検証 + code 交換 → JWT 発行
- **GitHub OAuth**: state のみ（PKCE なし）
- **ログアウト**: Cookie 削除による実装
- **JWT**: httpOnly Cookie でアクセストークン・リフレッシュトークンを管理
- **トークンリフレッシュ**: POST /api/auth/refresh エンドポイント

### 5. Web フロントエンド骨格（70%）

Next.js 15 App Router で以下のページを作成：

| ページ | 状態 |
|--------|------|
| `/` (ランディング) | 完了 |
| `/login` | 完了（Google + GitHub ボタン） |
| `/dashboard` | スキャフォールド（プレースホルダー） |
| `/modules`, `/modules/[id]` | スキャフォールド |
| `/modules/[id]/lessons/[id]` | スキャフォールド |
| `/quiz/[id]`, `/quiz/[id]/results` | スキャフォールド |
| `/profile` | スキャフォールド |

**レイアウト構成:**
- Header（ユーザー名 + ログアウトボタン）
- Sidebar（ダッシュボード、モジュール、プロフィール）
- Redux Toolkit で認証状態管理

### 6. 共有パッケージ（100%）

- **shared-types**: User, Module, Lesson, Quiz, Progress, Common 型定義
- **zod-schemas**: quizSubmissionSchema, lessonCompleteParamsSchema
- **api-client**: ApiClient クラス（auth, modules, quizzes, progress メソッド、`credentials: 'include'`）

---

## 発生した問題と解決策

### 問題 1: Prisma — DATABASE_URL が見つからない

**症状:** `prisma migrate dev` 実行時に "Environment variable not found: DATABASE_URL"

**原因:** Prisma は schema.prisma と同じディレクトリの .env を読み込む。最初 `sys/prisma/` にスキーマを配置したが、.env は `sys/backend/api/` にあった。

**解決策:**
1. `prisma/` ディレクトリを `backend/api/prisma/` に移動
2. `.env` を `backend/api/` に配置（schema.prisma の親ディレクトリ）

**試行錯誤:**
- dotenv-cli → pnpm ワークスペースでコマンド解決できず
- `--dotenv-path` フラグ → インストール済みバージョンで未サポート

### 問題 2: Prisma generate — モノレポでの自動インストール失敗

**症状:** `prisma generate` で "Command failed: pnpm add prisma@6.19.2 -D --silent"

**原因:** Prisma の自動インストール機能が pnpm ワークスペース内で正常に動作しない。

**解決策:**
- prisma と @prisma/client のバージョンを 6.19.2 に固定
- `db:generate` スクリプトに `PRISMA_GENERATE_SKIP_AUTOINSTALL=true` を追加
- スキーマを `backend/api/prisma/` に配置し、generator の `output` を削除（デフォルトの node_modules/.prisma/client を使用）

### 問題 3: API サーバー — 環境変数が読み込まれない

**症状:** Zod バリデーションエラー（DATABASE_URL, JWT_SECRET 等が undefined）

**原因:** tsx は `.env` ファイルを自動読み込みしない。

**解決策:** dev スクリプトを `tsx watch --env-file=.env src/index.ts` に変更。

### 問題 4: Google OAuth — arctic v3 API の署名不一致

**症状:** "Cannot read properties of undefined (reading 'length')" エラー

**原因:** arctic v3 では `createAuthorizationURL(state, codeVerifier, scopes)` の形式が必要。最初はスコープ配列のみを渡していた。

**解決策:**
```typescript
// 修正前（誤り）
const url = google.createAuthorizationURL(['openid', 'email', 'profile']);

// 修正後（正しい）
const state = generateState();
const codeVerifier = generateCodeVerifier();
const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile']);
```

### 問題 5: Google OAuth — redirect_uri_mismatch

**症状:** Google のエラー画面 "redirect_uri_mismatch"

**原因:** Google Cloud Console に登録されたリダイレクト URI が .env の設定と不一致。

**解決策:** Google Cloud Console で `http://localhost:3000/api/auth/google/callback` を登録。

### 問題 6: クロスオリジン Cookie 問題

**症状:** ログイン後にログアウトボタンが表示されない。`/api/auth/me` のレスポンスが 401。

**原因:** Cookie は port 4000 で設定されるが、フロントエンドは port 3000。`SameSite=Lax` により、フロントエンドからの fetch で Cookie が送信されない。

**解決策:**
1. Next.js の rewrites で `/api/*` を `localhost:4000/api/*` にプロキシ
2. api-client の `baseUrl` を `''`（同一オリジン）に変更
3. OAuth リダイレクト URI をすべて port 3000 経由に変更
4. LoginForm の href を `/api/auth/:provider`（同一オリジン）に変更

```typescript
// next.config.ts
async rewrites() {
  return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
}
```

### 問題 7: Hono ルート順序 — /me が /:provider に一致

**症状:** `/api/auth/me` にアクセスすると "Unsupported provider: me" エラー

**原因:** Hono はルート登録順にマッチングする。`/:provider` ワイルドカードが `/me` より先に登録されていた。

**解決策:** 具体的なルート（/me, /refresh, /logout）をワイルドカードルート（/:provider, /:provider/callback）の **前** に配置。

### 問題 8: ビルドエラー — .js 拡張子の解決失敗

**症状:** "Can't resolve './client.js'" エラー

**原因:** Next.js がワークスペースパッケージを生 TypeScript としてインポートする際、`.js` 拡張子のファイルが見つからない。

**解決策:** shared-types, zod-schemas, api-client の全インポートから `.js` 拡張子を削除。

---

## 残作業（約40%）

### コンテンツ作成（未着手）
- [ ] Module 1: Claude Code 入門（レッスン3-5本 + クイズ）
- [ ] Module 2: プロンプトエンジニアリング基礎（レッスン3-5本 + クイズ）
- [ ] Module 3: 実践プロジェクト（レッスン3-5本 + クイズ）
- [ ] `doc/contents/` ディレクトリにMarkdown + quiz.json を配置
- [ ] `seed-content.ts` でDBにインポート

### Web UI データ連携（未着手）
- [ ] ダッシュボードページに実データ表示（進捗、ストリーク）
- [ ] モジュール一覧・詳細ページを API に接続
- [ ] レッスンページに Markdown レンダラー統合
- [ ] クイズページに回答送信・結果表示を実装
- [ ] プロフィールページにユーザー情報表示

### Markdown レンダラー（未着手）
- [ ] react-markdown + rehype-highlight でレッスンコンテンツ表示
- [ ] コードブロックのシンタックスハイライト
- [ ] レスポンシブデザイン対応

### 認証ガード（未着手）
- [ ] 未認証ユーザーを `/login` にリダイレクト
- [ ] Next.js middleware による保護

---

## 環境情報

| 項目 | 値 |
|------|-----|
| API サーバー | http://localhost:4000 |
| Web フロントエンド | http://localhost:3000 |
| PostgreSQL | localhost:5432/learn_claude_code |
| Adminer | http://localhost:8080 |
| Next.js rewrites | /api/* → localhost:4000/api/* |

### 起動手順

```bash
cd sys
pnpm install
docker compose up -d          # PostgreSQL + Adminer
pnpm db:migrate               # マイグレーション実行
pnpm turbo dev                # API + Web 同時起動
```

---

## 参考資料

- 設計仕様書: `bouken.app/claudecode/doc/design.md`
- 開発計画: `doc/development/01-phase1-mvp.md`
- 参考プロジェクト: `/Volumes/SSD-PSTU3A/work/dev/gengoka`
