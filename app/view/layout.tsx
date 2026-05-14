import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client document",
  robots: { index: false, follow: false },
};

export default function ViewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream px-4 py-10 text-charcoal md:px-10">
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  );
}
