'use client';

import { useState } from 'react';
import { useContentType } from '@/components/content/ContentTypeProvider';
import { CONTENT_TYPES } from '@learn-ai/shared-types';
import { TerminalSimulator } from '@/components/playground/TerminalSimulator';
import { ClaudeMdEditor } from '@/components/playground/ClaudeMdEditor';
import { ConfigBuilder } from '@/components/playground/ConfigBuilder';

type Tab = 'terminal' | 'claude_md' | 'config';

const TABS: { id: Tab; label: string }[] = [
  { id: 'terminal', label: 'ターミナル' },
  { id: 'claude_md', label: 'CLAUDE.md エディタ' },
  { id: 'config', label: 'Config Builder' },
];

export function PlaygroundContent() {
  const contentType = useContentType();
  const ct = CONTENT_TYPES[contentType];
  const [activeTab, setActiveTab] = useState<Tab>('terminal');

  if (contentType !== 'claudecode') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{ct.nameJa} Playground</h1>
          <p className="text-muted-foreground mt-1">
            {ct.nameJa} のインタラクティブ環境
          </p>
        </div>
        <div className="bg-card rounded-xl border p-12 text-center">
          <div className="text-5xl">{ct.icon}</div>
          <p className="text-muted-foreground mt-4 text-lg">
            {ct.nameJa} の Playground は準備中です
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            近日公開予定
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Playground</h1>
        <p className="text-muted-foreground mt-1">
          Claude Code のコマンドや設定を安全に試せるインタラクティブ環境
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'terminal' && <TerminalSimulator />}
        {activeTab === 'claude_md' && <ClaudeMdEditor />}
        {activeTab === 'config' && <ConfigBuilder />}
      </div>
    </div>
  );
}
