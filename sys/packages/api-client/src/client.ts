import type {
  ApiResponse,
  UserProfile,
  ModuleWithProgress,
  ModuleDetail,
  LessonDetail,
  QuizDetail,
  QuizResult,
  OverallProgress,
  StreakInfo,
  PlaygroundSnippet,
  CreateSnippetInput,
  PlaygroundTemplate,
  UserAchievement,
  AchievementProgress,
  ContentTypeWithCount,
} from '@learn-ai/shared-types';

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null;
}

export class ApiClient {
  private baseUrl: string;
  private getAccessToken: () => string | null;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.getAccessToken = config.getAccessToken ?? (() => null);
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) ?? {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new ApiError(res.status, (body as { error?: string }).error ?? 'Request failed');
    }

    return res.json() as Promise<T>;
  }

  // Auth
  async getMe(): Promise<ApiResponse<UserProfile>> {
    return this.request('/api/auth/me');
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', { method: 'POST' });
  }

  async unlinkProvider(provider: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/auth/link/${provider}`, { method: 'DELETE' });
  }

  // Content Types
  async getContentTypes(): Promise<ApiResponse<ContentTypeWithCount[]>> {
    return this.request('/api/content-types');
  }

  // Modules
  async getModules(contentType?: string): Promise<ApiResponse<ModuleWithProgress[]>> {
    const query = contentType ? `?contentType=${encodeURIComponent(contentType)}` : '';
    return this.request(`/api/modules${query}`);
  }

  async getModule(moduleId: string): Promise<ApiResponse<ModuleDetail>> {
    return this.request(`/api/modules/${moduleId}`);
  }

  async getLesson(moduleId: string, lessonId: string): Promise<ApiResponse<LessonDetail>> {
    return this.request(`/api/modules/${moduleId}/lessons/${lessonId}`);
  }

  // Quizzes
  async getQuiz(quizId: string): Promise<ApiResponse<QuizDetail>> {
    return this.request(`/api/quizzes/${quizId}`);
  }

  async submitQuiz(
    quizId: string,
    body: { answers: { questionId: string; answer: unknown }[]; timeSpentSeconds: number },
  ): Promise<ApiResponse<QuizResult>> {
    return this.request(`/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Progress
  async getProgress(contentType?: string): Promise<ApiResponse<OverallProgress>> {
    const query = contentType ? `?contentType=${encodeURIComponent(contentType)}` : '';
    return this.request(`/api/progress${query}`);
  }

  async completeLesson(lessonId: string): Promise<ApiResponse<unknown>> {
    return this.request(`/api/progress/lessons/${lessonId}`, { method: 'POST' });
  }

  async getStreaks(): Promise<ApiResponse<StreakInfo>> {
    return this.request('/api/progress/streaks');
  }

  // Playground
  async getSnippets(type?: string): Promise<ApiResponse<PlaygroundSnippet[]>> {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    return this.request(`/api/playground/snippets${query}`);
  }

  async createSnippet(body: CreateSnippetInput): Promise<ApiResponse<PlaygroundSnippet>> {
    return this.request('/api/playground/snippets', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async deleteSnippet(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/playground/snippets/${id}`, { method: 'DELETE' });
  }

  async getPlaygroundTemplates(): Promise<ApiResponse<PlaygroundTemplate[]>> {
    return this.request('/api/playground/templates');
  }

  // Achievements
  async getAchievements(): Promise<ApiResponse<UserAchievement[]>> {
    return this.request('/api/achievements');
  }

  async getAchievementProgress(): Promise<ApiResponse<AchievementProgress[]>> {
    return this.request('/api/achievements/progress');
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
