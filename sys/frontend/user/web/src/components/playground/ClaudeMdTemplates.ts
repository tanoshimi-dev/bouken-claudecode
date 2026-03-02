export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const CLAUDE_MD_TEMPLATES: Template[] = [
  {
    id: 'basic',
    name: '個人用',
    description: '個人開発向けの基本的なテンプレート',
    content: `# CLAUDE.md

## Memory
- このプロジェクトはTypeScriptで書かれています
- パッケージマネージャはpnpmを使用しています
- Node.js v22を使用

## Preferences
- コードスタイル: prettier + ESLint
- テストフレームワーク: vitest
- コミットメッセージは日本語で書く
- インデントはスペース2つ

## Project Rules
- 既存のコードパターンに従う
- 新しい依存関係の追加前に確認する
- テストを書いてからコードを実装する（TDD）
- console.log はデバッグ後に削除する
`,
  },
  {
    id: 'project',
    name: 'プロジェクト用',
    description: 'チーム開発プロジェクト向けの詳細なテンプレート',
    content: `# CLAUDE.md

## Memory
- モノレポ構成: apps/ (Next.js), packages/ (shared)
- データベース: PostgreSQL + Prisma ORM
- API: RESTful (Hono.js)
- フロントエンド: Next.js 15 App Router + Tailwind CSS
- 認証: OAuth 2.0 (Google, GitHub)

## Preferences
- TypeScript strict mode を使用
- インポートは絶対パス (@/) を優先
- コンポーネントは関数コンポーネントのみ使用
- エラーハンドリングは try-catch + カスタムエラークラス
- 日本語のコメント・ドキュメント

## Project Rules
- PRは1つの機能/修正に絞る
- 破壊的変更にはマイグレーションを含める
- 環境変数は .env.example に記載する
- API エンドポイントには認証ミドルウェアを使用する
- レスポンスは { data: T } 形式で統一する

## Architecture
- サービス層でビジネスロジックを管理
- ルート層はリクエスト/レスポンスの処理のみ
- 共有型は shared-types パッケージで定義
- バリデーションは zod スキーマで定義

## Commands
- \`pnpm dev\` — 開発サーバー起動
- \`pnpm build\` — プロダクションビルド
- \`pnpm test\` — テスト実行
- \`pnpm db:migrate\` — マイグレーション実行
`,
  },
  {
    id: 'team',
    name: 'チーム用',
    description: 'チーム全員が参照する標準ルール集',
    content: `# CLAUDE.md

## Memory
- チーム全員が Claude Code を使用しています
- コードレビューは必須です
- CI/CD: GitHub Actions
- デプロイ先: Vercel (フロントエンド), Railway (バックエンド)

## Preferences
- ブランチ命名規則: feature/, fix/, chore/
- コミットメッセージ: Conventional Commits 形式
- テストカバレッジ: 80% 以上を維持
- ドキュメント: 公開APIにはJSDocコメントを必須にする
- コードレビュー: 最低1名の承認が必要

## Project Rules
- main ブランチへの直接プッシュ禁止
- 新機能には必ずテストを追加する
- セキュリティ: OWASP Top 10 を考慮する
- パフォーマンス: バンドルサイズの増加を監視する
- アクセシビリティ: WCAG 2.1 AA 準拠

## Code Style
- 関数名: camelCase
- コンポーネント名: PascalCase
- 定数: UPPER_SNAKE_CASE
- ファイル名: kebab-case（コンポーネントファイル以外）
- CSSクラス: Tailwind CSS ユーティリティを優先

## Forbidden Patterns
- any 型の使用（型安全性を維持）
- インラインスタイル（Tailwind CSSを使用）
- 直接的なDOM操作（Reactのrefを使用）
- グローバル状態の乱用（ローカル状態を優先）
`,
  },
];
