import { createApiClient } from '@learn-claude-code/api-client';

// Direct API calls to the backend (Approach A)
export const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});
