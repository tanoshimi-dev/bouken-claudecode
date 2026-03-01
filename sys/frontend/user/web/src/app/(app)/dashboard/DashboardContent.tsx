'use client';

export function DashboardContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ダッシュボード</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Progress Overview */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold">学習進捗</h2>
          <p className="text-muted-foreground mt-2">全体の進捗が表示されます</p>
        </div>

        {/* Current Module */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold">現在のモジュール</h2>
          <p className="text-muted-foreground mt-2">続きから学習を再開</p>
        </div>

        {/* Streak */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold">ストリーク</h2>
          <p className="text-muted-foreground mt-2">連続学習日数</p>
        </div>
      </div>
    </div>
  );
}
