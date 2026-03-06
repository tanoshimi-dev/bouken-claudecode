import { VersionDetailContent } from './VersionDetailContent';

export default function VersionDetailPage({
  params,
}: {
  params: Promise<{ toolSlug: string; versionId: string }>;
}) {
  return <VersionDetailContent paramsPromise={params} />;
}
