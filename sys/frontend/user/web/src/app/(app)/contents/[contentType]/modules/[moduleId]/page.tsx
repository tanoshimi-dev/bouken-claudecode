import { ModuleDetailContent } from './ModuleDetailContent';

export default function ModuleDetailPage({ params }: { params: Promise<{ contentType: string; moduleId: string }> }) {
  return <ModuleDetailContent paramsPromise={params} />;
}
