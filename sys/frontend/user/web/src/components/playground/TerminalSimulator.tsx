'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { processCommand, getCompletions, type TerminalLine } from './TerminalCommandProcessor';
import { MarkdownRenderer } from '@/components/content/MarkdownRenderer';

const LESSON_CONTENT = `## Claude Code ターミナルシミュレーター

ここでは Claude Code の基本的なコマンドを安全に試すことができます。

### 基本コマンド
- \`claude\` — Claude Code を起動
- \`claude --version\` — バージョンを確認
- \`claude "質問"\` — ワンショットモード

### スラッシュコマンド
- \`/help\` — コマンド一覧
- \`/model\` — モデルの切り替え
- \`/config\` — 設定の確認
- \`/doctor\` — 環境の診断
- \`/init\` — CLAUDE.md の初期化
- \`/memory\` — メモリの表示

### シェルコマンド
- \`ls\` — ファイル一覧
- \`cat <ファイル名>\` — ファイル内容の表示
- \`pwd\` — カレントディレクトリ

### 操作方法
- **Enter** — コマンドを実行
- **Tab** — コマンドの補完
- **↑ / ↓** — コマンド履歴の移動
- **clear** — 画面をクリア
`;

const LINE_COLORS: Record<TerminalLine['type'], string> = {
  input: 'text-green-400',
  output: 'text-gray-300',
  error: 'text-red-400',
  info: 'text-blue-400',
  success: 'text-green-400',
};

export function TerminalSimulator() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { text: 'Claude Code Terminal Simulator v1.0', type: 'info' },
    { text: '"help" と入力して利用可能なコマンドを確認してください', type: 'info' },
    { text: '', type: 'output' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [lines, scrollToBottom]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newLines: TerminalLine[] = [
      ...lines,
      { text: `$ ${trimmed}`, type: 'input' },
    ];

    const result = processCommand(trimmed);

    if (result.shouldClear) {
      setLines([]);
    } else {
      setLines([...newLines, ...result.lines, { text: '', type: 'output' }]);
    }

    setHistory((prev) => [trimmed, ...prev]);
    setHistoryIndex(-1);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const completions = getCompletions(input);
      if (completions.length === 1) {
        setInput(completions[0]);
      } else if (completions.length > 1) {
        setLines((prev) => [
          ...prev,
          { text: `$ ${input}`, type: 'input' },
          { text: completions.join('  '), type: 'output' },
          { text: '', type: 'output' },
        ]);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-[600px] gap-4">
      {/* Left panel: Lesson text */}
      <div className="hidden w-1/3 overflow-y-auto rounded-lg border p-4 md:block">
        <MarkdownRenderer content={LESSON_CONTENT} />
      </div>

      {/* Right panel: Terminal */}
      <div
        className="flex flex-1 flex-col rounded-lg bg-[#0d1117] font-mono text-sm"
        onClick={handleTerminalClick}
      >
        {/* Terminal header */}
        <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="ml-2 text-xs text-gray-400">Terminal — シミュレーター</span>
        </div>

        {/* Output area */}
        <div ref={outputRef} className="flex-1 overflow-y-auto p-4">
          {lines.map((line, i) => (
            <div key={i} className={`${LINE_COLORS[line.type]} leading-6 whitespace-pre-wrap`}>
              {line.text || '\u00A0'}
            </div>
          ))}
        </div>

        {/* Input line */}
        <div className="flex items-center border-t border-gray-700 px-4 py-2">
          <span className="mr-2 text-green-400">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-300 outline-none placeholder:text-gray-600"
            placeholder="コマンドを入力..."
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
