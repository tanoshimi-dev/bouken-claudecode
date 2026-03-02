export type SnippetType = 'terminal' | 'claude_md' | 'hook_config';

export interface PlaygroundSnippet {
  id: string;
  title: string;
  type: SnippetType;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSnippetInput {
  title: string;
  type: SnippetType;
  content: string;
}

export interface PlaygroundTemplate {
  id: string;
  name: string;
  description: string;
  type: SnippetType;
  content: string;
}
