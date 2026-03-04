'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <div className="flex items-center gap-4">
        <Link href="/contents" className="text-lg font-bold">
          AI学習
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated && user && (
          <>
            <span className="text-muted-foreground text-sm">{user.name}</span>
            <button
              onClick={logout}
              className="hover:bg-accent rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            >
              ログアウト
            </button>
          </>
        )}
      </div>
    </header>
  );
}
