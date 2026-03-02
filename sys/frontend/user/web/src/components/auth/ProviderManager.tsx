'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import type { LinkedAccount } from '@learn-claude-code/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
  const canUnlink = linkedAccounts.length > 1;

  const handleLink = (providerId: string) => {
    window.location.href = `${API_URL}/api/auth/link/${providerId}`;
  };

  const handleUnlink = async (providerId: string) => {
    setUnlinking(providerId);
    try {
      await apiClient.unlinkProvider(providerId);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : '連携解除に失敗しました');
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
                    disabled={!canUnlink || unlinking === provider.id}
                    className="text-destructive hover:bg-destructive/10 rounded-md border border-current px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {unlinking === provider.id ? '解除中...' : '連携解除'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleLink(provider.id)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1 text-xs font-medium transition-colors"
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
