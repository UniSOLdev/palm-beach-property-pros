import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { loadTaskDashboardSummary } from "@/lib/tasks/queries";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await loadTaskDashboardSummary();
  return NextResponse.json({ summary });
}
