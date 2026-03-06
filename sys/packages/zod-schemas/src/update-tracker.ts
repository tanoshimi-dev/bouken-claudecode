import { z } from 'zod';

export const toolSlugSchema = z.enum(['claude-code', 'codex', 'github-copilot', 'gemini']);

export const createToolVersionSchema = z.object({
  toolSlug: toolSlugSchema,
  version: z.string().min(1),
  releaseDate: z.string().date(),
  summary: z.string().min(1).max(500),
  changes: z.array(
    z.object({
      type: z.enum(['new', 'changed', 'fixed', 'deprecated', 'removed']),
      description: z.string().min(1),
    }),
  ),
  breakingChanges: z.boolean().default(false),
  changelogUrl: z.string().url().optional(),
});

export const createImpactsSchema = z.object({
  impacts: z
    .array(
      z.object({
        moduleId: z.string().min(1),
        lessonId: z.string().min(1).optional(),
        impactDescription: z.string().optional(),
        priority: z.enum(['critical', 'high', 'normal', 'low']).default('normal'),
      }),
    )
    .min(1),
});

export const updateImpactStatusSchema = z.object({
  status: z.enum(['not_affected', 'pending', 'in_progress', 'updated']),
  notes: z.string().optional(),
});

export const updateToolContentVersionSchema = z.object({
  currentContentVersion: z.string().min(1),
});
