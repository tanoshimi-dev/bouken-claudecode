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
  FreshnessSummary,
  ToolDetail,
  ToolVersionDetail,
  RecentUpdate,
  VersionCheckResult,
  AdminModuleLesson,
  PendingImpactItem,
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

  // Update Tracker
  async getUpdatesSummary(): Promise<ApiResponse<FreshnessSummary>> {
    return this.request('/api/updates/summary');
  }

  async getRecentUpdates(limit?: number): Promise<ApiResponse<RecentUpdate[]>> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/api/updates/recent${query}`);
  }

  async getToolDetail(toolSlug: string): Promise<ApiResponse<ToolDetail>> {
    return this.request(`/api/updates/${encodeURIComponent(toolSlug)}`);
  }

  async getVersionDetail(toolSlug: string, versionId: string): Promise<ApiResponse<ToolVersionDetail>> {
    return this.request(`/api/updates/${encodeURIComponent(toolSlug)}/versions/${versionId}`);
  }

  // Update Tracker Admin
  async getAdminModules(): Promise<ApiResponse<AdminModuleLesson[]>> {
    return this.request('/api/admin/updates/modules');
  }

  async getAdminPendingQueue(): Promise<ApiResponse<PendingImpactItem[]>> {
    return this.request('/api/admin/updates/queue');
  }

  async createToolVersion(body: {
    toolSlug: string;
    version: string;
    releaseDate: string;
    summary: string;
    changes: { type: string; description: string }[];
    breakingChanges: boolean;
    changelogUrl?: string;
  }): Promise<ApiResponse<unknown>> {
    return this.request('/api/admin/updates/versions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async createVersionImpacts(
    versionId: string,
    body: {
      impacts: {
        moduleId: string;
        lessonId?: string;
        impactDescription?: string;
        priority: string;
      }[];
    },
  ): Promise<ApiResponse<{ count: number }>> {
    return this.request(`/api/admin/updates/versions/${versionId}/impacts`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateImpactStatus(
    impactId: string,
    body: { status: string; notes?: string },
  ): Promise<ApiResponse<unknown>> {
    return this.request(`/api/admin/updates/impacts/${impactId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async updateToolContentVersion(
    toolSlug: string,
    body: { currentContentVersion: string },
  ): Promise<ApiResponse<unknown>> {
    return this.request(`/api/admin/updates/tools/${encodeURIComponent(toolSlug)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async triggerVersionCheck(): Promise<ApiResponse<{ results: VersionCheckResult[] }>> {
    return this.request('/api/admin/updates/check', { method: 'POST' });
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
