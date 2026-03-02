export type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'Notification'
  | 'Stop'
  | 'SubagentStop';

export interface HookMatcher {
  tool_name?: string;
  file_pattern?: string;
}

export interface HookDefinition {
  event: HookEvent;
  command: string;
  matcher?: HookMatcher;
}

export interface HookEventInfo {
  value: HookEvent;
  label: string;
  description: string;
}

export const HOOK_EVENTS: HookEventInfo[] = [
  {
    value: 'PreToolUse',
    label: 'PreToolUse',
    description: 'ツール実行前に呼び出されます。ツールの使用を制御できます。',
  },
  {
    value: 'PostToolUse',
    label: 'PostToolUse',
    description: 'ツール実行後に呼び出されます。結果の検証やログに使えます。',
  },
  {
    value: 'Notification',
    label: 'Notification',
    description: 'Claude からの通知時に呼び出されます。',
  },
  {
    value: 'Stop',
    label: 'Stop',
    description: 'Claude が応答を完了した時に呼び出されます。',
  },
  {
    value: 'SubagentStop',
    label: 'SubagentStop',
    description: 'サブエージェントが完了した時に呼び出されます。',
  },
];

export const TOOL_NAMES = [
  'Bash',
  'Read',
  'Write',
  'Edit',
  'Glob',
  'Grep',
  'WebFetch',
  'WebSearch',
  'Agent',
  'NotebookEdit',
] as const;

export function generateHooksJson(hooks: HookDefinition[]): string {
  if (hooks.length === 0) {
    return JSON.stringify({ hooks: {} }, null, 2);
  }

  const hooksByEvent: Record<string, Array<{ command: string; matcher?: HookMatcher }>> = {};

  for (const hook of hooks) {
    if (!hooksByEvent[hook.event]) {
      hooksByEvent[hook.event] = [];
    }

    const entry: { command: string; matcher?: HookMatcher } = {
      command: hook.command,
    };

    if (hook.matcher && (hook.matcher.tool_name || hook.matcher.file_pattern)) {
      entry.matcher = {};
      if (hook.matcher.tool_name) entry.matcher.tool_name = hook.matcher.tool_name;
      if (hook.matcher.file_pattern) entry.matcher.file_pattern = hook.matcher.file_pattern;
    }

    hooksByEvent[hook.event].push(entry);
  }

  return JSON.stringify({ hooks: hooksByEvent }, null, 2);
}
