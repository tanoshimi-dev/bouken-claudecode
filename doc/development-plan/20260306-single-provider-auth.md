# Single Provider Authentication - Development Plan

## Overview

Change the authentication system from allowing multiple linked providers to a **single provider per user** policy. Users must disconnect their current provider before switching to a different one. Also fix the existing unlink button bug that prevents provider management from working.

## Current State

- Users can link multiple OAuth providers (Google, GitHub, Microsoft, Apple, LINE) simultaneously
- `ProviderManager` allows linking additional providers while keeping existing ones
- `unlinkProvider()` prevents unlinking the last provider (at least one must remain)
- `linkProvider()` adds a new `OAuthAccount` record for additional providers
- Login via `upsertUser()` creates a new user if the provider account doesn't exist, or returns existing user
- **Unlink button is broken** on both web and mobile (see Phase 1 for details)

### Problems

1. **Multi-provider error:** When a user has multiple providers linked, "another provider selected" errors occur. The multi-provider linking model adds complexity without clear benefit.
2. **Unlink button broken (Web):** Cross-origin `DELETE` request fails because `httpOnly` + `sameSite: 'Lax'` cookies are not sent on non-GET cross-origin fetches.
3. **Unlink button broken (Mobile):** Client-side guard blocks unlink when only 1 provider exists; no state refresh after unlink.

## Target State

- Each user has exactly **one** OAuth provider linked at any time
- To switch providers: disconnect current provider -> log in with new provider
- The settings UI clearly communicates the single-provider policy
- Login flow handles the case where a provider account maps to an existing user correctly
- Unlink/disconnect works correctly on both web and mobile

---

## Phase Summary

| Phase | Focus | Status | Summary |
|-------|-------|--------|---------|
| **1** | Bug Fix (Prerequisite) | Done | Fix unlink button: Next.js API proxy for cross-origin cookie issue, remove mobile guard, logout on unlink |
| **2** | Backend Policy | Done | Remove `linkProvider()`, add `switchProvider()`, relax `unlinkProvider()`, routes updated |
| **3** | Frontend Web UI | Done | Single-provider UI: unlink with confirm + logout, other providers disabled |
| **4** | Frontend Mobile UI | Done | Same pattern: unlink clears tokens + clearUser(), other providers disabled |
| **5** | Data Migration | Not started | Clean up multi-provider users, add `@unique` DB constraint |

---

## Implementation Plan

### Phase 1: Fix Unlink Button (Bug Fix - Prerequisite)

The unlink button must work before implementing the single-provider policy, since "disconnect then reconnect" is the core flow.

#### 1.1 Fix Web: Cookie not sent with cross-origin DELETE

**Root Cause:**
The `access_token` cookie is set with `httpOnly: true` + `sameSite: 'Lax'` (`sys/backend/api/src/routes/auth.ts:15-21`). The web `apiClient` (`sys/frontend/user/web/src/lib/api.ts`) has no `getAccessToken` function, so it relies entirely on cookies via `credentials: 'include'`.

The frontend (`localhost:3000`) and API (`localhost:4000`) are different origins. `sameSite: 'Lax'` only sends cookies on top-level navigations (GET redirects), **not** on cross-origin `fetch()` with `DELETE`/`POST`/`PUT` methods. The `authMiddleware` never receives the token -> returns `401`.

In production, if both share a parent domain (e.g., `app.bouken.app` + `api.bouken.app` with `COOKIE_DOMAIN=.bouken.app`), they are same-site and `Lax` works. The bug manifests in **local development** and any deployment where API/frontend are on different sites.

**Fix: Next.js API proxy route (Recommended)**

Create a proxy route so API requests stay same-origin. The Next.js server-side handler forwards cookies naturally.

**File (create):** `sys/frontend/user/web/src/app/api/auth/link/[provider]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { provider: string } },
) {
  const res = await fetch(`${API_URL}/api/auth/link/${params.provider}`, {
    method: 'DELETE',
    headers: {
      Cookie: req.headers.get('cookie') || '',
    },
  });

  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}
```

Then update `apiClient` to call the proxy for unlink, or create a dedicated unlink function that calls the same-origin route.

**Alternative fixes considered:**
- Remove `httpOnly` from `access_token` cookie -> reduces security (XSS can steal token)
- Change `sameSite` to `'None'` + `secure: true` -> requires HTTPS in dev
- Use Next.js middleware to forward cookies -> more complex, affects all routes

#### 1.2 Fix Web: Improve error messaging

**File:** `sys/frontend/user/web/src/components/auth/ProviderManager.tsx` (line 36-37)

Current catch shows generic fetch error on network/CORS failures. Add fallback messaging:

```typescript
catch (err) {
  const message = err instanceof Error ? err.message : '連携解除に失敗しました';
  alert(message.includes('fetch') ? '通信エラーが発生しました。再度お試しください。' : message);
  setUnlinking(null);
}
```

#### 1.3 Fix Mobile: Remove client-side guard preventing unlink

**File:** `sys/frontend/user/mobile/src/screens/profile/SettingsScreen.tsx` (line 49-52)

Remove the `linkedProviders.length <= 1` guard. For the new single-provider model, users must be able to unlink their only provider. Backend validation is sufficient.

```typescript
// REMOVE this block:
if (linkedProviders.length <= 1) {
  Alert.alert('Cannot Unlink', 'You must have at least one linked provider.');
  return;
}
```

#### 1.4 Fix Mobile: Refresh user data after unlink

**File:** `sys/frontend/user/mobile/src/screens/profile/SettingsScreen.tsx` (line 61-63)

After successful unlink, refresh user profile from server to update Redux state:

```typescript
onPress: async () => {
  setLoadingProvider(provider);
  try {
    await apiClient.unlinkProvider(provider);
    // Refresh user data
    const res = await apiClient.getMe();
    dispatch(setUser(res.data));
    Alert.alert('Success', `${provider} has been unlinked.`);
  } catch {
    Alert.alert('Error', 'Failed to unlink provider.');
  } finally {
    setLoadingProvider(null);
  }
},
```

---

### Phase 2: Backend - Single Provider Policy

#### 2.1 Remove `linkProvider()` method

**File:** `sys/backend/api/src/services/auth.service.ts` (line 152-181)

Remove `linkProvider()` entirely. No longer needed since users can only have one provider.

#### 2.2 Add `switchProvider()` method

**File:** `sys/backend/api/src/services/auth.service.ts`

Atomic operation to replace the current provider with a new one:

```typescript
async switchProvider(userId: string, newProvider: string, code: string, codeVerifier?: string): Promise<void> {
  const userInfo = await this.getProviderUserInfo(newProvider, code, codeVerifier);

  // Check if this provider account is already used by another user
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerId: { provider: newProvider, providerId: userInfo.providerId } },
  });

  if (existingAccount && existingAccount.userId !== userId) {
    throw new AppError(409, 'This provider account is already linked to another user');
  }

  // Transaction: delete all current providers, create new one
  await prisma.$transaction([
    prisma.oAuthAccount.deleteMany({ where: { userId } }),
    prisma.oAuthAccount.create({
      data: {
        provider: newProvider,
        providerId: userInfo.providerId,
        userId,
      },
    }),
  ]);
}
```

#### 2.3 Update `unlinkProvider()`

**File:** `sys/backend/api/src/services/auth.service.ts` (line 183-201)

Remove the "at least one provider must remain" check (line 189-191). When a user disconnects, their account remains but has no linked provider. Frontend handles logout redirect.

```typescript
async unlinkProvider(userId: string, provider: string): Promise<void> {
  const account = await prisma.oAuthAccount.findFirst({
    where: { userId, provider },
  });

  if (!account) {
    throw new AppError(404, 'Provider not linked to this account');
  }

  await prisma.oAuthAccount.delete({
    where: { id: account.id },
  });
}
```

#### 2.4 Update Auth Routes

**File:** `sys/backend/api/src/routes/auth.ts`

- Change `GET /api/auth/link/:provider` (line 132-153) to use `switchProvider()` instead of `linkProvider()`
- Keep `DELETE /api/auth/link/:provider` (line 156-162) with updated `unlinkProvider()` (no last-provider restriction)

---

### Phase 3: Frontend Web - Single Provider UI

#### 3.1 Update `ProviderManager.tsx`

**File:** `sys/frontend/user/web/src/components/auth/ProviderManager.tsx`

Redesign from multi-provider link/unlink to single-provider switch/disconnect:

- Show current linked provider prominently with "Connected" badge
- For non-linked providers, show "Switch to [Provider]" button
  - Confirm dialog: "Switch from [current] to [new]? You will be re-authenticated."
  - Redirect to `GET /api/auth/link/:newProvider` (atomic switch via `switchProvider()`)
- Show "Disconnect" button for current provider
  - Confirm dialog: "Disconnecting will log you out. You can log in again with any provider."
  - Call `DELETE /api/auth/link/:provider` -> logout -> redirect to login page

#### 3.2 Update `SettingsContent.tsx`

**File:** `sys/frontend/user/web/src/app/(app)/profile/settings/SettingsContent.tsx` (line 16)

Update description text from multi-provider to single-provider messaging:

```
Before: 外部サービスとの連携を管理します。複数のサービスを連携すると、どのサービスからでもログインできます。
After:  ログインに使用するサービスを管理します。別のサービスに切り替える場合は、現在のサービスを解除してから新しいサービスでログインしてください。
```

---

### Phase 4: Frontend Mobile - Single Provider UI

#### 4.1 Update `SettingsScreen.tsx`

**File:** `sys/frontend/user/mobile/src/screens/profile/SettingsScreen.tsx`

Apply same single-provider UI pattern as web:

- Show current provider as active, others as "Switch to..."
- Remove multi-provider guard (already done in Phase 1.3)
- Add dispatch for user data refresh (already done in Phase 1.4)
- Add confirmation dialogs for switch/disconnect
- After disconnect, call `authService.clearTokens()` and navigate to login screen

---

### Phase 5: Data Migration

#### 5.1 Clean Up Existing Multi-Provider Users

For users who currently have multiple providers linked:

**Option A (Recommended):** Keep the oldest (first linked) provider, remove others

```sql
-- Find users with multiple providers
SELECT "userId", COUNT(*) as cnt
FROM "OAuthAccount"
GROUP BY "userId"
HAVING COUNT(*) > 1;

-- Keep only the earliest-created account per user
DELETE FROM "OAuthAccount" a
WHERE EXISTS (
  SELECT 1 FROM "OAuthAccount" b
  WHERE b."userId" = a."userId"
  AND b."createdAt" < a."createdAt"
);
```

**Option B:** Notify affected users and let them choose which to keep

#### 5.2 Add Database Constraint

**File:** `sys/backend/api/prisma/schema.prisma`

Add a unique constraint on `userId` in the `OAuthAccount` table to enforce single-provider at the database level:

```prisma
model OAuthAccount {
  // ... existing fields
  userId String @unique  // Change from non-unique to unique
}
```

Note: This is a breaking change. Phase 5.1 must complete first.

---

## File Change Summary

| File | Phase | Change Type | Description |
|------|-------|-------------|-------------|
| `sys/frontend/user/web/src/app/api/auth/link/[provider]/route.ts` | 1 | Create | Next.js API proxy for cross-origin DELETE |
| `sys/frontend/user/web/src/components/auth/ProviderManager.tsx` | 1, 3 | Modify | Fix error messaging; redesign to single-provider UI |
| `sys/frontend/user/mobile/src/screens/profile/SettingsScreen.tsx` | 1, 4 | Modify | Remove guard, add data refresh, single-provider UI |
| `sys/backend/api/src/services/auth.service.ts` | 2 | Modify | Remove `linkProvider()`, add `switchProvider()`, update `unlinkProvider()`, optionally update `upsertUser()` |
| `sys/backend/api/src/routes/auth.ts` | 2 | Modify | Update link route to use switch logic |
| `sys/frontend/user/web/src/app/(app)/profile/settings/SettingsContent.tsx` | 3 | Modify | Update description text |
| `sys/backend/api/prisma/schema.prisma` | 5 | Modify | Add `@unique` to `userId` on `OAuthAccount` |

## Open Questions

1. **Migration strategy:** For existing multi-provider users, keep first provider or let them choose?
   - Recommendation: Keep first provider (simplest, can be done automatically)

2. **Grace period:** Should we give users a window to choose their preferred provider before auto-migration?
