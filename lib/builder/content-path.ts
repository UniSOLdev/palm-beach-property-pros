/** Deep get/set for section content JSON paths (dot notation). */

export function getContentPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function setContentPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const parts = path.split(".");
  if (parts.length === 1) return { ...obj, [path]: value };

  const next = { ...obj };
  let cur: Record<string, unknown> = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const child = cur[key];
    const cloned =
      child && typeof child === "object" && !Array.isArray(child)
        ? { ...(child as Record<string, unknown>) }
        : {};
    cur[key] = cloned;
    cur = cloned;
  }
  cur[parts[parts.length - 1]] = value;
  return next;
}

export function patchSectionContent(
  content: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  return setContentPath(content, path, value);
}
