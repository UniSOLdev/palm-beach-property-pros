/** Subtle disclosure for temporary scaffold media — removed when source becomes authentic. */
export function ScaffoldNotice({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`media-scaffold-badge ${compact ? "media-scaffold-badge-compact" : ""}`}
      title="Temporary editorial reference imagery — will be replaced with authentic PBPP project media"
    >
      Reference imagery
    </span>
  );
}
