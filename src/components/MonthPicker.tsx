"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, monthRange } from "@/lib/dates";
import type { Plan } from "@/lib/types";

export function defaultMonth(plan: Plan, today: string) {
  const cur = today.slice(0, 7);
  return cur < plan.periodStart ? plan.periodStart : cur > plan.periodEnd ? plan.periodEnd : cur;
}

export function MonthPicker({ plan, value, onChange }: { plan: Plan; value: string; onChange: (m: string) => void }) {
  const months = monthRange(plan.periodStart, plan.periodEnd);
  const i = months.indexOf(value);
  return (
    <div className="flex items-center gap-2">
      <button className="btn bg-panel p-1.5" disabled={i <= 0} onClick={() => onChange(months[i - 1])} aria-label="Previous month">
        <ChevronLeft size={18} strokeWidth={3} />
      </button>
      <div className="flex flex-1 gap-1 overflow-x-auto">
        {months.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`flex-1 rounded-[4px] border-2 px-2 py-1 text-xs font-extrabold ${
              m === value ? "border-line bg-ink text-paper" : "border-line/25"
            } ${plan.tripMonths.includes(m) ? "underline decoration-pink decoration-2 underline-offset-2" : ""}`}
          >
            {monthLabel(m)}
          </button>
        ))}
      </div>
      <button
        className="btn bg-panel p-1.5"
        disabled={i >= months.length - 1}
        onClick={() => onChange(months[i + 1])}
        aria-label="Next month"
      >
        <ChevronRight size={18} strokeWidth={3} />
      </button>
    </div>
  );
}
