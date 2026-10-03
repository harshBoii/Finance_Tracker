import { COOKIE } from "@/lib/server/session";

export async function POST() {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` } });
}
