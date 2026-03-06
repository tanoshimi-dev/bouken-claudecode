'use client';

import { useAuth } from '@/hooks/useAuth';
import { ProviderManager } from '@/components/auth/ProviderManager';

export function SettingsContent() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">設定</h1>

      <div className="bg-card rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">アカウント連携</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          他のサービスとの連携に切り替える場合、一旦現在の連携を解除してから、新しいサービスと連携してください。
        </p>
        {user ? (
          <ProviderManager linkedAccounts={user.linkedAccounts ?? []} />
        ) : (
          <div className="bg-muted h-48 animate-pulse rounded-lg" />
        )}
      </div>
    </div>
  );
}
