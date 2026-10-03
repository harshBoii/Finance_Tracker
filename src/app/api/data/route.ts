import { loadAll } from "@/lib/server/db";
import { hasSession } from "@/lib/server/session";

export async function GET(req: Request) {
  if (!hasSession(req)) return Response.json({ error: "locked" }, { status: 401 });
  // The client's local date, used only to stamp "cash on hand as of" when seeding.
  const today = new URL(req.url).searchParams.get("today") ?? "";
  try {
    const data = await loadAll(/^\d{4}-\d{2}-\d{2}$/.test(today) ? today : new Date().toISOString().slice(0, 10));
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
