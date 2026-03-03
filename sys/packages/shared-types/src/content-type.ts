export const CONTENT_TYPES = {
  claudecode: {
    slug: 'claudecode',
    name: 'Claude Code',
    nameJa: 'Claude Code',
    icon: '🤖',
    color: '#D97706',
    description: 'Anthropic の AI コーディングアシスタント',
  },
  gemini: {
    slug: 'gemini',
    name: 'Gemini CLI',
    nameJa: 'Gemini CLI',
    icon: '💎',
    color: '#4285F4',
    description: 'Google の AI コーディングアシスタント',
  },
  githubcopilot: {
    slug: 'githubcopilot',
    name: 'GitHub Copilot',
    nameJa: 'GitHub Copilot',
    icon: '🐙',
    color: '#238636',
    description: 'GitHub の AI ペアプログラミングツール',
  },
  codex: {
    slug: 'codex',
    name: 'Codex CLI',
    nameJa: 'Codex CLI',
    icon: '🧩',
    color: '#10A37F',
    description: 'OpenAI の AI コーディングエージェント',
  },
} as const;

export type ContentTypeSlug = keyof typeof CONTENT_TYPES;

export interface ContentTypeInfo {
  slug: string;
  name: string;
  nameJa: string;
  icon: string;
  color: string;
  description: string;
}

export interface ContentTypeWithCount extends ContentTypeInfo {
  moduleCount: number;
  hasContent: boolean;
}

export function isValidContentType(slug: string): slug is ContentTypeSlug {
  return slug in CONTENT_TYPES;
}
