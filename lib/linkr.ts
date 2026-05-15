/**
 * @deprecated Linkr is disabled until production-ready. Use `@/lib/cta-routes` instead.
 * These exports remain for backward compatibility during migration.
 */
import { CTA_LABELS, PBPP_ROUTES } from "@/lib/cta-routes";

/** @deprecated Use PBPP_ROUTES.clientPortal or PBPP_ROUTES.quote */
export const LINKR_URL = PBPP_ROUTES.clientPortal;

/** @deprecated Use externalLinkRel() from cta-routes when truly external */
export const linkrRel = "noopener noreferrer" as const;

export { CTA_LABELS, PBPP_ROUTES };
