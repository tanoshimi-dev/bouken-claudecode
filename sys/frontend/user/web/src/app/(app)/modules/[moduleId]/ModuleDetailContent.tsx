'use client';

import { use } from 'react';

export function ModuleDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = use(paramsPromise);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">モジュール詳細</h1>
      <p className="text-muted-foreground">Module ID: {moduleId}</p>

      {/* Lesson list will be rendered here */}
    </div>
  );
}
