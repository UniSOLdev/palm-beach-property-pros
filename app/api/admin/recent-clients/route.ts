import { NextResponse } from "next/server";
import { fetchRecentClientsForCombobox } from "@/lib/admin-recent-clients";
import { isAdminAuthenticated } from "@/lib/admin-auth";

/** Clients with the most recent invoice activity — CRM quick picks. */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clients = await fetchRecentClientsForCombobox();
    return NextResponse.json({ clients });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
