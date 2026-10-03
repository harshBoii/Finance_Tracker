"use client";

import { Trash2 } from "lucide-react";
import { useData } from "@/lib/data";
import { dayLabel } from "@/lib/dates";
import { rupees } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { Empty, Money } from "./ui";
import { useToday, useUI } from "./UIProvider";

export function ExpenseList({ items, empty = "Nothing logged yet." }: { items: Expense[]; empty?: string }) {
  const { plan, deleteExpense, restoreExpense } = useData();
  const { toast } = useUI();
  const today = useToday();
  if (items.length === 0) return <Empty>{empty}</Empty>;

  return (
    <ul className="divide-y divide-line">
      {items.map((e) => {
        const cat = plan.categories.find((c) => c.id === e.categoryId);
        const upcoming = e.date > today;
        return (
          <li key={e.id} className="flex items-center gap-3 py-2">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
              style={{ background: `color-mix(in srgb, var(--${cat?.color ?? "violet"}) 16%, var(--panel))` }}
            >
              {cat?.emoji ?? "•"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{e.note || cat?.name || "Other"}</p>
              <p className="text-[11px] font-semibold text-muted">
                {dayLabel(e.date)}
                {e.note && cat ? ` · ${cat.name}` : ""}
                {upcoming && <span className="ml-1.5 rounded-full bg-cyan/15 px-1.5 py-px text-[10px] text-cyan-ink">upcoming</span>}
              </p>
            </div>
            <Money value={e.amount} className="text-base" />
            <button
              aria-label={`Delete ${rupees(e.amount)} expense`}
              className="rounded-full p-1.5 text-muted hover:bg-red/10 hover:text-red-ink"
              onClick={() => {
                deleteExpense(e.id);
                toast(`Deleted ${rupees(e.amount)}`, { label: "Undo", run: () => restoreExpense(e) });
              }}
            >
              <Trash2 size={15} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
