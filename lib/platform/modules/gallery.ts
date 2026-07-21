import type { BeforeAfterPair } from "@/components/platform/before-after-slider";
import { resolveMediaUrl, type SiteProjectMedia } from "@/lib/site-content/types";

export function buildBeforeAfterPairsFromProjectMedia(
  media: SiteProjectMedia[],
  projectTitle: string,
): BeforeAfterPair[] {
  const before = media
    .filter((item) => item.gallery_phase === "before")
    .sort((a, b) => a.sort_order - b.sort_order);
  const after = media
    .filter((item) => item.gallery_phase === "after")
    .sort((a, b) => a.sort_order - b.sort_order);

  const pairCount = Math.min(before.length, after.length);
  const pairs: BeforeAfterPair[] = [];

  for (let index = 0; index < pairCount; index += 1) {
    const beforeItem = before[index];
    const afterItem = after[index];
    const beforeSrc = resolveMediaUrl(beforeItem.media ?? null);
    const afterSrc = resolveMediaUrl(afterItem.media ?? null);
    if (!beforeSrc || !afterSrc) continue;

    pairs.push({
      id: `${beforeItem.id}-${afterItem.id}`,
      before: {
        src: beforeSrc,
        alt: beforeItem.media?.alt_text ?? `${projectTitle} before`,
      },
      after: {
        src: afterSrc,
        alt: afterItem.media?.alt_text ?? `${projectTitle} after`,
      },
      caption: afterItem.caption ?? beforeItem.caption ?? undefined,
    });
  }

  return pairs;
}
