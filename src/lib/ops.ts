import type { Commitment, Expense, Meta, Plan, Pot, WishItem } from "./types";

/** Every change is one of these. The client applies it instantly, then the server replays it into Postgres. */
export interface Docs {
  expenses: Expense;
  commitments: Commitment;
  pots: Pot;
  wishlist: WishItem;
}
export type Table = keyof Docs;
export const TABLES: Table[] = ["expenses", "commitments", "pots", "wishlist"];

export type Op =
  | { [K in Table]: { t: "upsert"; table: K; doc: Docs[K] } | { t: "delete"; table: K; id: string } }[Table]
  | { t: "plan"; plan: Plan }
  | { t: "meta"; meta: Meta };

export interface Snapshot {
  plan: Plan;
  meta: Meta;
  expenses: Expense[];
  commitments: Commitment[];
  pots: Pot[];
  wishlist: WishItem[];
}

const SORTS: { [K in Table]: (a: Docs[K], b: Docs[K]) => number } = {
  expenses: (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
  commitments: (a, b) => a.order - b.order,
  pots: (a, b) => a.order - b.order,
  wishlist: (a, b) => b.createdAt - a.createdAt,
};

export function applyOp<S extends Snapshot>(s: S, op: Op): S {
  switch (op.t) {
    case "plan":
      return { ...s, plan: op.plan };
    case "meta":
      return { ...s, meta: op.meta };
    case "delete":
      return { ...s, [op.table]: (s[op.table] as { id: string }[]).filter((d) => d.id !== op.id) };
    case "upsert": {
      const list = (s[op.table] as { id: string }[]).filter((d) => d.id !== op.doc.id);
      const sort = SORTS[op.table] as (a: unknown, b: unknown) => number;
      return { ...s, [op.table]: [...list, op.doc].sort(sort) };
    }
  }
}

export function newId() {
  return crypto.randomUUID();
}
