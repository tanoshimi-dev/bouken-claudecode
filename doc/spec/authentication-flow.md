# Authentication Flow Specification

## Overview

OAuth 2.0 based authentication system supporting 5 providers across web and mobile platforms. No email/password login - OAuth only.

## Supported Providers

| Provider  | PKCE | Notes |
|-----------|------|-------|
| Google    | Yes  | openid, profile, email scopes |
| GitHub    | No   | user:email scope |
| Microsoft | Yes  | Entra ID, openid/profile/email scopes |
| Apple     | No   | response_mode=form_post, name/email scopes |
| LINE      | Yes  | profile, openid, email scopes |

OAuth library: **Arctic**

## Token Strategy

| Token         | Algorithm | Expiry   | Storage (Web)           | Storage (Mobile)            |
|---------------|-----------|----------|-------------------------|-----------------------------|
| Access Token  | HS256     | 15 min   | httpOnly cookie          | Keychain (iOS) / SecureStore (Android) |
| Refresh Token | HS256     | 7 days   | httpOnly cookie (restricted path) | Keychain (iOS) / SecureStore (Android) |

### JWT Payload

```json
{
  "sub": "user_id",
  "email": "optional",
  "name": "user_name"
}
```

### Cookie Configuration

**access_token:**
- httpOnly: true, secure: true (production), sameSite: Lax
- maxAge: 900s, path: /

**refresh_token:**
- httpOnly: true, secure: true (production), sameSite: Lax
- maxAge: 604800s, path: /api/auth

## API Endpoints

| Method | Path                          | Auth Required | Description |
|--------|-------------------------------|---------------|-------------|
| GET    | /api/auth/:provider           | No  | Start OAuth flow (returns redirect URL) |
| GET    | /api/auth/:provider/callback  | No  | OAuth provider callback |
| POST   | /api/auth/apple/callback      | No  | Apple callback (form_post) |
| GET    | /api/auth/me                  | Yes | Get current user profile |
| POST   | /api/auth/refresh             | No  | Refresh access token |
| POST   | /api/auth/logout              | No  | Clear auth cookies |
| GET    | /api/auth/link/:provider      | Yes | Start provider linking flow |
| DELETE | /api/auth/link/:provider      | Yes | Unlink a provider |

## Database Schema

### User

| Column    | Type     | Notes |
|-----------|----------|-------|
| id        | String   | cuid, primary key |
| name      | String   | |
| email     | String?  | optional |
| avatarUrl | String?  | optional |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### OAuthAccount

| Column       | Type     | Notes |
|--------------|----------|-------|
| id           | String   | cuid, primary key |
| userId       | String   | FK -> User |
| provider     | String   | google, github, microsoft, apple, line |
| providerId   | String   | Provider's user ID |
| accessToken  | String?  | Provider's access token |
| refreshToken | String?  | Provider's refresh token |
| createdAt    | DateTime | |
| updatedAt    | DateTime | |

Unique constraint: `(provider, providerId)`
Cascade delete: OAuthAccount deleted when User is deleted.

## Authentication Flows

### Web Login Flow

```
User                 Frontend            Backend              Provider
 |                      |                    |                    |
 |-- Click provider --->|                    |                    |
 |                      |-- GET /auth/:p --->|                    |
 |                      |                    |-- Generate state --|
 |                      |                    |-- Generate PKCE ---|
 |                      |                    |-- Set cookies -----|
 |                      |<-- 302 redirect ---|                    |
 |                      |                    |                    |
 |<-- Redirect to provider auth page ------->|                    |
 |-- Authorize -------->|                    |                    |
 |                      |                    |<-- callback -------|
 |                      |                    |   (code + state)   |
 |                      |                    |                    |
 |                      |                    |-- Validate state --|
 |                      |                    |-- Exchange code ---|
 |                      |                    |-- Fetch user info -|
 |                      |                    |-- Upsert user -----|
 |                      |                    |-- Issue JWT -------|
 |                      |                    |-- Set cookies -----|
 |                      |<-- 302 /dashboard -|                    |
 |                      |                    |                    |
 |                      |-- GET /auth/me --->|                    |
 |                      |<-- UserProfile ----|                    |
 |<-- Dashboard --------|                    |                    |
```

### Mobile Login Flow

```
User                 Mobile App           Backend              Provider
 |                      |                    |                    |
 |-- Tap provider ----->|                    |                    |
 |                      |-- InAppBrowser --->|                    |
 |                      |   /auth/:p         |                    |
 |                      |   ?platform=mobile |                    |
 |                      |                    |-- Generate state --|
 |                      |                    |-- Set cookies -----|
 |                      |<-- 302 redirect ---|                    |
 |                      |                    |                    |
 |<-- Provider auth page in browser -------->|                    |
 |-- Authorize -------->|                    |                    |
 |                      |                    |<-- callback -------|
 |                      |                    |                    |
 |                      |                    |-- Detect mobile ---|
 |                      |                    |-- Issue JWT -------|
 |                      |<-- Deep link ------|                    |
 |                      |   scheme://auth/callback               |
 |                      |   ?access_token=...                    |
 |                      |   &refresh_token=...                   |
 |                      |                    |                    |
 |                      |-- Save to ---------|                    |
 |                      |   Keychain/Store   |                    |
 |                      |-- GET /auth/me --->|                    |
 |                      |   (Bearer token)   |                    |
 |                      |<-- UserProfile ----|                    |
 |<-- Home screen ------|                    |                    |
```

### Token Refresh Flow

**Web:** Automatic via httpOnly cookies. Backend reads `refresh_token` cookie on `/api/auth/refresh`.

**Mobile:**
1. API call returns 401
2. `useAuth` hook intercepts error
3. Calls `POST /api/auth/refresh` with `{ refresh_token }` in body
4. Backend validates refresh token, issues new token pair
5. Mobile saves new tokens to secure storage
6. Original request retried with new access token

### Provider Linking Flow

```
Authenticated User       Frontend            Backend
 |                          |                    |
 |-- Click "Link" --------->|                    |
 |                          |-- GET /auth/link/:p|
 |                          |   (with JWT)       |
 |                          |                    |-- Set link cookie
 |                          |                    |   (userId)
 |                          |<-- 302 to provider |
 |                          |                    |
 |  ... Standard OAuth flow ...                  |
 |                          |                    |
 |                          |                    |-- Detect link cookie
 |                          |                    |-- switchProvider()
 |                          |                    |-- Replace OAuth accounts
 |                          |<-- 302 /settings --|
```

Unlinking: `DELETE /api/auth/link/:provider` removes the OAuthAccount record.

## Auth Middleware

- Location: `backend/api/src/middleware/auth.ts`
- Checks `access_token` cookie OR `Authorization: Bearer` header
- Validates JWT signature and expiry
- Sets user context (`sub`, `email`, `name`) on request
- Returns 401 if invalid or expired

## Security Measures

| Measure           | Implementation |
|-------------------|----------------|
| CSRF Protection   | `state` parameter stored in cookie, validated on callback |
| PKCE              | `code_verifier` for Google, Microsoft, LINE |
| XSS Prevention    | httpOnly cookies (web), tokens inaccessible to JS |
| Secure Transport  | `secure: true` flag in production |
| SameSite          | Lax (None override for Apple form_post) |
| Cascade Delete    | OAuthAccounts removed when User is deleted |
| Unique Constraint | `(provider, providerId)` prevents duplicate accounts |

## Key Files

| File | Description |
|------|-------------|
| `backend/api/src/routes/auth.ts` | Auth route handlers |
| `backend/api/src/services/auth.service.ts` | OAuth logic, user upsert, token refresh |
| `backend/api/src/middleware/auth.ts` | JWT validation middleware |
| `backend/api/src/lib/jwt.ts` | JWT sign/verify utilities |
| `backend/api/src/lib/env.ts` | Environment config with Zod validation |
| `backend/api/prisma/schema.prisma` | User & OAuthAccount models |
| `frontend/user/web/src/components/auth/LoginForm.tsx` | Web login UI |
| `frontend/user/web/src/app/(auth)/callback/[provider]/page.tsx` | Web OAuth callback page |
| `frontend/user/web/src/store/authSlice.ts` | Web auth state (Redux) |
| `frontend/user/web/src/hooks/useAuth.ts` | Web auth hook |
| `frontend/user/web/src/components/auth/ProviderManager.tsx` | Provider link/unlink UI |
| `frontend/user/mobile/src/screens/auth/LoginScreen.tsx` | Mobile login UI |
| `frontend/user/mobile/src/services/auth.service.ts` | Mobile token management |
| `frontend/user/mobile/src/hooks/useAuth.ts` | Mobile auth hook with 401 retry |
| `packages/shared-types/src/user.ts` | Shared User/OAuthProvider types |
| `packages/api-client/src/client.ts` | Shared API client |

## Environment Variables

```
# JWT
JWT_SECRET

# Google
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

# GitHub
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI

# Microsoft
MICROSOFT_TENANT, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REDIRECT_URI

# Apple
APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY, APPLE_REDIRECT_URI

# LINE
LINE_CLIENT_ID, LINE_CLIENT_SECRET, LINE_REDIRECT_URI

# App
APP_URL, API_URL, MOBILE_SCHEME
```
