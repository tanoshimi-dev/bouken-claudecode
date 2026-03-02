export interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'info' | 'success';
}

interface CommandResult {
  lines: TerminalLine[];
  shouldClear: boolean;
}

const COMMANDS: Record<string, () => TerminalLine[]> = {
  'claude': () => [
    { text: 'Claude Code v1.0.0', type: 'output' },
    { text: '', type: 'output' },
    { text: 'Claude Code はターミナルから直接使えるAIアシスタントです。', type: 'output' },
    { text: '使い方: claude [オプション] [プロンプト]', type: 'output' },
    { text: '', type: 'output' },
    { text: 'オプション:', type: 'output' },
    { text: '  --version, -v    バージョンを表示', type: 'output' },
    { text: '  --help, -h       ヘルプを表示', type: 'output' },
    { text: '  --model, -m      使用するモデルを指定', type: 'output' },
    { text: '', type: 'output' },
    { text: '例: claude "このコードを説明して"', type: 'output' },
    { text: '', type: 'info' },
    { text: '💡 ヒント: モジュール1でClaude Codeの基本を学びましょう！', type: 'info' },
  ],
  'claude --version': () => [
    { text: 'Claude Code v1.0.0 (claude-sonnet-4-20250514)', type: 'output' },
  ],
  'claude -v': () => [
    { text: 'Claude Code v1.0.0 (claude-sonnet-4-20250514)', type: 'output' },
  ],
  'claude --help': () => COMMANDS['claude'](),
  'claude -h': () => COMMANDS['claude'](),
  '/help': () => [
    { text: 'Claude Code スラッシュコマンド一覧:', type: 'output' },
    { text: '', type: 'output' },
    { text: '  /help          このヘルプを表示', type: 'output' },
    { text: '  /model         使用するモデルを変更', type: 'output' },
    { text: '  /clear         会話履歴をクリア', type: 'output' },
    { text: '  /compact       会話をコンパクトに要約', type: 'output' },
    { text: '  /config        設定を表示・変更', type: 'output' },
    { text: '  /cost          現在のセッションのコストを表示', type: 'output' },
    { text: '  /doctor        環境の問題を診断', type: 'output' },
    { text: '  /init          CLAUDE.md ファイルを初期化', type: 'output' },
    { text: '  /memory        CLAUDE.md の内容を表示', type: 'output' },
    { text: '  /permissions   権限設定を管理', type: 'output' },
    { text: '  /review        コードレビューを実行', type: 'output' },
    { text: '  /status        セッション情報を表示', type: 'output' },
    { text: '', type: 'info' },
    { text: '💡 ヒント: スラッシュコマンドの詳細はモジュール3で学べます！', type: 'info' },
  ],
  '/model': () => [
    { text: '現在のモデル: claude-sonnet-4-20250514', type: 'output' },
    { text: '', type: 'output' },
    { text: '利用可能なモデル:', type: 'output' },
    { text: '  claude-sonnet-4-20250514 (デフォルト)', type: 'output' },
    { text: '  claude-opus-4-20250514', type: 'output' },
    { text: '  claude-haiku-3-5-20241022', type: 'output' },
    { text: '', type: 'info' },
    { text: '💡 ヒント: /model <モデル名> でモデルを切り替えられます', type: 'info' },
  ],
  '/clear': () => [
    { text: '会話履歴をクリアしました。', type: 'success' },
  ],
  '/compact': () => [
    { text: '会話を要約してコンテキストを圧縮しました。', type: 'success' },
    { text: 'トークン使用量: 1,234 → 456 (63% 削減)', type: 'output' },
    { text: '', type: 'info' },
    { text: '💡 ヒント: コンテキストウィンドウが大きくなったら /compact を使いましょう', type: 'info' },
  ],
  '/config': () => [
    { text: '現在の設定:', type: 'output' },
    { text: '', type: 'output' },
    { text: '  model: claude-sonnet-4-20250514', type: 'output' },
    { text: '  theme: dark', type: 'output' },
    { text: '  permissions: auto-approve reads', type: 'output' },
    { text: '  hooks: 1 configured', type: 'output' },
    { text: '', type: 'info' },
    { text: '💡 ヒント: Config Builder タブで設定ファイルを作成できます！', type: 'info' },
  ],
  '/cost': () => [
    { text: 'セッションコスト:', type: 'output' },
    { text: '', type: 'output' },
    { text: '  入力トークン:  12,345 ($0.037)', type: 'output' },
    { text: '  出力トークン:  3,456  ($0.052)', type: 'output' },
    { text: '  合計:          $0.089', type: 'output' },
    { text: '', type: 'info' },
    { text: '💡 これはシミュレーションです。実際のコストはAPIの使用状況によります。', type: 'info' },
  ],
  '/doctor': () => [
    { text: 'Claude Code 環境診断:', type: 'output' },
    { text: '', type: 'output' },
    { text: '  ✓ Node.js v22.0.0', type: 'success' },
    { text: '  ✓ npm v10.0.0', type: 'success' },
    { text: '  ✓ Git v2.45.0', type: 'success' },
    { text: '  ✓ API キー設定済み', type: 'success' },
    { text: '  ✓ CLAUDE.md 検出', type: 'success' },
    { text: '', type: 'output' },
    { text: '問題は見つかりませんでした。', type: 'success' },
  ],
  '/init': () => [
    { text: 'CLAUDE.md ファイルを初期化しました。', type: 'success' },
    { text: '', type: 'output' },
    { text: '作成されたファイル:', type: 'output' },
    { text: '  ./CLAUDE.md', type: 'output' },
    { text: '', type: 'info' },
    { text: '💡 ヒント: CLAUDE.md エディタタブで内容を編集できます！', type: 'info' },
  ],
  '/memory': () => [
    { text: 'CLAUDE.md の内容:', type: 'output' },
    { text: '', type: 'output' },
    { text: '  # CLAUDE.md', type: 'output' },
    { text: '  ## Memory', type: 'output' },
    { text: '  - このプロジェクトはTypeScriptで書かれています', type: 'output' },
    { text: '  ## Preferences', type: 'output' },
    { text: '  - コードスタイル: prettier + ESLint', type: 'output' },
    { text: '', type: 'info' },
    { text: '💡 ヒント: CLAUDE.md エディタタブで詳しく編集できます！', type: 'info' },
  ],
  '/permissions': () => [
    { text: '権限設定:', type: 'output' },
    { text: '', type: 'output' },
    { text: '  Read:   自動承認', type: 'output' },
    { text: '  Write:  確認が必要', type: 'output' },
    { text: '  Bash:   確認が必要', type: 'output' },
    { text: '  Edit:   確認が必要', type: 'output' },
    { text: '', type: 'info' },
    { text: '💡 ヒント: 権限設定の詳細はモジュール4で学べます！', type: 'info' },
  ],
  '/review': () => [
    { text: 'コードレビューを実行中...', type: 'output' },
    { text: '', type: 'output' },
    { text: 'レビュー結果:', type: 'output' },
    { text: '  ✓ セキュリティ問題なし', type: 'success' },
    { text: '  ⚠ 未使用のインポートが1件あります', type: 'info' },
    { text: '  ✓ テストカバレッジ OK', type: 'success' },
    { text: '', type: 'info' },
    { text: '💡 これはシミュレーションです。実際のレビューではコードを分析します。', type: 'info' },
  ],
  '/status': () => [
    { text: 'セッション情報:', type: 'output' },
    { text: '', type: 'output' },
    { text: '  モデル:     claude-sonnet-4-20250514', type: 'output' },
    { text: '  セッション: シミュレーション', type: 'output' },
    { text: '  ツール数:   12', type: 'output' },
    { text: '  CWD:        /home/user/project', type: 'output' },
  ],
  'help': () => [
    { text: '利用可能なコマンド:', type: 'output' },
    { text: '', type: 'output' },
    { text: '  claude          Claude Code を起動', type: 'output' },
    { text: '  claude --help   Claude Code のヘルプ', type: 'output' },
    { text: '  /help           スラッシュコマンド一覧', type: 'output' },
    { text: '  ls              ファイル一覧', type: 'output' },
    { text: '  cat <file>      ファイル内容を表示', type: 'output' },
    { text: '  pwd             カレントディレクトリ', type: 'output' },
    { text: '  echo <text>     テキストを表示', type: 'output' },
    { text: '  clear           画面をクリア', type: 'output' },
    { text: '', type: 'info' },
    { text: '💡 Tab キーでコマンドを補完できます', type: 'info' },
  ],
  'ls': () => [
    { text: 'CLAUDE.md         package.json      src/', type: 'output' },
    { text: 'README.md         tsconfig.json     node_modules/', type: 'output' },
    { text: '.claude/          .gitignore        tests/', type: 'output' },
  ],
  'pwd': () => [
    { text: '/home/user/project', type: 'output' },
  ],
  'clear': () => [],
};

function handleCatCommand(args: string): TerminalLine[] {
  const file = args.trim();
  if (!file) {
    return [{ text: 'cat: ファイル名を指定してください', type: 'error' }];
  }

  const files: Record<string, string[]> = {
    'CLAUDE.md': [
      '# CLAUDE.md',
      '',
      '## Memory',
      '- このプロジェクトはTypeScriptで書かれています',
      '',
      '## Preferences',
      '- コードスタイル: prettier + ESLint',
    ],
    'package.json': [
      '{',
      '  "name": "my-project",',
      '  "version": "1.0.0",',
      '  "scripts": {',
      '    "dev": "next dev",',
      '    "build": "next build"',
      '  }',
      '}',
    ],
    '.gitignore': [
      'node_modules/',
      '.env',
      '.next/',
      'dist/',
    ],
  };

  if (files[file]) {
    return files[file].map((text) => ({ text, type: 'output' as const }));
  }

  return [{ text: `cat: ${file}: そのようなファイルはありません`, type: 'error' }];
}

function handleEchoCommand(args: string): TerminalLine[] {
  return [{ text: args, type: 'output' }];
}

function handleClaudeOneShot(args: string): TerminalLine[] {
  return [
    { text: `Claude に質問中: "${args}"`, type: 'output' },
    { text: '', type: 'output' },
    { text: 'これはシミュレーションです。実際のClaude Codeでは、', type: 'info' },
    { text: 'AIがあなたの質問に対して回答を生成します。', type: 'info' },
    { text: '', type: 'info' },
    { text: '💡 ヒント: claude "質問" の形式でワンショットモードが使えます', type: 'info' },
  ];
}

export function processCommand(input: string): CommandResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { lines: [], shouldClear: false };
  }

  if (trimmed === 'clear') {
    return { lines: [], shouldClear: true };
  }

  // Check exact command match
  if (COMMANDS[trimmed]) {
    return { lines: COMMANDS[trimmed](), shouldClear: false };
  }

  // Handle "cat" with arguments
  if (trimmed.startsWith('cat ')) {
    return { lines: handleCatCommand(trimmed.slice(4)), shouldClear: false };
  }

  // Handle "echo" with arguments
  if (trimmed.startsWith('echo ')) {
    return { lines: handleEchoCommand(trimmed.slice(5)), shouldClear: false };
  }

  // Handle "claude" with quoted argument (one-shot mode)
  const claudeMatch = trimmed.match(/^claude\s+["'](.+)["']$/);
  if (claudeMatch) {
    return { lines: handleClaudeOneShot(claudeMatch[1]), shouldClear: false };
  }
  if (trimmed.startsWith('claude ') && !trimmed.startsWith('claude -')) {
    return { lines: handleClaudeOneShot(trimmed.slice(7)), shouldClear: false };
  }

  return {
    lines: [
      { text: `command not found: ${trimmed}`, type: 'error' },
      { text: '"help" と入力して利用可能なコマンドを確認してください', type: 'info' },
    ],
    shouldClear: false,
  };
}

const ALL_COMMANDS = [
  'claude', 'claude --version', 'claude --help',
  '/help', '/model', '/clear', '/compact', '/config',
  '/cost', '/doctor', '/init', '/memory', '/permissions',
  '/review', '/status',
  'help', 'ls', 'cat', 'pwd', 'echo', 'clear',
];

export function getCompletions(partial: string): string[] {
  if (!partial) return [];
  return ALL_COMMANDS.filter((cmd) => cmd.startsWith(partial));
}
