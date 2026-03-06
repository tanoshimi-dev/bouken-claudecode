// Update Tracker Seeder — initializes tool tracking configuration.
//
// Usage: npx tsx scripts/seed-update-tracker.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TOOL_CONFIGS = [
  {
    toolSlug: 'claude-code',
    displayName: 'Claude Code',
    currentContentVersion: '1.0.28',
    checkSourceType: 'npm',
    checkSourceIdentifier: '@anthropic-ai/claude-code',
    changelogUrl: 'https://docs.anthropic.com/en/docs/claude-code/changelog',
    documentationUrl: 'https://docs.anthropic.com/en/docs/claude-code',
  },
  {
    toolSlug: 'codex',
    displayName: 'Codex CLI',
    currentContentVersion: '0.1.0',
    checkSourceType: 'github_release',
    checkSourceIdentifier: 'openai/codex',
    changelogUrl: 'https://github.com/openai/codex/releases',
    documentationUrl: 'https://github.com/openai/codex',
  },
  {
    toolSlug: 'github-copilot',
    displayName: 'GitHub Copilot',
    currentContentVersion: '2026-02',
    checkSourceType: 'rss',
    checkSourceIdentifier: 'https://github.blog/changelog/label/copilot/feed/',
    changelogUrl:
      'https://docs.github.com/en/copilot/about-github-copilot/whats-new-in-github-copilot',
    documentationUrl: 'https://docs.github.com/en/copilot',
  },
  {
    toolSlug: 'gemini',
    displayName: 'Gemini CLI',
    currentContentVersion: '0.1.0',
    checkSourceType: 'npm',
    checkSourceIdentifier: '@anthropic-ai/claude-code', // TODO: replace with actual Gemini CLI package
    changelogUrl: 'https://ai.google.dev/gemini-api/docs',
    documentationUrl: 'https://ai.google.dev/gemini-api/docs',
  },
];

async function seedToolTracking() {
  console.log('Seeding Update Tracker tool configs...');

  for (const config of TOOL_CONFIGS) {
    await prisma.toolTrackingConfig.upsert({
      where: { toolSlug: config.toolSlug },
      update: config,
      create: config,
    });
    console.log(`  ✓ ${config.displayName} (${config.toolSlug})`);
  }

  console.log(`Done! ${TOOL_CONFIGS.length} tool configs seeded.`);
}

seedToolTracking()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
