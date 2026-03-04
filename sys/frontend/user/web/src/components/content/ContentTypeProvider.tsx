'use client';

import { createContext, useContext } from 'react';
import type { ContentTypeSlug } from '@learn-ai/shared-types';

const ContentTypeContext = createContext<ContentTypeSlug | null>(null);

export function ContentTypeProvider({
  contentType,
  children,
}: {
  contentType: ContentTypeSlug;
  children: React.ReactNode;
}) {
  return (
    <ContentTypeContext.Provider value={contentType}>
      {children}
    </ContentTypeContext.Provider>
  );
}

export function useContentType(): ContentTypeSlug {
  const ctx = useContext(ContentTypeContext);
  if (!ctx) throw new Error('useContentType must be used within ContentTypeProvider');
  return ctx;
}
