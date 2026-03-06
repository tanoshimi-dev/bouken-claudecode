'use client';

import { useState } from 'react';
import type { LinkedAccount } from '@learn-ai/shared-types';

const ALL_PROVIDERS = [
  { id: 'google', label: 'Google', icon: '🔵' },
  { id: 'github', label: 'GitHub', icon: '⚫' },
  { id: 'microsoft', label: 'Microsoft', icon: '🟦' },
  { id: 'apple', label: 'Apple', icon: '🍎' },
  { id: 'line', label: 'LINE', icon: '🟢' },
] as const;

interface ProviderManagerProps {
  linkedAccounts: LinkedAccount[];
}

export function ProviderManager({ linkedAccounts }: ProviderManagerProps) {
  const [unlinking, setUnlinking] = useState<string | null>(null);

  const linkedProviders = new Set(linkedAccounts.map((a) => a.provider));
  const hasLinkedProvider = linkedAccounts.length > 0;

  const handleUnlink = async (providerId: string) => {
    if (!confirm('連携を解除するとログアウトされます。よろしいですか？')) {
      return;
    }
    setUnlinking(providerId);
    try {
      const res = await fetch(`/api/auth/link/${providerId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((body as { error?: string }).error ?? 'Request failed');
      }
      window.location.href = '/login';
    } catch (err) {
      const message = err instanceof Error ? err.message : '連携解除に失敗しました';
      alert(message.includes('fetch') ? '通信エラーが発生しました。再度お試しください。' : message);
      setUnlinking(null);
    }
  };

  return (
    <div className="space-y-3">
      {ALL_PROVIDERS.map((provider) => {
        const isLinked = linkedProviders.has(provider.id);
        const linkedAt = linkedAccounts.find((a) => a.provider === provider.id)?.linkedAt;

        return (
          <div
            key={provider.id}
            className="flex items-center justify-between rounded-lg border px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{provider.icon}</span>
              <div>
                <p className="font-medium">{provider.label}</p>
                {isLinked && linkedAt && (
                  <p className="text-muted-foreground text-xs">
                    連携日: {new Date(linkedAt).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </div>
            </div>
            <div>
              {isLinked ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">連携済み</span>
                  <button
                    onClick={() => handleUnlink(provider.id)}
                    disabled={unlinking === provider.id}
                    className="text-destructive hover:bg-destructive/10 rounded-md border border-current px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {unlinking === provider.id ? '解除中...' : '連携解除'}
                  </button>
                </div>
              ) : (
                <button
                  disabled={hasLinkedProvider}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  連携する
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
