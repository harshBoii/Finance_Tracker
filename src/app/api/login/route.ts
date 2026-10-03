import { COOKIE, MAX_AGE, clearFailures, makeToken, passwordMatches, recordFailure, tooManyFailures } from "@/lib/server/session";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: unknown };
  if (typeof password !== "string" || !password) return Response.json({ error: "Enter the password." }, { status: 400 });

  try {
    if (await tooManyFailures())
      return Response.json({ error: "Too many wrong attempts. Try again in 15 minutes." }, { status: 429 });
    if (!passwordMatches(password)) {
      await recordFailure();
      await new Promise((r) => setTimeout(r, 600));
      return Response.json({ error: "Wrong password." }, { status: 401 });
    }
    await clearFailures();
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": `${COOKIE}=${makeToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure}` } },
  );
}
