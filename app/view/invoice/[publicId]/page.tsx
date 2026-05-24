import { redirect } from "next/navigation";

/** Alias for public invoice view — preserves /view/invoice/[id] URLs. */
export default async function ViewInvoicePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  redirect(`/i/${publicId}`);
}
