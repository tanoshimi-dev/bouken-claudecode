'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { MonacoEditorWrapper } from './MonacoEditorWrapper';
import { SnippetManager } from './SnippetManager';
import {
  type HookDefinition,
  type HookEvent,
  HOOK_EVENTS,
  TOOL_NAMES,
  generateHooksJson,
} from './ConfigBuilderTypes';

function createEmptyHook(): HookDefinition {
  return { event: 'PreToolUse', command: '', matcher: {} };
}

export function ConfigBuilder() {
  const [hooks, setHooks] = useState<HookDefinition[]>([createEmptyHook()]);

  const generatedJson = useMemo(() => generateHooksJson(
    hooks.filter((h) => h.command.trim()),
  ), [hooks]);

  const updateHook = (index: number, updates: Partial<HookDefinition>) => {
    setHooks((prev) => prev.map((h, i) => (i === index ? { ...h, ...updates } : h)));
  };

  const updateMatcher = (index: number, field: 'tool_name' | 'file_pattern', value: string) => {
    setHooks((prev) =>
      prev.map((h, i) =>
        i === index ? { ...h, matcher: { ...h.matcher, [field]: value || undefined } } : h,
      ),
    );
  };

  const addHook = () => {
    setHooks((prev) => [...prev, createEmptyHook()]);
  };

  const removeHook = (index: number) => {
    setHooks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedJson);
      toast.success('クリップボードにコピーしました');
    } catch {
      toast.error('コピーに失敗しました');
    }
  };

  const handleLoadSnippet = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.hooks) {
        const loadedHooks: HookDefinition[] = [];
        for (const [event, entries] of Object.entries(parsed.hooks)) {
          if (Array.isArray(entries)) {
            for (const entry of entries) {
              loadedHooks.push({
                event: event as HookEvent,
                command: (entry as { command: string }).command ?? '',
                matcher: (entry as { matcher?: HookDefinition['matcher'] }).matcher,
              });
            }
          }
        }
        setHooks(loadedHooks.length > 0 ? loadedHooks : [createEmptyHook()]);
      }
    } catch {
      toast.error('JSON の解析に失敗しました');
    }
  };

  return (
    <div className="space-y-4">
      {/* Hook form */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Hooks 設定</h3>
          <button
            onClick={addHook}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          >
            + Hook を追加
          </button>
        </div>

        {hooks.map((hook, index) => (
          <div key={index} className="bg-card space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">Hook {index + 1}</span>
              {hooks.length > 1 && (
                <button
                  onClick={() => removeHook(index)}
                  className="text-muted-foreground hover:text-destructive text-sm transition-colors"
                >
                  削除
                </button>
              )}
            </div>

            {/* Event selector */}
            <div>
              <label className="text-muted-foreground mb-1 block text-sm">イベント</label>
              <select
                value={hook.event}
                onChange={(e) => updateHook(index, { event: e.target.value as HookEvent })}
                className="bg-background w-full rounded border px-3 py-2 text-sm"
              >
                {HOOK_EVENTS.map((evt) => (
                  <option key={evt.value} value={evt.value}>
                    {evt.label} — {evt.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Command input */}
            <div>
              <label className="text-muted-foreground mb-1 block text-sm">コマンド</label>
              <input
                type="text"
                value={hook.command}
                onChange={(e) => updateHook(index, { command: e.target.value })}
                placeholder='例: echo "Hook triggered"'
                className="bg-background w-full rounded border px-3 py-2 font-mono text-sm"
              />
            </div>

            {/* Optional matcher */}
            {(hook.event === 'PreToolUse' || hook.event === 'PostToolUse') && (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-muted-foreground mb-1 block text-sm">
                    ツール名（オプション）
                  </label>
                  <select
                    value={hook.matcher?.tool_name ?? ''}
                    onChange={(e) => updateMatcher(index, 'tool_name', e.target.value)}
                    className="bg-background w-full rounded border px-3 py-2 text-sm"
                  >
                    <option value="">すべてのツール</option>
                    {TOOL_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-sm">
                    ファイルパターン（オプション）
                  </label>
                  <input
                    type="text"
                    value={hook.matcher?.file_pattern ?? ''}
                    onChange={(e) => updateMatcher(index, 'file_pattern', e.target.value)}
                    placeholder="例: *.test.ts"
                    className="bg-background w-full rounded border px-3 py-2 font-mono text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Generated JSON output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">生成された設定 (.claude/settings.json)</h3>
          <button
            onClick={handleCopy}
            className="bg-muted hover:bg-muted/80 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          >
            コピー
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <MonacoEditorWrapper
            value={generatedJson}
            language="json"
            readOnly
            height="250px"
          />
        </div>
      </div>

      {/* Snippet manager */}
      <SnippetManager type="hook_config" currentContent={generatedJson} onLoad={handleLoadSnippet} />
    </div>
  );
}
