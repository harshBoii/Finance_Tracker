"use client";

import { useEffect, useState } from "react";
import { Delete, Hourglass, StickyNote } from "lucide-react";
import { useData } from "@/lib/data";
import { budgetsFor, isMonthly, spentInMonth, weekStats } from "@/lib/finance";
import { monthOf } from "@/lib/dates";
import { rupees, rupeesShort } from "@/lib/format";
import type { Category } from "@/lib/types";
import { Money, Sheet, cx, tone } from "./ui";
import { useToday, useUI } from "./UIProvider";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "del"];

/** Amount → tap a category = saved. Big amounts get one extra step: planned, or 48h wishlist? */
export function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} label="Quick add expense">
      {open && <QuickAddBody onClose={onClose} />}
    </Sheet>
  );
}

function QuickAddBody({ onClose }: { onClose: () => void }) {
  const { plan, expenses, addExpense, deleteExpense, addWish } = useData();
  const { toast } = useUI();
  const today = useToday();
  const [raw, setRaw] = useState("");
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [pending, setPending] = useState<Category | null>(null);
  const [wishName, setWishName] = useState("");

  const amount = Number(raw || 0);
  const week = weekStats(plan, expenses, today);

  function press(k: string) {
    if (k === "del") return setRaw((r) => r.slice(0, -1));
    setRaw((r) => (r + k).replace(/^0+/, "").slice(0, 7));
  }

  // Mac: type digits on the keyboard too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (/^\d$/.test(e.key)) setRaw((r) => (r + e.key).replace(/^0+/, "").slice(0, 7));
      else if (e.key === "Backspace") setRaw((r) => r.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function pick(cat: Category) {
    if (amount <= 0) return;
    if (amount > plan.wishlistThreshold) {
      setWishName(note);
      setPending(cat);
      return;
    }
    save(cat);
  }

  function save(cat: Category) {
    const id = addExpense({ amount, categoryId: cat.id, note: note.trim() || undefined, date: today });
    onClose();
    toast(`${rupees(amount)} · ${cat.name} logged`, { label: "Undo", run: () => deleteExpense(id) });
  }

  function toWishlist(cat: Category) {
    addWish({ name: wishName.trim() || cat.name, amount, categoryId: cat.id });
    onClose();
    toast(`On the wishlist. Decide in ${plan.wishlistHours}h ⏳`);
  }

  if (pending) {
    return (
      <div className="p-5 pt-6">
        <p className="jp text-xs text-pink-ink">ちょっと待って</p>
        <h2 className="display mt-1 text-3xl">Hold up!</h2>
        <p className="mt-2 text-sm font-semibold text-muted">
          <Money value={amount} className="text-ink" /> is over {rupees(plan.wishlistThreshold)}. Was this planned?
        </p>
        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-muted">
          What is it?
          <input
            className="field mt-1"
            value={wishName}
            onChange={(e) => setWishName(e.target.value)}
            placeholder={pending.name}
          />
        </label>
        <div className="mt-5 grid gap-3">
          <button className="btn py-3 btn-primary" onClick={() => toWishlist(pending)}>
            <Hourglass size={18} strokeWidth={2.5} /> Impulse: wishlist it for {plan.wishlistHours}h
          </button>
          <button className="btn py-3" onClick={() => save(pending)}>
            Planned: log it now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-5">
      <div className="flex items-baseline gap-2 pr-10">
        <span className="display text-xl">Quick add</span>
        <span aria-hidden className="jp text-xs text-pink-ink">
          記録
        </span>
      </div>

      <div className="mt-2 flex items-center justify-center rounded-3xl bg-gradient-to-br from-pink/12 to-violet/12 py-4">
        <span className={cx("num text-[3.2rem] leading-none", !raw && "text-muted/60")} aria-live="polite">
          <span className="cur">₹</span>
          {raw ? Number(raw).toLocaleString("en-IN") : "0"}
        </span>
      </div>

      {noteOpen ? (
        <input
          className="field mt-2 text-sm"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
          enterKeyHint="done"
        />
      ) : (
        <button
          className="mt-2 flex items-center gap-1 text-xs font-bold text-muted"
          onClick={() => setNoteOpen(true)}
        >
          <StickyNote size={14} /> add note
        </button>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        {plan.categories.map((cat) => {
          const monthly = isMonthly(cat);
          const c = week.perCat.find((p) => p.cat.id === cat.id);
          const left = monthly
            ? (budgetsFor(plan, monthOf(today))[cat.id] ?? 0) - spentInMonth(expenses, monthOf(today), cat.id)
            : c
              ? c.budget - c.spent
              : 0;
          return (
            <button
              key={cat.id}
              disabled={amount <= 0}
              onClick={() => pick(cat)}
              className="flex flex-col items-center rounded-2xl border px-1 py-2 text-[13px] leading-tight font-bold transition-transform active:scale-95 disabled:opacity-50"
              style={{
                borderColor: `color-mix(in srgb, ${tone(cat.color)} 40%, transparent)`,
                background: `color-mix(in srgb, ${tone(cat.color)} 12%, var(--panel))`,
              }}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="truncate">{cat.name}</span>
              <span className={cx("text-[10px] font-semibold", left < 0 ? "text-red-ink" : "text-muted")}>
                {rupeesShort(left)} left/{monthly ? "mo" : "wk"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            aria-label={k === "del" ? "Delete digit" : k}
            className="num flex h-12 items-center justify-center rounded-2xl bg-sunk text-xl active:bg-pink/20"
          >
            {k === "del" ? <Delete size={22} /> : k}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] font-semibold text-muted">Type the amount, then tap a category to save.</p>
    </div>
  );
}
