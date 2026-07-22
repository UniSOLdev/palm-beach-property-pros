import Link from "next/link";
import { notFound } from "next/navigation";
import { FieldJobWorkflow } from "@/components/admin/field-job-workflow";
import { getJobDetail } from "@/lib/admin/actions/jobs";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function FieldJobPage({ params }: Props) {
  const { id } = await params;
  const data = await getJobDetail(id);
  if (!data) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/admin/jobs/${id}`} className="text-sm font-semibold text-ocean no-underline hover:underline">
        ← Job detail
      </Link>
      <FieldJobWorkflow data={data} />
    </div>
  );
}
