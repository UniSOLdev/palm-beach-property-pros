import { NextResponse } from "next/server";
import { requireOwnerRole } from "@/lib/admin/auth";
import { runAIAssist, type AIAssistTask } from "@/lib/platform/ai-assistant";

export async function POST(request: Request) {
  try {
    await requireOwnerRole();
    const body = (await request.json()) as { task?: AIAssistTask; context?: string };
    if (!body.task || !body.context?.trim()) {
      return NextResponse.json({ error: "Missing task or context" }, { status: 400 });
    }
    const result = await runAIAssist(body.task, body.context);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unauthorized" },
      { status: 401 },
    );
  }
}
