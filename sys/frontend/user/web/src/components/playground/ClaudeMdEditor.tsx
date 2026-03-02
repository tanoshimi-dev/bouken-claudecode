'use client';

import { useState, useMemo } from 'react';
import { MonacoEditorWrapper } from './MonacoEditorWrapper';
import { SnippetManager } from './SnippetManager';
import { CLAUDE_MD_TEMPLATES } from './ClaudeMdTemplates';
import { validateClaudeMd } from './ClaudeMdValidator';
import { MarkdownRenderer } from '@/components/content/MarkdownRenderer';

export function ClaudeMdEditor() {
  const [content, setContent] = useState(CLAUDE_MD_TEMPLATES[0].content);
  const [selectedTemplate, setSelectedTemplate] = useState(CLAUDE_MD_TEMPLATES[0].id);

  const validation = useMemo(() => validateClaudeMd(content), [content]);

  const handleTemplateSelect = (templateId: string) => {
    const template = CLAUDE_MD_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setContent(template.content);
      setSelectedTemplate(templateId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Template selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm">テンプレート:</span>
        {CLAUDE_MD_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateSelect(template.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedTemplate === template.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
            title={template.description}
          >
            {template.name}
          </button>
        ))}
      </div>

      {/* Split view: Editor + Preview */}
      <div className="flex h-[500px] gap-4">
        {/* Editor */}
        <div className="flex-1 overflow-hidden rounded-lg border">
          <MonacoEditorWrapper
            value={content}
            onChange={setContent}
            language="markdown"
            height="500px"
          />
        </div>

        {/* Preview */}
        <div className="hidden flex-1 overflow-y-auto rounded-lg border p-4 md:block">
          <div className="text-muted-foreground mb-2 text-xs font-medium uppercase">プレビュー</div>
          <MarkdownRenderer content={content} />
        </div>
      </div>

      {/* Validation status bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
        <span className="text-muted-foreground text-sm">検証:</span>
        {validation.sections.map((section) => (
          <span
            key={section.name}
            className={`flex items-center gap-1 text-sm ${
              section.found ? 'text-green-500' : 'text-yellow-500'
            }`}
          >
            {section.found ? '✓' : '⚠'} {section.name}
          </span>
        ))}
        {validation.isValid && (
          <span className="ml-auto text-sm text-green-500">すべてのセクションが含まれています</span>
        )}
      </div>

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="space-y-1 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
          {validation.warnings.map((warning, i) => (
            <p key={i} className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠ {warning}
            </p>
          ))}
        </div>
      )}

      {/* Snippet manager */}
      <SnippetManager type="claude_md" currentContent={content} onLoad={setContent} />
    </div>
  );
}
