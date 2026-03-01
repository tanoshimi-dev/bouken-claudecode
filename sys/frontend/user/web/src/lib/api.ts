import { createApiClient } from '@learn-claude-code/api-client';

// Use same origin — Next.js rewrites /api/* to the backend
export const apiClient = createApiClient({
  baseUrl: '',
});
