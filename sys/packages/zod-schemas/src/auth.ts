import { z } from 'zod';

export const oauthProviderSchema = z.enum(['google', 'github', 'microsoft', 'apple', 'line']);
