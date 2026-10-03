import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { TABLES, type Op, type Snapshot } from "../ops";
import { seedCommitments, seedPlan, seedPots } from "../seed";
import type { Commitment, Expense, Meta, Plan, Pot, WishItem } from "../types";

let client: NeonQueryFunction<false, false> | null = null;
export function sql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return (client ??= neon(process.env.DATABASE_URL));
}

const SCHEMA = [
  `create table if not exists app_state (
     id smallint primary key default 1 check (id = 1),
     plan jsonb not null,
     meta jsonb not null,
     seeded_at timestamptz not null default now()
   )`,
  `create table if not exists expenses (
     id text primary key,
     amount integer not null check (amount >= 0),
     category_id text not null,
     note text,
     date date not null,
     created_at bigint not null
   )`,
  `create index if not exists expenses_date_idx on expenses (date desc)`,
  `create table if not exists commitments (id text primary key, doc jsonb not null, sort integer not null default 0, updated_at timestamptz not null default now())`,
  `create table if not exists pots (id text primary key, doc jsonb not null, sort integer not null default 0, updated_at timestamptz not null default now())`,
  `create table if not exists wishlist (id text primary key, doc jsonb not null, created_at bigint not null, updated_at timestamptz not null default now())`,
  `create table if not exists auth_failures (at timestamptz not null default now())`,
];

let schemaReady: Promise<unknown> | null = null;
export function ensureSchema() {
  const db = sql();
  return (schemaReady ??= db.transaction(SCHEMA.map((q) => db.query(q))).catch((e) => {
    schemaReady = null;
    throw e;
  }));
}

/** Everything the app needs, seeding the Oct → Mar plan on the very first load. */
export async function loadAll(today: string): Promise<Snapshot> {
  await ensureSchema();
  const db = sql();
  let state = await db`select plan, meta from app_state where id = 1`;
  if (state.length === 0) {
    await seed(today);
    state = await db`select plan, meta from app_state where id = 1`;
  }
  const [expenses, commitments, pots, wishlist] = await db.transaction(
    [
      db`select id, amount, category_id, note, to_char(date, 'YYYY-MM-DD') as date, created_at::float8 as created_at
         from expenses order by date desc, created_at desc`,
      db`select doc from commitments order by sort`,
      db`select doc from pots order by sort`,
      db`select doc from wishlist order by created_at desc`,
    ],
    { readOnly: true },
  );
  return {
    plan: state[0].plan as Plan,
    meta: { lastMilestone: 0, celebrated: [], ...(state[0].meta as Partial<Meta>) },
    expenses: expenses.map(
      (r): Expense => ({
        id: r.id,
        amount: r.amount,
        categoryId: r.category_id,
        note: r.note ?? undefined,
        date: r.date,
        createdAt: Number(r.created_at),
      }),
    ),
    commitments: commitments.map((r) => r.doc as Commitment),
    pots: pots.map((r) => r.doc as Pot),
    wishlist: wishlist.map((r) => r.doc as WishItem),
  };
}

async function seed(today: string) {
  const db = sql();
  const plan = seedPlan(today);
  await db.transaction([
    db`insert into app_state (id, plan, meta) values (1, ${JSON.stringify(plan)}::jsonb, ${JSON.stringify({ lastMilestone: 0, celebrated: [] })}::jsonb)
       on conflict (id) do nothing`,
    ...seedCommitments().map(
      (c) => db`insert into commitments (id, doc, sort) values (${c.id}, ${JSON.stringify(c)}::jsonb, ${c.order}) on conflict (id) do nothing`,
    ),
    ...seedPots().map(
      (p) => db`insert into pots (id, doc, sort) values (${p.id}, ${JSON.stringify(p)}::jsonb, ${p.order}) on conflict (id) do nothing`,
    ),
  ]);
}

/* ---------- writes ---------- */

const ID = /^[\w-]{1,80}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Rejects anything malformed before it reaches SQL. Returns an error message or null. */
export function validate(op: unknown): string | null {
  const o = op as Op;
  if (!o || typeof o !== "object") return "op must be an object";
  if (o.t === "plan") return o.plan && typeof o.plan === "object" && Array.isArray(o.plan.categories) ? null : "bad plan";
  if (o.t === "meta") return o.meta && typeof o.meta === "object" ? null : "bad meta";
  if (o.t !== "upsert" && o.t !== "delete") return "unknown op";
  if (!TABLES.includes(o.table)) return "unknown table";
  if (o.t === "delete") return ID.test(o.id) ? null : "bad id";
  if (!o.doc || !ID.test(o.doc.id)) return "bad doc id";
  if (o.table === "expenses") {
    const e = o.doc;
    if (!Number.isInteger(e.amount) || e.amount < 0 || e.amount > 10_000_000) return "bad amount";
    if (!DAY.test(e.date) || typeof e.categoryId !== "string") return "bad expense";
  }
  return null;
}

export async function applyOps(ops: Op[]) {
  await ensureSchema();
  const db = sql();
  const queries = ops.map((op) => {
    switch (op.t) {
      case "plan":
        return db`update app_state set plan = ${JSON.stringify(op.plan)}::jsonb where id = 1`;
      case "meta":
        return db`update app_state set meta = ${JSON.stringify(op.meta)}::jsonb where id = 1`;
      case "delete":
        // Table names come from the validated whitelist, never from free text.
        return db.query(`delete from ${op.table} where id = $1`, [op.id]);
      case "upsert": {
        if (op.table === "expenses") {
          const e = op.doc;
          return db`insert into expenses (id, amount, category_id, note, date, created_at)
                    values (${e.id}, ${e.amount}, ${e.categoryId}, ${e.note ?? null}, ${e.date}, ${e.createdAt})
                    on conflict (id) do update set amount = excluded.amount, category_id = excluded.category_id,
                      note = excluded.note, date = excluded.date`;
        }
        const doc = JSON.stringify(op.doc);
        if (op.table === "wishlist")
          return db`insert into wishlist (id, doc, created_at) values (${op.doc.id}, ${doc}::jsonb, ${op.doc.createdAt})
                    on conflict (id) do update set doc = excluded.doc, updated_at = now()`;
        return db.query(
          `insert into ${op.table} (id, doc, sort) values ($1, $2::jsonb, $3)
           on conflict (id) do update set doc = excluded.doc, sort = excluded.sort, updated_at = now()`,
          [op.doc.id, doc, op.doc.order],
        );
      }
    }
  });
  if (queries.length) await db.transaction(queries);
}
