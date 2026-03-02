import { z } from 'zod';

export const createSnippetSchema = z.object({
  title: z.string().min(1).max(100),
  type: z.enum(['terminal', 'claude_md', 'hook_config']),
  content: z.string().min(1).max(50000),
});
