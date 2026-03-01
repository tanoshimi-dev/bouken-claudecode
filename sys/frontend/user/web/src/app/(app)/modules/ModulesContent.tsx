'use client';

export function ModulesContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">モジュール</h1>
      <p className="text-muted-foreground">学習するモジュールを選択してください</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Module cards will be rendered here */}
      </div>
    </div>
  );
}
