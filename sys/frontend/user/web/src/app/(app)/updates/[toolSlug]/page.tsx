import { ToolDetailContent } from './ToolDetailContent';

export default function ToolDetailPage({
  params,
}: {
  params: Promise<{ toolSlug: string }>;
}) {
  return <ToolDetailContent paramsPromise={params} />;
}
