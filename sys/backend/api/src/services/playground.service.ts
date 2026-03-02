import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import type { PlaygroundTemplate } from '@learn-claude-code/shared-types';

const MAX_SNIPPETS_PER_USER = 50;

const TEMPLATES: PlaygroundTemplate[] = [
  {
    id: 'basic',
    name: '個人用 CLAUDE.md',
    description: '個人開発向けの基本的なCLAUDE.mdテンプレート',
    type: 'claude_md',
    content: `# CLAUDE.md

## Memory
- このプロジェクトはTypeScriptで書かれています
- パッケージマネージャはpnpmを使用しています

## Preferences
- コードスタイル: prettier + ESLint
- テスト: vitest を使用
- コミットメッセージは日本語で書く

## Project Rules
- 既存のコードパターンに従う
- 新しい依存関係の追加前に確認する
- テストを書いてからコードを実装する（TDD）
`,
  },
  {
    id: 'project',
    name: 'プロジェクト用 CLAUDE.md',
    description: 'チーム開発プロジェクト向けの詳細なテンプレート',
    type: 'claude_md',
    content: `# CLAUDE.md

## Memory
- モノレポ構成: apps/ (Next.js), packages/ (shared)
- データベース: PostgreSQL + Prisma ORM
- API: Hono.js (REST)
- フロントエンド: Next.js 15 App Router + Tailwind CSS

## Preferences
- TypeScript strict mode を使用
- インポートは絶対パス (@/) を優先
- コンポーネントは関数コンポーネントのみ
- エラーハンドリングは AppError クラスを使用
- 日本語のコメント・コミットメッセージ

## Project Rules
- PRは1つの機能/修正に絞る
- 破壊的変更にはマイグレーションを含める
- 環境変数は .env.example に記載する
- API エンドポイントには認証ミドルウェアを使用する

## Architecture
- サービス層でビジネスロジックを管理
- ルート層はリクエスト/レスポンスの処理のみ
- 共有型は shared-types パッケージで定義
- バリデーションは zod-schemas パッケージで定義
`,
  },
  {
    id: 'team',
    name: 'チーム用 CLAUDE.md',
    description: 'チーム全員が参照する標準ルール集',
    type: 'claude_md',
    content: `# CLAUDE.md

## Memory
- チーム全員が Claude Code を使用しています
- コードレビューは必須です
- CI/CD: GitHub Actions

## Preferences
- ブランチ命名規則: feature/, fix/, chore/
- コミットメッセージ: Conventional Commits 形式
- テストカバレッジ: 80% 以上を維持
- ドキュメント: JSDoc コメントを必須にする

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
- ファイル名: kebab-case（コンポーネント以外）
`,
  },
];

export class PlaygroundService {
  async getSnippets(userId: string, type?: string) {
    const where: { userId: string; type?: string } = { userId };
    if (type) {
      where.type = type;
    }

    const snippets = await prisma.playgroundSnippet.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return snippets;
  }

  async createSnippet(userId: string, data: { title: string; type: string; content: string }) {
    const count = await prisma.playgroundSnippet.count({ where: { userId } });
    if (count >= MAX_SNIPPETS_PER_USER) {
      throw new AppError(400, `スニペットの上限（${MAX_SNIPPETS_PER_USER}件）に達しています`);
    }

    const snippet = await prisma.playgroundSnippet.create({
      data: {
        userId,
        title: data.title,
        type: data.type,
        content: data.content,
      },
      select: {
        id: true,
        title: true,
        type: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return snippet;
  }

  async deleteSnippet(userId: string, snippetId: string) {
    const snippet = await prisma.playgroundSnippet.findUnique({
      where: { id: snippetId },
      select: { userId: true },
    });

    if (!snippet) {
      throw new AppError(404, 'スニペットが見つかりません');
    }

    if (snippet.userId !== userId) {
      throw new AppError(403, 'このスニペットを削除する権限がありません');
    }

    await prisma.playgroundSnippet.delete({ where: { id: snippetId } });
  }

  getTemplates(): PlaygroundTemplate[] {
    return TEMPLATES;
  }
}
