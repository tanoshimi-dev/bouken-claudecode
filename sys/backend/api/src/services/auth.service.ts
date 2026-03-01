import { Google, GitHub, generateState, generateCodeVerifier } from 'arctic';
import { prisma } from '../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { AppError } from '../middleware/error-handler.js';
import { env } from '../lib/env.js';

const google = new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);
const github = new GitHub(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET, env.GITHUB_REDIRECT_URI);

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
