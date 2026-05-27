import { AdminPageHeader } from "@/components/admin/entity-list";
import { TransformationPairEditor } from "@/components/admin/transformations/pair-editor";
import { listProjectsAction, listTransformationPairsAction } from "@/lib/admin/actions/projects";

export const dynamic = "force-dynamic";
export const metadata = { title: "Transformations · Site Studio" };

export default async function AdminTransformationsPage() {
  const [pairs, projects] = await Promise.all([listTransformationPairsAction(), listProjectsAction()]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Transformation pairs"
        subtitle="Strict manual before/during/after pairing — no automatic matching"
        actionHref="/admin/website/media"
        actionLabel="Media library"
      />
      <TransformationPairEditor initialPairs={pairs} initialProjects={projects} />
    </div>
  );
}
