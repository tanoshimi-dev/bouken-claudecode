import { Hono } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { authMiddleware } from '../middleware/auth.js';
import { AuthService } from '../services/auth.service.js';
import { AppError } from '../middleware/error-handler.js';
import { env } from '../lib/env.js';

export const authRoutes = new Hono();

const authService = new AuthService();

/** Cookie options shared across all auth cookies */
function cookieDefaults() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'Lax' as const,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

// --- Specific routes MUST come before /:provider wildcard ---

// Get current user
authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  const profile = await authService.getUserProfile(user.id);
  return c.json({ data: profile });
});

// Refresh token
authRoutes.post('/refresh', async (c) => {
  const refreshToken = getCookie(c, 'refresh_token');

  if (!refreshToken) {
    throw new AppError(401, 'Refresh token is required');
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refreshTokens(refreshToken);

  setCookie(c, 'access_token', accessToken, {
    ...cookieDefaults(),
    path: '/',
    maxAge: 60 * 15,
  });

  setCookie(c, 'refresh_token', newRefreshToken, {
    ...cookieDefaults(),
    path: '/api/auth',
    maxAge: 60 * 60 * 24 * 7,
  });

  return c.json({ message: 'Token refreshed' });
});

// Logout
authRoutes.post('/logout', async (c) => {
  deleteCookie(c, 'access_token', { path: '/' });
  deleteCookie(c, 'refresh_token', { path: '/api/auth' });
  return c.json({ message: 'Logged out' });
});

// Apple POST callback — Apple uses response_mode=form_post
authRoutes.post('/apple/callback', async (c) => {
  const body = await c.req.parseBody();
  const code = body['code'] as string | undefined;
  const stateParam = body['state'] as string | undefined;

  if (!code) {
    throw new AppError(400, 'Authorization code is required');
  }

  const storedState = getCookie(c, 'oauth_state');
  if (!storedState || storedState !== stateParam) {
    throw new AppError(400, 'Invalid OAuth state');
  }

  deleteCookie(c, 'oauth_state', { path: '/' });
  deleteCookie(c, 'oauth_code_verifier', { path: '/' });

  // Check if this is a linking flow
  const linkUserId = getCookie(c, 'oauth_link_user');
  if (linkUserId) {
    deleteCookie(c, 'oauth_link_user', { path: '/' });
    await authService.linkProvider(linkUserId, 'apple', code);
    return c.redirect(`${env.APP_URL}/profile/settings`);
  }

  const { accessToken, refreshToken } = await authService.handleCallback('apple', code);

  setCookie(c, 'access_token', accessToken, {
    ...cookieDefaults(),
    path: '/',
    maxAge: 60 * 15,
  });

  setCookie(c, 'refresh_token', refreshToken, {
    ...cookieDefaults(),
    path: '/api/auth',
    maxAge: 60 * 60 * 24 * 7,
  });

  return c.redirect(`${env.APP_URL}/dashboard`);
});

// Link provider — Auth required; redirects to provider OAuth with link cookie
authRoutes.get('/link/:provider', authMiddleware, async (c) => {
  const provider = c.req.param('provider');
  const user = c.get('user');

  const { url, state, codeVerifier } = authService.createAuthorizationUrl(provider);

  const cookieOptions = {
    ...cookieDefaults(),
    path: '/',
    maxAge: 60 * 10,
  };

  setCookie(c, 'oauth_state', state, cookieOptions);
  setCookie(c, 'oauth_link_user', user.id, cookieOptions);

  if (codeVerifier) {
    setCookie(c, 'oauth_code_verifier', codeVerifier, cookieOptions);
  }

  return c.redirect(url);
});

// Unlink provider — Auth required
authRoutes.delete('/link/:provider', authMiddleware, async (c) => {
  const provider = c.req.param('provider');
  const user = c.get('user');

  await authService.unlinkProvider(user.id, provider);
  return c.json({ data: { message: 'Provider unlinked successfully' } });
});

// --- Wildcard OAuth routes ---

// OAuth start — generate state/verifier, store in cookies, redirect to provider
authRoutes.get('/:provider', async (c) => {
  const provider = c.req.param('provider');
  const { url, state, codeVerifier } = authService.createAuthorizationUrl(provider);

  const cookieOptions = {
    ...cookieDefaults(),
    path: '/',
    maxAge: 60 * 10,
  };

  setCookie(c, 'oauth_state', state, cookieOptions);

  if (codeVerifier) {
    setCookie(c, 'oauth_code_verifier', codeVerifier, cookieOptions);
  }

  return c.redirect(url);
});

// OAuth callback — verify state, exchange code for JWT (or link if cookie present)
authRoutes.get('/:provider/callback', async (c) => {
  const provider = c.req.param('provider');
  const code = c.req.query('code');
  const stateParam = c.req.query('state');

  if (!code) {
    throw new AppError(400, 'Authorization code is required');
  }

  const storedState = getCookie(c, 'oauth_state');
  if (!storedState || storedState !== stateParam) {
    throw new AppError(400, 'Invalid OAuth state');
  }

  const codeVerifier = getCookie(c, 'oauth_code_verifier') ?? undefined;

  deleteCookie(c, 'oauth_state', { path: '/' });
  deleteCookie(c, 'oauth_code_verifier', { path: '/' });

  // Check if this is a linking flow
  const linkUserId = getCookie(c, 'oauth_link_user');
  if (linkUserId) {
    deleteCookie(c, 'oauth_link_user', { path: '/' });
    await authService.linkProvider(linkUserId, provider, code, codeVerifier);
    return c.redirect(`${env.APP_URL}/profile/settings`);
  }

  const { accessToken, refreshToken } = await authService.handleCallback(
    provider,
    code,
    codeVerifier,
  );

  setCookie(c, 'access_token', accessToken, {
    ...cookieDefaults(),
    path: '/',
    maxAge: 60 * 15,
  });

  setCookie(c, 'refresh_token', refreshToken, {
    ...cookieDefaults(),
    path: '/api/auth',
    maxAge: 60 * 60 * 24 * 7,
  });

  return c.redirect(`${env.APP_URL}/dashboard`);
});
