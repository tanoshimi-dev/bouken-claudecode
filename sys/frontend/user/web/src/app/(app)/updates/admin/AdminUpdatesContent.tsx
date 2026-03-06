'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import type {
  AdminModuleLesson,
  PendingImpactItem,
  FreshnessSummary,
  VersionCheckResult,
  ToolSlug,
  ImpactPriority,
} from '@learn-ai/shared-types';

const TOOL_OPTIONS: { value: ToolSlug; label: string }[] = [
  { value: 'claude-code', label: 'Claude Code' },
  { value: 'codex', label: 'Codex CLI' },
  { value: 'github-copilot', label: 'GitHub Copilot' },
  { value: 'gemini', label: 'Gemini CLI' },
];

const CHANGE_TYPES = ['new', 'changed', 'fixed', 'deprecated', 'removed'] as const;

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    updated: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
  };
  const labels: Record<string, string> = {
    updated: 'Updated',
    in_progress: 'In Progress',
    pending: 'Pending',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    normal: 'text-yellow-600',
    low: 'text-gray-400',
  };
  const labels: Record<string, string> = {
    critical: '[!!!]',
    high: '[!!]',
    normal: '[!]',
    low: '[.]',
  };
  return (
    <span className={`font-mono text-xs ${styles[priority] ?? ''}`}>
      {labels[priority] ?? ''}
    </span>
  );
}

// ── Version Registration Form ────────────────────────────

interface ChangeEntry {
  type: (typeof CHANGE_TYPES)[number];
  description: string;
}

interface SelectedImpact {
  moduleId: string;
  lessonId?: string;
  impactDescription: string;
  priority: ImpactPriority;
}

function VersionRegistrationForm({
  modules,
  onSuccess,
}: {
  modules: AdminModuleLesson[];
  onSuccess: () => void;
}) {
  const [toolSlug, setToolSlug] = useState<ToolSlug>('claude-code');
  const [version, setVersion] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [summary, setSummary] = useState('');
  const [breakingChanges, setBreakingChanges] = useState(false);
  const [changelogUrl, setChangelogUrl] = useState('');
  const [changes, setChanges] = useState<ChangeEntry[]>([{ type: 'new', description: '' }]);
  const [selectedImpacts, setSelectedImpacts] = useState<SelectedImpact[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function addChange() {
    setChanges([...changes, { type: 'new', description: '' }]);
  }

  function removeChange(index: number) {
    setChanges(changes.filter((_, i) => i !== index));
  }

  function updateChange(index: number, field: keyof ChangeEntry, value: string) {
    const updated = [...changes];
    if (field === 'type') {
      updated[index] = { ...updated[index], type: value as ChangeEntry['type'] };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setChanges(updated);
  }

  function toggleModuleImpact(moduleId: string) {
    const existing = selectedImpacts.find((i) => i.moduleId === moduleId && !i.lessonId);
    if (existing) {
      setSelectedImpacts(selectedImpacts.filter((i) => i.moduleId !== moduleId));
    } else {
      setSelectedImpacts([
        ...selectedImpacts.filter((i) => i.moduleId !== moduleId),
        { moduleId, impactDescription: '', priority: 'normal' },
      ]);
    }
  }

  function toggleLessonImpact(moduleId: string, lessonId: string) {
    const existing = selectedImpacts.find((i) => i.moduleId === moduleId && i.lessonId === lessonId);
    if (existing) {
      setSelectedImpacts(selectedImpacts.filter((i) => !(i.moduleId === moduleId && i.lessonId === lessonId)));
    } else {
      setSelectedImpacts([
        ...selectedImpacts,
        { moduleId, lessonId, impactDescription: '', priority: 'normal' },
      ]);
    }
  }

  function isModuleSelected(moduleId: string) {
    return selectedImpacts.some((i) => i.moduleId === moduleId);
  }

  function isLessonSelected(moduleId: string, lessonId: string) {
    return selectedImpacts.some((i) => i.moduleId === moduleId && i.lessonId === lessonId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const validChanges = changes.filter((c) => c.description.trim());
      const result = await apiClient.createToolVersion({
        toolSlug,
        version,
        releaseDate,
        summary,
        breakingChanges,
        changes: validChanges,
        changelogUrl: changelogUrl || undefined,
      });

      const created = (result as { data: { id: string } }).data;

      if (selectedImpacts.length > 0) {
        await apiClient.createVersionImpacts(created.id, {
          impacts: selectedImpacts.map((i) => ({
            moduleId: i.moduleId,
            lessonId: i.lessonId,
            impactDescription: i.impactDescription || undefined,
            priority: i.priority,
          })),
        });
      }

      setSuccess(`Version ${version} registered with ${selectedImpacts.length} impact(s).`);
      setVersion('');
      setReleaseDate('');
      setSummary('');
      setBreakingChanges(false);
      setChangelogUrl('');
      setChanges([{ type: 'new', description: '' }]);
      setSelectedImpacts([]);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register version');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Tool</label>
          <select
            value={toolSlug}
            onChange={(e) => setToolSlug(e.target.value as ToolSlug)}
            className="border-input bg-background mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
          >
            {TOOL_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Version</label>
          <input
            type="text"
            required
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0.32"
            className="border-input bg-background mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Release Date</label>
          <input
            type="date"
            required
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            className="border-input bg-background mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end gap-4 pb-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={breakingChanges}
              onChange={(e) => setBreakingChanges(e.target.checked)}
              className="rounded"
            />
            Breaking Changes
          </label>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Summary</label>
        <input
          type="text"
          required
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Brief description of the update"
          maxLength={500}
          className="border-input bg-background mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Changelog URL (optional)</label>
        <input
          type="url"
          value={changelogUrl}
          onChange={(e) => setChangelogUrl(e.target.value)}
          placeholder="https://..."
          className="border-input bg-background mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      {/* Changes */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium">Changes</label>
          <button
            type="button"
            onClick={addChange}
            className="text-primary text-xs hover:underline"
          >
            + Add Change
          </button>
        </div>
        <div className="space-y-2">
          {changes.map((change, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={change.type}
                onChange={(e) => updateChange(i, 'type', e.target.value)}
                className="border-input bg-background rounded-lg border px-2 py-1.5 text-xs font-medium"
              >
                {CHANGE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
              <input
                type="text"
                value={change.description}
                onChange={(e) => updateChange(i, 'description', e.target.value)}
                placeholder="Description"
                className="border-input bg-background flex-1 rounded-lg border px-3 py-1.5 text-sm"
              />
              {changes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeChange(i)}
                  className="text-muted-foreground hover:text-red-500 text-sm"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Affected Modules/Lessons */}
      <div>
        <label className="mb-2 block text-sm font-medium">Affected Modules / Lessons</label>
        <div className="bg-muted/30 max-h-64 space-y-1 overflow-y-auto rounded-lg border p-3">
          {modules.map((mod) => (
            <div key={mod.id}>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={isModuleSelected(mod.id)}
                  onChange={() => toggleModuleImpact(mod.id)}
                  className="rounded"
                />
                Module {mod.number}: {mod.title}
                <span className="text-muted-foreground text-xs">({mod.contentType})</span>
              </label>
              {isModuleSelected(mod.id) && mod.lessons.length > 0 && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {mod.lessons.map((lesson) => (
                    <label key={lesson.id} className="text-muted-foreground flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isLessonSelected(mod.id, lesson.id)}
                        onChange={() => toggleLessonImpact(mod.id, lesson.id)}
                        className="rounded"
                      />
                      Lesson {lesson.order}: {lesson.title}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
          {modules.length === 0 && (
            <p className="text-muted-foreground text-sm">No published modules found.</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {submitting ? 'Registering...' : 'Register Version'}
      </button>
    </form>
  );
}

// ── Pending Updates Queue ────────────────────────────────

function PendingQueue({ items }: { items: PendingImpactItem[] }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">No pending updates. All content is up to date.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-b text-left text-xs uppercase tracking-wider">
            <th className="px-3 py-2">Priority</th>
            <th className="px-3 py-2">Tool</th>
            <th className="px-3 py-2">Version</th>
            <th className="px-3 py-2">Lessons</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-accent/30">
              <td className="px-3 py-2">
                <PriorityBadge priority={item.priority} />
              </td>
              <td className="px-3 py-2 font-medium">{item.displayName}</td>
              <td className="px-3 py-2">
                <Link href={`/updates/${item.toolSlug}`} className="text-primary hover:underline">
                  v{item.version}
                </Link>
              </td>
              <td className="px-3 py-2">{item.lessonCount}</td>
              <td className="px-3 py-2">
                <StatusBadge status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Manual Check Section ─────────────────────────────────

function ManualCheckSection({ lastChecked }: { lastChecked: string | null }) {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<VersionCheckResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    setChecking(true);
    setError(null);
    setResults(null);
    try {
      const res = await apiClient.triggerVersionCheck();
      setResults(res.data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <button
          onClick={handleCheck}
          disabled={checking}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {checking ? 'Checking...' : 'Check All Tools Now'}
        </button>
        {lastChecked && (
          <span className="text-muted-foreground text-sm">
            Last: {new Date(lastChecked).toLocaleString('ja-JP')}
          </span>
        )}
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {results && (
        <div className="space-y-1">
          {results.map((r) => (
            <div key={r.toolSlug} className="flex items-center gap-3 text-sm">
              <span className="font-medium">{r.toolSlug}</span>
              <span className="text-muted-foreground">v{r.latestVersion}</span>
              {r.isNew ? (
                <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">New</span>
              ) : (
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">Known</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Admin Content ───────────────────────────────────

export function AdminUpdatesContent() {
  const { data: modules, loading: modulesLoading } = useApi<AdminModuleLesson[]>(() =>
    apiClient.getAdminModules(),
  );
  const { data: queue, loading: queueLoading } = useApi<PendingImpactItem[]>(() =>
    apiClient.getAdminPendingQueue(),
  );
  const { data: summary } = useApi<FreshnessSummary>(() => apiClient.getUpdatesSummary());

  const [refreshKey, setRefreshKey] = useState(0);

  function handleVersionRegistered() {
    // Force re-fetch queue by incrementing key
    setRefreshKey((k) => k + 1);
    // Note: useApi doesn't support refetch, so we rely on page interaction
  }

  const loading = modulesLoading || queueLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">[Admin] Update Management</h1>
        <div className="bg-card animate-pulse rounded-xl border p-6">
          <div className="bg-muted mb-3 h-6 w-48 rounded" />
          <div className="bg-muted h-4 w-full rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">[Admin] Update Management</h1>
        <Link href="/updates" className="text-primary text-sm hover:underline">
          View Public Tracker
        </Link>
      </div>

      {/* Register New Version */}
      <section className="bg-card rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">Register New Version</h2>
        <VersionRegistrationForm modules={modules ?? []} onSuccess={handleVersionRegistered} />
      </section>

      {/* Pending Updates Queue */}
      <section className="bg-card rounded-xl border p-6" key={refreshKey}>
        <h2 className="mb-4 text-lg font-semibold">Pending Updates Queue</h2>
        <PendingQueue items={queue ?? []} />
      </section>

      {/* Manual Check */}
      <section className="bg-card rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">Manual Check</h2>
        <ManualCheckSection lastChecked={summary?.lastChecked ?? null} />
      </section>
    </div>
  );
}
