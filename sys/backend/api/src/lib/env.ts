import { z } from 'zod';

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // OAuth - Google
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:4000/api/auth/google/callback'),

  // OAuth - GitHub
  GITHUB_CLIENT_ID: z.string().default(''),
  GITHUB_CLIENT_SECRET: z.string().default(''),
  GITHUB_REDIRECT_URI: z.string().default('http://localhost:4000/api/auth/github/callback'),

  // OAuth - Microsoft
  MICROSOFT_TENANT: z.string().default('common'),
  MICROSOFT_CLIENT_ID: z.string().default(''),
  MICROSOFT_CLIENT_SECRET: z.string().default(''),
  MICROSOFT_REDIRECT_URI: z.string().default('http://localhost:4000/api/auth/microsoft/callback'),

  // OAuth - Apple
  APPLE_CLIENT_ID: z.string().default(''),
  APPLE_TEAM_ID: z.string().default(''),
  APPLE_KEY_ID: z.string().default(''),
  APPLE_PRIVATE_KEY: z.string().default(''),
  APPLE_REDIRECT_URI: z.string().default('http://localhost:4000/api/auth/apple/callback'),

  // OAuth - LINE
  LINE_CLIENT_ID: z.string().default(''),
  LINE_CLIENT_SECRET: z.string().default(''),
  LINE_REDIRECT_URI: z.string().default('http://localhost:4000/api/auth/line/callback'),

  // App
  APP_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:4000'),

  // Mobile
  MOBILE_SCHEME: z.string().default('learnclaudecode'),

  // Cookie
  COOKIE_DOMAIN: z.string().optional(), // e.g. '.ai.bouken.app' for production
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
