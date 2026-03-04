import { notFound } from 'next/navigation';
import { CONTENT_TYPES } from '@learn-ai/shared-types';
import { ContentTypeProvider } from '@/components/content/ContentTypeProvider';
import type { ContentTypeSlug } from '@learn-ai/shared-types';

export default async function ContentTypeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ contentType: string }>;
}) {
  const { contentType } = await params;

  if (!(contentType in CONTENT_TYPES)) {
    notFound();
  }

  return (
    <ContentTypeProvider contentType={contentType as ContentTypeSlug}>
      {children}
    </ContentTypeProvider>
  );
}
