'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CONTENT_TYPES } from '@learn-ai/shared-types';
import type { ContentTypeSlug } from '@learn-ai/shared-types';

const globalNavItems = [
  { href: '/contents', label: 'AIツール選択' },
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/profile', label: 'プロフィール' },
  { href: '/profile/settings', label: '設定' },
];

function getContentTypeNavItems(contentType: string) {
  return [
    { href: `/contents/${contentType}/dashboard`, label: 'ダッシュボード' },
    { href: `/contents/${contentType}/modules`, label: 'モジュール' },
    { href: `/contents/${contentType}/playground`, label: 'Playground' },
  ];
}

export function Sidebar() {
  const pathname = usePathname();

  // Detect if we're inside /contents/:contentType/*
  const contentTypeMatch = pathname.match(/^\/contents\/([^/]+)/);
  const contentType = contentTypeMatch?.[1] as ContentTypeSlug | undefined;
  const isInContentType = contentType && contentType in CONTENT_TYPES;

  const navItems = isInContentType
    ? getContentTypeNavItems(contentType)
    : globalNavItems;

  const ct = isInContentType ? CONTENT_TYPES[contentType] : null;

  return (
    <aside className="hidden w-64 border-r md:block">
      <nav className="space-y-1 p-4">
        {isInContentType && ct && (
          <>
            <Link
              href="/contents"
              className="text-muted-foreground hover:text-foreground mb-3 block text-sm transition-colors"
            >
              ← ツール選択
            </Link>
            <div className="mb-4 flex items-center gap-2 px-3">
              <span className="text-lg">{ct.icon}</span>
              <span className="text-sm font-semibold">{ct.nameJa}</span>
            </div>
          </>
        )}
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
