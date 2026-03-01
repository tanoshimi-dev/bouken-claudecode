import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyAccessToken } from '../lib/jwt.js';
import { AppError } from './error-handler.js';

export interface AuthUser {
  id: string;
  email?: string;
  name: string;
}

export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, 'access_token') || extractBearerToken(c);

  if (!token) {
    throw new AppError(401, 'Authentication required');
  }

  try {
    const payload = await verifyAccessToken(token);
    c.set('user', {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    } satisfies AuthUser);
    await next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}

function extractBearerToken(c: Context): string | undefined {
  const header = c.req.header('Authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return undefined;
}
