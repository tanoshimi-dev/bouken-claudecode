'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const providers = [
  { id: 'google', label: 'Google', icon: '🔵' },
  { id: 'github', label: 'GitHub', icon: '⚫' },
] as const;

export function LoginForm() {
  const handleLogin = (provider: string) => {
    // Direct navigation to backend OAuth endpoint
    window.location.href = `${API_URL}/api/auth/${provider}`;
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
