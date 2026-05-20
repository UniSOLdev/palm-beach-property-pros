import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Palm Beach Property Pros handles information submitted through this website and our quick access partner page.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-cream">
      <article className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy">Privacy policy</h1>
        <div className="prose prose-sm mt-8 max-w-none text-charcoal/90 sm:prose-base">
          <p>
            {new Date().getFullYear()} — Palm Beach Property Pros (“we,” “us”) respects your
            privacy. This policy describes how information you provide through this website may be
            used to respond to service requests.
          </p>
          <h2 className="mt-8 text-lg font-bold text-navy">Information you submit</h2>
          <p>
            When you contact us—through site pages or our third-party quick access page—you may
            provide your name, phone number, email address, property address or city, service
            interests, and photos. We use that information solely to estimate scope, schedule work,
            and communicate about your project.
          </p>
          <h2 className="mt-8 text-lg font-bold text-navy">Sharing</h2>
          <p>
            We do not sell your personal information. We may share details with payment processors,
            scheduling tools, or insurers only as needed to complete services you request.
          </p>
          <h2 className="mt-8 text-lg font-bold text-navy">Retention</h2>
          <p>
            We retain communications for a period necessary to deliver service, maintain business
            records, and meet legal requirements. You may request deletion of non-essential contact
            data where law allows.
          </p>
          <h2 className="mt-8 text-lg font-bold text-navy">Contact</h2>
          <p>
            Questions about this policy may be directed to our office line listed in the site
            footer.
          </p>
        </div>
        <p className="mt-10">
          <Link href="/" className="text-sm font-semibold text-ocean hover:underline">
            ← Back to home
          </Link>
        </p>
      </article>
    </div>
  );
}
