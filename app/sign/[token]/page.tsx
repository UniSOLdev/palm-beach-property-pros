import { notFound } from "next/navigation";
import { DocumentSignatureForm } from "@/components/sign/document-signature-form";
import { getSigningRequestByToken } from "@/lib/admin/actions/signatures";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign Document · Palm Beach Property Pros",
  robots: { index: false, follow: false },
};

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const request = await getSigningRequestByToken(token);
  if (!request) notFound();

  if (request.expires_at && new Date(request.expires_at) < new Date() && request.status === "pending") {
    return (
      <main className="min-h-screen bg-cream px-4 py-8 pb-safe">
        <div className="mx-auto max-w-lg admin-card text-center">
          <h1 className="text-xl font-bold text-navy">Link expired</h1>
          <p className="mt-2 text-sm text-charcoal/70">Contact Palm Beach Property Pros for a new signing link.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-8 pb-safe">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-ocean">Palm Beach Property Pros</p>
          <h1 className="mt-2 text-2xl font-bold text-navy">Electronic Signature</h1>
        </header>
        <section className="rounded-2xl border border-navy/10 bg-white p-4">
          <DocumentSignatureForm
            token={token}
            title={request.title}
            alreadySigned={request.status === "signed"}
            signerName={request.signer_name}
          />
        </section>
      </div>
    </main>
  );
}
