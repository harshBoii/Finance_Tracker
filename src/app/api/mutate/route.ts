import type { Op } from "@/lib/ops";
import { applyOps, validate } from "@/lib/server/db";
import { hasSession } from "@/lib/server/session";

export async function POST(req: Request) {
  if (!hasSession(req)) return Response.json({ error: "locked" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { ops?: unknown } | null;
  const ops = body?.ops;
  if (!Array.isArray(ops) || ops.length > 200) return Response.json({ error: "ops must be an array (max 200)" }, { status: 400 });
  for (const op of ops) {
    const err = validate(op);
    if (err) return Response.json({ error: err }, { status: 400 });
  }
  try {
    await applyOps(ops as Op[]);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
