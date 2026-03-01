'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // JWT is set via httpOnly cookie by the API callback
    // Simply redirect to dashboard
    router.replace('/dashboard');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">認証中...</p>
    </main>
  );
}
