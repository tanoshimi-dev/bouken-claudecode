import type { ContentTypeSlug } from './content-type';

export interface Module {
  id: string;
  contentType: ContentTypeSlug;
  number: number;
  title: string;
  description: string;
  estimatedMinutes: number;
}

export interface ModuleWithProgress extends Module {
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

export interface Lesson {
  id: string;
  order: number;
  title: string;
  lessonType: 'tutorial' | 'exercise' | 'sandbox';
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface ModuleDetail extends Module {
  lessons: Lesson[];
  quizzes: { id: string; title: string; difficulty: 'easy' | 'medium' | 'hard'; points: number }[];
}

export interface LessonDetail {
  id: string;
  order: number;
  title: string;
  contentMd: string;
  lessonType: 'tutorial' | 'exercise' | 'sandbox';
  module: { id: string; number: number; title: string; contentType: ContentTypeSlug };
  status: 'not_started' | 'in_progress' | 'completed';
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
}
