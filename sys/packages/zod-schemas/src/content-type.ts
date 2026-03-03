import { z } from 'zod';

export const contentTypeSlugSchema = z.enum([
  'claudecode',
  'gemini',
  'githubcopilot',
  'codex',
]);

export type ContentTypeSlugZod = z.infer<typeof contentTypeSlugSchema>;
