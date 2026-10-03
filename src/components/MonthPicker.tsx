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
      <button className="btn p-1.5" disabled={i <= 0} onClick={() => onChange(months[i - 1])} aria-label="Previous month">
        <ChevronLeft size={18} strokeWidth={2.5} />
      </button>
      <div className="flex flex-1 gap-1 overflow-x-auto">
        {months.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`chip flex-1 px-2 py-1.5 text-xs ${m === value ? "chip-on" : "text-muted"}`}
          >
            {monthLabel(m)}
            {plan.tripMonths.includes(m) && <span aria-label="trip month"> ✈︎</span>}
          </button>
        ))}
      </div>
      <button
        className="btn p-1.5"
        disabled={i >= months.length - 1}
        onClick={() => onChange(months[i + 1])}
        aria-label="Next month"
      >
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
