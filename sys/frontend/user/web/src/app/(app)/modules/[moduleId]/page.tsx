import { ModuleDetailContent } from './ModuleDetailContent';

export default function ModuleDetailPage({ params }: { params: Promise<{ moduleId: string }> }) {
  return <ModuleDetailContent paramsPromise={params} />;
}
