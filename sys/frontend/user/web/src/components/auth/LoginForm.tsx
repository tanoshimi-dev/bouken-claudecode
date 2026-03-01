'use client';

const providers = [
  { id: 'google', label: 'Google', icon: '🔵' },
  { id: 'github', label: 'GitHub', icon: '⚫' },
] as const;

export function LoginForm() {
  const handleLogin = (provider: string) => {
    // Goes through Next.js rewrite → backend API
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <button
          key={provider.id}
          onClick={() => handleLogin(provider.id)}
          className="bg-card hover:bg-accent flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-3 font-medium transition-colors"
        >
          <span>{provider.icon}</span>
          <span>{provider.label} でログイン</span>
        </button>
      ))}
    </div>
  );
}
