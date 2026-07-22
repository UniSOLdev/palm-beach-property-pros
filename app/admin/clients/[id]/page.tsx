import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientDetailView } from "@/components/admin/client-detail-view";
import { getClientDetail } from "@/lib/admin/actions/clients";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;

  try {
    const data = await getClientDetail(id);
    return (
      <div className="space-y-4">
        <Link href="/admin/clients" className="text-sm font-semibold text-ocean no-underline hover:underline">
          ← Clients
        </Link>
        <ClientDetailView data={data} />
      </div>
    );
  } catch {
    notFound();
  }
}
