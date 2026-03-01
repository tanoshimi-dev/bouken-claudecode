/**
 * Content Seeder — imports educational content from doc/contents/ into the database.
 *
 * Usage: npx tsx scripts/seed-content.ts
 *
 * Reads:
 *   - doc/contents/module-XX-*/README.md  → modules table
 *   - doc/contents/module-XX-*/lesson-*.md → lessons table
 *   - doc/contents/module-XX-*/quiz.json   → quizzes + quiz_questions tables
 *
 * Uses Prisma upsert for idempotent execution.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';

const prisma = new PrismaClient();
const CONTENTS_DIR = path.resolve(import.meta.dirname, '../../doc/contents');

interface ModuleMeta {
  number: number;
  title: string;
  description: string;
  estimatedMinutes: number;
}

interface QuizData {
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  questions: {
    questionType: string;
    questionText: string;
    codeSnippet?: string;
    options: unknown;
    correctAnswer: unknown;
    explanation: string;
  }[];
}

function parseModuleReadme(content: string): ModuleMeta {
  const lines = content.split('\n');
  const title = lines.find((l) => l.startsWith('# '))?.replace('# ', '').trim() ?? 'Untitled';

  // Parse YAML-like frontmatter between ---
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  let number = 0;
  let description = '';
  let estimatedMinutes = 15;

  if (frontmatterMatch) {
    const fm = frontmatterMatch[1];
    const numberMatch = fm.match(/number:\s*(\d+)/);
    const descMatch = fm.match(/description:\s*(.+)/);
    const timeMatch = fm.match(/estimatedMinutes:\s*(\d+)/);

    if (numberMatch) number = parseInt(numberMatch[1], 10);
    if (descMatch) description = descMatch[1].trim();
    if (timeMatch) estimatedMinutes = parseInt(timeMatch[1], 10);
  }

  return { number, title, description, estimatedMinutes };
}

async function seedModule(moduleDir: string) {
  const readmePath = path.join(moduleDir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    console.warn(`  Skipping ${moduleDir}: no README.md`);
    return;
  }

  const readmeContent = fs.readFileSync(readmePath, 'utf-8');
  const meta = parseModuleReadme(readmeContent);

  console.log(`  Module ${meta.number}: ${meta.title}`);

  // Upsert module
  const module = await prisma.module.upsert({
    where: { number: meta.number },
    update: {
      title: meta.title,
      description: meta.description,
      estimatedMinutes: meta.estimatedMinutes,
      isPublished: true,
    },
    create: {
      number: meta.number,
      title: meta.title,
      description: meta.description,
      estimatedMinutes: meta.estimatedMinutes,
      isPublished: true,
    },
  });

  // Import lessons
  const lessonFiles = fs
    .readdirSync(moduleDir)
    .filter((f) => f.startsWith('lesson-') && f.endsWith('.md'))
    .sort();

  for (let i = 0; i < lessonFiles.length; i++) {
    const lessonPath = path.join(moduleDir, lessonFiles[i]);
    const content = fs.readFileSync(lessonPath, 'utf-8');
    const titleMatch = content.match(/^# (.+)/m);
    const title = titleMatch?.[1] ?? lessonFiles[i].replace('.md', '');
    const order = i + 1;

    await prisma.lesson.upsert({
      where: { moduleId_order: { moduleId: module.id, order } },
      update: { title, contentMd: content, isPublished: true },
      create: {
        moduleId: module.id,
        order,
        title,
        contentMd: content,
        lessonType: 'tutorial',
        isPublished: true,
      },
    });

    console.log(`    Lesson ${order}: ${title}`);
  }

  // Import quiz
  const quizPath = path.join(moduleDir, 'quiz.json');
  if (fs.existsSync(quizPath)) {
    const quizData: QuizData = JSON.parse(fs.readFileSync(quizPath, 'utf-8'));

    const quiz = await prisma.quiz.upsert({
      where: { id: `quiz-module-${meta.number}` },
      update: {
        title: quizData.title,
        difficulty: quizData.difficulty,
        points: quizData.points,
      },
      create: {
        id: `quiz-module-${meta.number}`,
        moduleId: module.id,
        title: quizData.title,
        difficulty: quizData.difficulty,
        points: quizData.points,
      },
    });

    // Delete existing questions and re-create
    await prisma.quizQuestion.deleteMany({ where: { quizId: quiz.id } });

    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          questionType: q.questionType,
          questionText: q.questionText,
          codeSnippet: q.codeSnippet ?? null,
          options: q.options as never,
          correctAnswer: q.correctAnswer as never,
          explanation: q.explanation,
          order: i + 1,
        },
      });
    }

    console.log(`    Quiz: ${quizData.title} (${quizData.questions.length} questions)`);
  }
}

async function main() {
  console.log('Content Seeder starting...');
  console.log(`Reading from: ${CONTENTS_DIR}`);

  if (!fs.existsSync(CONTENTS_DIR)) {
    console.log('Contents directory does not exist yet. Creating...');
    fs.mkdirSync(CONTENTS_DIR, { recursive: true });
    console.log('Done. Add content files and run again.');
    return;
  }

  const moduleDirs = fs
    .readdirSync(CONTENTS_DIR)
    .filter((d) => d.startsWith('module-'))
    .sort()
    .map((d) => path.join(CONTENTS_DIR, d));

  if (moduleDirs.length === 0) {
    console.log('No module directories found. Add module-XX-* directories to doc/contents/');
    return;
  }

  for (const dir of moduleDirs) {
    await seedModule(dir);
  }

  console.log('\nContent seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
