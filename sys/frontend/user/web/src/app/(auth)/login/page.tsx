import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">ログイン</h1>
          <p className="text-muted-foreground mt-2">
            アカウントにログインして学習を続けましょう
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
