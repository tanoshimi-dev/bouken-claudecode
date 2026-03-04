import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-bold">AI学習</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          AIコーディングツールの使い方をインタラクティブに学べる教育アプリ
        </p>
        <Link
          href="/login"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-6 py-3 font-medium transition-colors"
        >
          はじめる
        </Link>
      </div>
    </main>
  );
}
