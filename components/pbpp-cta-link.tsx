import Link from "next/link";
import type { ReactNode } from "react";

import { externalLinkRel, normalizeCtaHref } from "@/lib/cta-routes";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
  /** CMS or legacy flag — normalized with href (Linkr hosts always internal). */
  external?: boolean;
  onClick?: () => void;
};

export function PbppCtaLink({ href, className, children, external, onClick }: Props) {
  const { href: target, external: isExt } = normalizeCtaHref(href, external);

  if (isExt) {
    return (
      <a
        href={target}
        target="_blank"
        rel={externalLinkRel(target)}
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={target} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
