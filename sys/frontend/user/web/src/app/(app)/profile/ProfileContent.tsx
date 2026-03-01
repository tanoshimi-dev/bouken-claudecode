'use client';

export function ProfileContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">プロフィール</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User info */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold">ユーザー情報</h2>
        </div>

        {/* Learning stats */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold">学習統計</h2>
        </div>
      </div>
    </div>
  );
}
