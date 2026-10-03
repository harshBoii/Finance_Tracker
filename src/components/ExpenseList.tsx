"use client";

import { Trash2 } from "lucide-react";
import { useData } from "@/lib/data";
import { dayLabel } from "@/lib/dates";
import { rupees } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { Empty, Money } from "./ui";
import { useUI } from "./UIProvider";

export function ExpenseList({ items, empty = "Nothing logged yet." }: { items: Expense[]; empty?: string }) {
  const { plan, deleteExpense, restoreExpense } = useData();
  const { toast } = useUI();
  if (items.length === 0) return <Empty>{empty}</Empty>;

  return (
    <ul className="divide-y-2 divide-line/10">
      {items.map((e) => {
        const cat = plan.categories.find((c) => c.id === e.categoryId);
        return (
          <li key={e.id} className="flex items-center gap-3 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-line bg-sunk text-lg">
              {cat?.emoji ?? "•"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{e.note || cat?.name || "Other"}</p>
              <p className="text-[11px] font-semibold text-muted">
                {dayLabel(e.date)}
                {e.note && cat ? ` · ${cat.name}` : ""}
              </p>
            </div>
            <Money value={e.amount} className="text-base" />
            <button
              aria-label={`Delete ${rupees(e.amount)} expense`}
              className="rounded p-1.5 text-muted hover:text-red"
              onClick={() => {
                deleteExpense(e.id);
                toast(`Deleted ${rupees(e.amount)}`, { label: "Undo", run: () => restoreExpense(e) });
              }}
            >
              <Trash2 size={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
