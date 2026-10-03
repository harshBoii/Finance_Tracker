"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { dayKey } from "./dates";
import { DEMO, demoSnapshot } from "./demo";
import { applyOp, newId, type Op, type Snapshot } from "./ops";
import type { Commitment, Expense, Meta, Plan, Pot, WishItem } from "./types";

export type Status = "loading" | "locked" | "ready" | "error";

export interface DataState extends Snapshot {
  status: Status;
  error: string | null;
  pending: number; // changes waiting to reach the server
  offline: boolean;
}

export interface Actions {
  unlock: (password: string) => Promise<string | null>;
  lock: () => void;
  addExpense: (e: Omit<Expense, "id" | "createdAt">) => string;
  deleteExpense: (id: string) => void;
  restoreExpense: (e: Expense) => void;
  savePlan: (plan: Plan) => void;
  saveMeta: (meta: Partial<Meta>) => void;
  saveCommitment: (c: Commitment) => void;
  deleteCommitment: (id: string) => void;
  setPaid: (c: Commitment, month: string, paid: boolean) => { finished: boolean };
  setSkipped: (c: Commitment, skipped: boolean) => void;
  savePot: (p: Pot) => void;
  deletePot: (id: string) => void;
  adjustPot: (p: Pot, delta: number) => void;
  addWish: (w: Omit<WishItem, "id" | "createdAt" | "status">) => void;
  resolveWish: (w: WishItem, status: "bought" | "dropped") => void;
}

export const DataCtx = createContext<(DataState & Actions) | null>(null);

/* ---------- local persistence: open instantly, log offline ---------- */

const CACHE = "kb.cache.v1";
const QUEUE = "kb.queue.v1";

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJSON(key: string, v: unknown) {
  try {
    if (v == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

const EMPTY: Snapshot = {
  plan: null as unknown as Plan,
  meta: { lastMilestone: 0, celebrated: [] },
  expenses: [],
  commitments: [],
  pots: [],
  wishlist: [],
};

function initial(): DataState {
  const base = { status: "loading" as Status, error: null, pending: 0, offline: false };
  if (typeof window === "undefined") return { ...EMPTY, ...base };
  if (DEMO) return { ...demoSnapshot(), ...base, status: "ready" };
  const cache = readJSON<Snapshot>(CACHE);
  const queue = readJSON<Op[]>(QUEUE) ?? [];
  if (!cache?.plan) return { ...EMPTY, ...base };
  return { ...queue.reduce(applyOp, cache), ...base, status: "ready", pending: queue.length };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>(initial);
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  const queue = useRef<Op[]>([]);
  const busy = useRef(false);
  const again = useRef(false);
  const retry = useRef<ReturnType<typeof setTimeout>>(undefined);

  const lockLocal = useCallback(() => {
    queue.current = [];
    writeJSON(QUEUE, null);
    writeJSON(CACHE, null);
    setState({ ...EMPTY, status: "locked", error: null, pending: 0, offline: false });
  }, []);

  const syncRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const sync = useCallback(async (): Promise<void> => {
    if (DEMO) return;
    if (busy.current) {
      again.current = true; // run once more when the current pass ends
      return;
    }
    busy.current = true;
    clearTimeout(retry.current);
    try {
      // 1. push queued changes, oldest first
      while (queue.current.length) {
        const batch = queue.current.slice(0, 100);
        const res = await fetch("/api/mutate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ops: batch }),
        });
        if (res.status === 401) return lockLocal();
        if (res.status === 400) console.error("[sync] server rejected changes", await res.text());
        else if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? `HTTP ${res.status}`);
        queue.current = queue.current.slice(batch.length);
        writeJSON(QUEUE, queue.current);
        setState((s) => ({ ...s, pending: queue.current.length }));
      }
      // 2. pull the latest (picks up changes made on the other device)
      const res = await fetch(`/api/data?today=${dayKey()}`, { cache: "no-store" });
      if (res.status === 401) return lockLocal();
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? `HTTP ${res.status}`);
      const snap = (await res.json()) as Snapshot;
      writeJSON(CACHE, snap);
      const merged = queue.current.reduce(applyOp, snap); // anything logged mid-fetch stays visible
      setState((s) => ({ ...s, ...merged, status: "ready", error: null, offline: false, pending: queue.current.length }));
    } catch (e) {
      const offline = !navigator.onLine;
      const msg = (e as Error).message;
      setState((s) =>
        s.status === "ready"
          ? { ...s, offline: true }
          : { ...s, status: "error", error: offline ? "You're offline and nothing is cached yet." : msg },
      );
      retry.current = setTimeout(() => void syncRef.current(), 15_000);
    } finally {
      busy.current = false;
    }
    if (again.current) {
      again.current = false;
      return syncRef.current();
    }
  }, [lockLocal]);
  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);

  useEffect(() => {
    if (DEMO) return;
    queue.current = readJSON<Op[]>(QUEUE) ?? [];
    // Syncing with the server is exactly what this effect is for; state updates happen after the fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void sync();
    const onFocus = () => document.visibilityState === "visible" && void sync();
    const onOnline = () => void sync();
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("online", onOnline);
    const t = setInterval(() => document.visibilityState === "visible" && void sync(), 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("online", onOnline);
      clearInterval(t);
    };
  }, [sync]);

  /** Apply now, persist locally, and send in the background. */
  function dispatch(...ops: Op[]) {
    const next = ops.reduce(applyOp, latest.current);
    latest.current = next;
    setState(next);
    if (DEMO) return;
    queue.current = [...queue.current, ...ops];
    writeJSON(QUEUE, queue.current); // CACHE stays the last server copy; the queue is replayed on top at startup
    setState((s) => ({ ...s, pending: queue.current.length }));
    void sync();
  }

  const potFor = (c: Commitment) => latest.current.pots.find((p) => p.commitmentIds.includes(c.id));

  const actions: Actions = {
    async unlock(password) {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      }).catch(() => null);
      if (!res) return "Can't reach the server. Check your connection.";
      if (!res.ok) return ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Couldn't unlock.";
      setState((s) => ({ ...s, status: "loading" }));
      await sync();
      return null;
    },
    lock() {
      void fetch("/api/logout", { method: "POST" }).catch(() => {});
      lockLocal();
    },
    addExpense(e) {
      const id = newId();
      dispatch({ t: "upsert", table: "expenses", doc: { ...e, id, createdAt: Date.now() } });
      return id;
    },
    deleteExpense: (id) => dispatch({ t: "delete", table: "expenses", id }),
    restoreExpense: (e) => dispatch({ t: "upsert", table: "expenses", doc: e }),
    savePlan: (plan) => dispatch({ t: "plan", plan }),
    saveMeta: (meta) => dispatch({ t: "meta", meta: { ...latest.current.meta, ...meta } }),
    saveCommitment: (c) => dispatch({ t: "upsert", table: "commitments", doc: { ...c, months: [...c.months].sort() } }),
    deleteCommitment: (id) => dispatch({ t: "delete", table: "commitments", id }),
    setPaid(c, month, paid) {
      const cur = latest.current.commitments.find((x) => x.id === c.id) ?? c;
      if (cur.paidMonths.includes(month) === paid)
        return { finished: paid && cur.months.every((m) => cur.paidMonths.includes(m)) };
      const paidMonths = paid ? [...cur.paidMonths, month].sort() : cur.paidMonths.filter((m) => m !== month);
      const ops: Op[] = [{ t: "upsert", table: "commitments", doc: { ...cur, paidMonths } }];
      // Paying from a set-aside pot uses up that pot's money; un-paying puts it back.
      const pot = potFor(cur);
      if (pot && paid && pot.saved > 0)
        ops.push({ t: "upsert", table: "pots", doc: { ...pot, saved: Math.max(0, pot.saved - cur.amount) } });
      if (pot && !paid)
        ops.push({ t: "upsert", table: "pots", doc: { ...pot, saved: Math.min(pot.target, pot.saved + cur.amount) } });
      dispatch(...ops);
      return { finished: paid && cur.months.every((m) => paidMonths.includes(m)) };
    },
    setSkipped(c, skipped) {
      if (c.mustPay && skipped) return;
      const cur = latest.current.commitments.find((x) => x.id === c.id) ?? c;
      dispatch({ t: "upsert", table: "commitments", doc: { ...cur, skipped } });
    },
    savePot: (p) => dispatch({ t: "upsert", table: "pots", doc: p }),
    deletePot: (id) => dispatch({ t: "delete", table: "pots", id }),
    adjustPot(p, delta) {
      const cur = latest.current.pots.find((x) => x.id === p.id) ?? p;
      dispatch({ t: "upsert", table: "pots", doc: { ...cur, saved: Math.max(0, cur.saved + delta) } });
    },
    addWish: (w) =>
      dispatch({ t: "upsert", table: "wishlist", doc: { ...w, id: newId(), createdAt: Date.now(), status: "waiting" } }),
    resolveWish(w, status) {
      const ops: Op[] = [{ t: "upsert", table: "wishlist", doc: { ...w, status, resolvedAt: Date.now() } }];
      if (status === "bought")
        ops.push({
          t: "upsert",
          table: "expenses",
          doc: { id: newId(), amount: w.amount, categoryId: w.categoryId, note: w.name, date: dayKey(), createdAt: Date.now() },
        });
      dispatch(...ops);
    },
  };

  return <DataCtx.Provider value={{ ...state, ...actions }}>{children}</DataCtx.Provider>;
}

export function useData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error("useData outside DataProvider");
  return ctx;
}
