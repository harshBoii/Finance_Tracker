import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { sql, ensureSchema } from "./db";

export const COOKIE = "kb_session";
export const MAX_AGE = 60 * 60 * 24 * 180; // stay unlocked on the phone for ~6 months

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return s;
}

const sign = (exp: number) => createHmac("sha256", secret()).update(`kb1.${exp}`).digest("base64url");

export function makeToken() {
  const exp = Date.now() + MAX_AGE * 1000;
  return `${exp}.${sign(exp)}`;
}

export function validToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!exp || exp < Date.now() || !sig) return false;
  const want = Buffer.from(sign(exp));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

export function hasSession(req: Request): boolean {
  const raw = req.headers.get("cookie") ?? "";
  const token = raw
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  return validToken(token);
}

const digest = (s: string) => createHash("sha256").update(s).digest();

export function passwordMatches(input: string): boolean {
  const pw = process.env.APP_PASSWORD;
  if (!pw) throw new Error("APP_PASSWORD is not set");
  return timingSafeEqual(digest(input), digest(pw));
}

const WINDOW_MIN = 15;
const MAX_FAILS = 10;

/** Global limit (single-user app): 10 wrong passwords per 15 minutes, tracked in Postgres. */
export async function tooManyFailures(): Promise<boolean> {
  await ensureSchema();
  const db = sql();
  const [row] = await db`select count(*)::int as n from auth_failures where at > now() - make_interval(mins => ${WINDOW_MIN})`;
  return row.n >= MAX_FAILS;
}

export async function recordFailure() {
  const db = sql();
  await db.transaction([
    db`insert into auth_failures default values`,
    db`delete from auth_failures where at < now() - interval '1 day'`,
  ]);
}

export async function clearFailures() {
  await sql()`delete from auth_failures`;
}
