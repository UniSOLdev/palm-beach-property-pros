import { Suspense, type ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p className="p-6 text-sm text-charcoal/70">Loading…</p>}>{children}</Suspense>;
}
