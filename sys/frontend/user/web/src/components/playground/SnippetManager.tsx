'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import type { PlaygroundSnippet, SnippetType } from '@learn-claude-code/shared-types';

interface SnippetManagerProps {
  type: SnippetType;
  currentContent: string;
  onLoad: (content: string) => void;
}

export function SnippetManager({ type, currentContent, onLoad }: SnippetManagerProps) {
  const [snippets, setSnippets] = useState<PlaygroundSnippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [showList, setShowList] = useState(false);

  const fetchSnippets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getSnippets(type);
      setSnippets(res.data);
    } catch {
      toast.error('スニペットの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showList) {
      fetchSnippets();
    }
  }, [showList]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('タイトルを入力してください');
      return;
    }
    try {
      await apiClient.createSnippet({ title: title.trim(), type, content: currentContent });
      toast.success('保存しました');
      setShowSaveDialog(false);
      setTitle('');
      if (showList) fetchSnippets();
    } catch {
      toast.error('保存に失敗しました');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteSnippet(id);
      toast.success('削除しました');
      fetchSnippets();
    } catch {
      toast.error('削除に失敗しました');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => setShowSaveDialog(!showSaveDialog)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
        >
          保存
        </button>
        <button
          onClick={() => setShowList(!showList)}
          className="bg-muted hover:bg-muted/80 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
        >
          {showList ? '一覧を閉じる' : '保存済み一覧'}
        </button>
      </div>

      {showSaveDialog && (
        <div className="bg-card flex items-center gap-2 rounded-lg border p-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトルを入力..."
            className="bg-background flex-1 rounded border px-3 py-1.5 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1.5 text-sm font-medium transition-colors"
          >
            保存
          </button>
          <button
            onClick={() => { setShowSaveDialog(false); setTitle(''); }}
            className="text-muted-foreground hover:text-foreground px-2 py-1.5 text-sm transition-colors"
          >
            キャンセル
          </button>
        </div>
      )}

      {showList && (
        <div className="bg-card max-h-48 space-y-1 overflow-y-auto rounded-lg border p-3">
          {loading ? (
            <p className="text-muted-foreground text-sm">読み込み中...</p>
          ) : snippets.length === 0 ? (
            <p className="text-muted-foreground text-sm">保存済みのスニペットはありません</p>
          ) : (
            snippets.map((s) => (
              <div
                key={s.id}
                className="hover:bg-accent flex items-center justify-between rounded px-2 py-1.5"
              >
                <button
                  onClick={() => { onLoad(s.content); setShowList(false); toast.success('読み込みました'); }}
                  className="flex-1 text-left text-sm"
                >
                  {s.title}
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-muted-foreground hover:text-destructive ml-2 text-xs transition-colors"
                >
                  削除
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
