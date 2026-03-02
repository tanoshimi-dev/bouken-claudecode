import {
  Google,
  GitHub,
  MicrosoftEntraId,
  Apple,
  Line,
  generateState,
  generateCodeVerifier,
  decodeIdToken,
} from 'arctic';
import { prisma } from '../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { AppError } from '../middleware/error-handler.js';
import { env } from '../lib/env.js';

const google = new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);
const github = new GitHub(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET, env.GITHUB_REDIRECT_URI);

// Conditionally initialize providers (only if credentials configured)
const microsoft =
  env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET
    ? new MicrosoftEntraId(
        env.MICROSOFT_TENANT,
        env.MICROSOFT_CLIENT_ID,
        env.MICROSOFT_CLIENT_SECRET,
        env.MICROSOFT_REDIRECT_URI,
      )
    : null;

const apple =
  env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY
    ? new Apple(
        env.APPLE_CLIENT_ID,
        env.APPLE_TEAM_ID,
        env.APPLE_KEY_ID,
        new TextEncoder().encode(env.APPLE_PRIVATE_KEY),
        env.APPLE_REDIRECT_URI,
      )
    : null;

const line =
  env.LINE_CLIENT_ID && env.LINE_CLIENT_SECRET
    ? new Line(env.LINE_CLIENT_ID, env.LINE_CLIENT_SECRET, env.LINE_REDIRECT_URI)
    : null;

interface OAuthUserInfo {
  providerId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

interface AuthorizationResult {
  url: string;
  state: string;
  codeVerifier?: string;
}

export class AuthService {
  createAuthorizationUrl(provider: string): AuthorizationResult {
    const state = generateState();

    switch (provider) {
      case 'google': {
        const codeVerifier = generateCodeVerifier();
        const url = google.createAuthorizationURL(state, codeVerifier, [
          'openid',
          'profile',
          'email',
        ]);
        return { url: url.toString(), state, codeVerifier };
      }
      case 'github': {
        const url = github.createAuthorizationURL(state, ['user:email']);
        return { url: url.toString(), state };
      }
      case 'microsoft': {
        if (!microsoft) throw new AppError(400, 'Microsoft OAuth is not configured');
        const codeVerifier = generateCodeVerifier();
        const url = microsoft.createAuthorizationURL(state, codeVerifier, [
          'openid',
          'profile',
          'email',
        ]);
        return { url: url.toString(), state, codeVerifier };
      }
      case 'apple': {
        if (!apple) throw new AppError(400, 'Apple OAuth is not configured');
        const url = apple.createAuthorizationURL(state, ['name', 'email']);
        // Apple uses response_mode=form_post; append it to the URL
        const appleUrl = new URL(url.toString());
        appleUrl.searchParams.set('response_mode', 'form_post');
        return { url: appleUrl.toString(), state };
      }
      case 'line': {
        if (!line) throw new AppError(400, 'LINE OAuth is not configured');
        const codeVerifier = generateCodeVerifier();
        const url = line.createAuthorizationURL(state, codeVerifier, [
          'profile',
          'openid',
          'email',
        ]);
        return { url: url.toString(), state, codeVerifier };
      }
      default:
        throw new AppError(400, `Unsupported provider: ${provider}`);
    }
  }

  async handleCallback(
    provider: string,
    code: string,
    codeVerifier?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const userInfo = await this.getProviderUserInfo(provider, code, codeVerifier);
    const user = await this.upsertUser(provider, userInfo);

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email ?? undefined,
      name: user.name,
    });

    const refreshToken = await signRefreshToken({
      sub: user.id,
      email: user.email ?? undefined,
      name: user.name,
    });

    return { accessToken, refreshToken };
  }

  async linkProvider(
    userId: string,
    provider: string,
    code: string,
    codeVerifier?: string,
  ): Promise<void> {
    const userInfo = await this.getProviderUserInfo(provider, code, codeVerifier);

    // Check if this provider account is already linked to another user
    const existingAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: { provider, providerId: userInfo.providerId },
      },
    });

    if (existingAccount) {
      if (existingAccount.userId === userId) {
        throw new AppError(400, 'This provider is already linked to your account');
      }
      throw new AppError(409, 'This provider account is already linked to another user');
    }

    await prisma.oAuthAccount.create({
      data: {
        provider,
        providerId: userInfo.providerId,
        userId,
      },
    });
  }

  async unlinkProvider(userId: string, provider: string): Promise<void> {
    // Ensure the user has more than 1 provider linked
    const accounts = await prisma.oAuthAccount.findMany({
      where: { userId },
    });

    if (accounts.length <= 1) {
      throw new AppError(400, 'Cannot unlink the last provider. At least one provider must remain.');
    }

    const account = accounts.find((a) => a.provider === provider);
    if (!account) {
      throw new AppError(404, 'Provider not linked to this account');
    }

    await prisma.oAuthAccount.delete({
      where: { id: account.id },
    });
  }

  private async getProviderUserInfo(
    provider: string,
    code: string,
    codeVerifier?: string,
  ): Promise<OAuthUserInfo> {
    switch (provider) {
      case 'google':
        if (!codeVerifier) throw new AppError(400, 'Code verifier is required for Google');
        return this.getGoogleUserInfo(code, codeVerifier);
      case 'github':
        return this.getGitHubUserInfo(code);
      case 'microsoft':
        if (!codeVerifier) throw new AppError(400, 'Code verifier is required for Microsoft');
        return this.getMicrosoftUserInfo(code, codeVerifier);
      case 'apple':
        return this.getAppleUserInfo(code);
      case 'line':
        if (!codeVerifier) throw new AppError(400, 'Code verifier is required for LINE');
        return this.getLineUserInfo(code, codeVerifier);
      default:
        throw new AppError(400, `Unsupported provider: ${provider}`);
    }
  }

  private async getGoogleUserInfo(code: string, codeVerifier: string): Promise<OAuthUserInfo> {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();

    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as {
      id: string;
      name: string;
      email?: string;
      picture?: string;
    };

    return {
      providerId: data.id,
      name: data.name,
      email: data.email,
      avatarUrl: data.picture,
    };
  }

  private async getGitHubUserInfo(code: string): Promise<OAuthUserInfo> {
    const tokens = await github.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as {
      id: number;
      login: string;
      name?: string;
      email?: string;
      avatar_url?: string;
    };

    return {
      providerId: String(data.id),
      name: data.name || data.login,
      email: data.email ?? undefined,
      avatarUrl: data.avatar_url,
    };
  }

  private async getMicrosoftUserInfo(
    code: string,
    codeVerifier: string,
  ): Promise<OAuthUserInfo> {
    if (!microsoft) throw new AppError(400, 'Microsoft OAuth is not configured');
    const tokens = await microsoft.validateAuthorizationCode(code, codeVerifier);

    // Use ID token claims as primary source (always available for openid scope)
    const idToken = tokens.idToken();
    const claims = decodeIdToken(idToken) as {
      sub: string;
      name?: string;
      preferred_username?: string;
      email?: string;
    };

    // Fallback to Graph API for additional profile data
    let displayName = claims.name;
    let email = claims.email || claims.preferred_username;
    try {
      const accessToken = tokens.accessToken();
      const res = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          displayName?: string;
          mail?: string;
          userPrincipalName?: string;
        };
        displayName = displayName || data.displayName;
        email = email || data.mail || data.userPrincipalName;
      }
    } catch {
      // Graph API may fail for consumer accounts without User.Read; ID token is enough
    }

    return {
      providerId: claims.sub,
      name: displayName || email || 'Microsoft User',
      email,
    };
  }

  private async getAppleUserInfo(code: string): Promise<OAuthUserInfo> {
    if (!apple) throw new AppError(400, 'Apple OAuth is not configured');
    const tokens = await apple.validateAuthorizationCode(code);
    const idToken = tokens.idToken();
    const claims = decodeIdToken(idToken) as {
      sub: string;
      email?: string;
    };

    return {
      providerId: claims.sub,
      name: claims.email?.split('@')[0] ?? 'Apple User',
      email: claims.email,
    };
  }

  private async getLineUserInfo(code: string, codeVerifier: string): Promise<OAuthUserInfo> {
    if (!line) throw new AppError(400, 'LINE OAuth is not configured');
    const tokens = await line.validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();

    // Get profile from LINE Profile API
    const res = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as {
      userId: string;
      displayName: string;
      pictureUrl?: string;
    };

    // Extract email from ID token if available
    let email: string | undefined;
    try {
      const idToken = tokens.idToken();
      const claims = decodeIdToken(idToken) as { email?: string };
      email = claims.email;
    } catch {
      // ID token may not contain email
    }

    return {
      providerId: data.userId,
      name: data.displayName,
      email,
      avatarUrl: data.pictureUrl,
    };
  }

  private async upsertUser(provider: string, info: OAuthUserInfo) {
    const existingAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: { provider, providerId: info.providerId },
      },
      include: { user: true },
    });

    if (existingAccount) {
      return existingAccount.user;
    }

    return prisma.user.create({
      data: {
        name: info.name,
        email: info.email,
        avatarUrl: info.avatarUrl,
        oauthAccounts: {
          create: {
            provider,
            providerId: info.providerId,
          },
        },
      },
    });
  }

  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        oauthAccounts: { select: { provider: true, createdAt: true } },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      providers: user.oauthAccounts.map((a) => a.provider),
      linkedAccounts: user.oauthAccounts.map((a) => ({
        provider: a.provider,
        linkedAt: a.createdAt.toISOString(),
      })),
      createdAt: user.createdAt,
    };
  }

  async refreshTokens(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = await verifyRefreshToken(token);

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new AppError(401, 'User not found');
    }

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email ?? undefined,
      name: user.name,
    });

    const refreshToken = await signRefreshToken({
      sub: user.id,
      email: user.email ?? undefined,
      name: user.name,
    });

    return { accessToken, refreshToken };
  }
}
