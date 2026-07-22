export function isHoneypotTriggered(formData: FormData): boolean {
  const honeypot = String(formData.get("companyWebsite") ?? "").trim();
  return honeypot.length > 0;
}

export function parseServicesFromForm(formData: FormData): string[] {
  const multi = formData.getAll("services").map((v) => String(v).trim()).filter(Boolean);
  if (multi.length) return multi;
  const single = String(formData.get("service") ?? "").trim();
  return single ? [single] : [];
}

export function needsWaterSpigotQuestion(services: string[]): boolean {
  const lower = services.join(" ").toLowerCase();
  return lower.includes("pressure") || lower.includes("exterior") || lower.includes("wash");
}
