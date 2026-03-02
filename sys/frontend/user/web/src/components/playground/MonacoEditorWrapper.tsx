'use client';

import { Suspense, lazy } from 'react';

const Editor = lazy(() => import('@monaco-editor/react'));

interface MonacoEditorWrapperProps {
  value: string;
  onChange?: (value: string) => void;
  language?: 'markdown' | 'json' | 'yaml' | 'shell';
  readOnly?: boolean;
  height?: string;
}

function EditorSkeleton({ height }: { height: string }) {
  return (
    <div
      className="bg-[#1e1e1e] flex items-center justify-center rounded-lg"
      style={{ height }}
    >
      <p className="text-muted-foreground text-sm">エディタを読み込み中...</p>
    </div>
  );
}

export function MonacoEditorWrapper({
  value,
  onChange,
  language = 'markdown',
  readOnly = false,
  height = '400px',
}: MonacoEditorWrapperProps) {
  return (
    <Suspense fallback={<EditorSkeleton height={height} />}>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange?.(val ?? '')}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          wordWrap: 'on',
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
        }}
      />
    </Suspense>
  );
}
