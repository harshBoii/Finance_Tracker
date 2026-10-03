"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useData } from "@/lib/data";
import { daysInMonth, parseDay } from "@/lib/dates";
import { budgetsFor, capFor, isMonthly, weeksInMonth } from "@/lib/finance";
import { rupees } from "@/lib/format";
import { Bar, Money, Panel, cx } from "./ui";

const fmt = (day: string, withMonth: boolean) =>
  parseDay(day).toLocaleDateString("en-IN", withMonth ? { day: "numeric", month: "short" } : { day: "numeric" });

/** The month's everyday pool split into Monday-start weeks, with spend vs allotment per week. */
export function WeeklyBudgets({ month, today }: { month: string; today: string }) {
  const { plan, expenses } = useData();
  const weeks = weeksInMonth(plan, expenses, month, today);
  const [open, setOpen] = useState<string | null>(() => weeks.find((w) => w.when === "current")?.from ?? null);
  const budgets = budgetsFor(plan, month);
  const monthlyCats = plan.categories.filter(isMonthly);
  const pool = capFor(plan, month) - monthlyCats.reduce((a, c) => a + (budgets[c.id] ?? 0), 0);
  const fullWeek = Math.round((pool * 7) / daysInMonth(month));
  const spentAll = weeks.reduce((a, w) => a + w.spent, 0);

  return (
    <Panel
      title="Weekly budget"
      jp="週予算"
      right={
        <span className="text-xs font-bold text-muted">
          <Money value={fullWeek} className="text-lg text-ink" /> / week
        </span>
      }
    >
      <ul className="space-y-2">
        {weeks.map((w, i) => {
          const over = w.spent > w.budget;
          const isOpen = open === w.from;
          const daysLeft =
            w.when === "current" ? Math.round((+parseDay(w.to) - +parseDay(today)) / 864e5) + 1 : 0;
          return (
            <li
              key={w.from}
              className={cx(
                "rounded-2xl border px-3 py-2.5",
                w.when === "current" ? "border-pink/50 bg-pink/6" : "border-line",
                w.when === "future" && "opacity-75",
              )}
            >
              <button
                className="flex w-full items-baseline gap-2 text-left text-sm"
                onClick={() => setOpen(isOpen ? null : w.from)}
                aria-expanded={isOpen}
              >
                <span className="font-bold">Week {i + 1}</span>
                <span className="text-[11px] font-semibold text-muted">
                  {fmt(w.from, false)}–{fmt(w.to, true)}
                  {w.days < 7 && ` · ${w.days}d`}
                </span>
                {w.when === "current" && (
                  <span className="rounded-full bg-pink/15 px-1.5 py-px text-[10px] font-bold text-pink-ink">now</span>
                )}
                <span className={cx("ml-auto text-xs font-semibold", over ? "text-red-ink" : "text-muted")}>
                  <Money value={w.spent} className="text-sm text-ink" /> / <Money value={w.budget} />
                </span>
                <ChevronDown size={14} className={cx("self-center text-muted transition-transform", isOpen && "rotate-180")} />
              </button>
              <Bar className="mt-1.5" value={w.spent} max={w.budget} color={w.when === "current" ? "pink" : "violet"} height={8} />
              <p className={cx("mt-1 text-[11px] font-semibold", over ? "text-red-ink" : "text-muted")}>
                {over
                  ? `${rupees(w.spent - w.budget)} over`
                  : w.when === "future"
                    ? "Upcoming"
                    : `${rupees(w.budget - w.spent)} ${w.when === "past" ? "unspent" : "left"}`}
                {w.when === "current" && ` · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
              </p>
              {isOpen && (
                <ul className="mt-2 space-y-2 border-t border-line pt-2">
                  {w.perCat.map((c) => (
                    <li key={c.cat.id}>
                      <div className="mb-0.5 flex items-baseline gap-1.5 text-xs">
                        <span>{c.cat.emoji}</span>
                        <span className="font-bold">{c.cat.name}</span>
                        <span className={cx("ml-auto font-semibold", c.spent > c.budget ? "text-red-ink" : "text-muted")}>
                          <Money value={c.spent} className="text-ink" /> / <Money value={c.budget} />
                        </span>
                      </div>
                      <Bar value={c.spent} max={c.budget} color={c.cat.color} height={6} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 border-t border-line pt-2 text-[11px] font-semibold text-muted">
        <Money value={spentAll} className="text-ink" /> of <Money value={pool} /> weekly pool used this month. Weeks
        that cross the month edge get a share for the days inside it.
        {monthlyCats.length > 0 &&
          ` ${monthlyCats.map((c) => `${c.emoji} ${c.name} (${rupees(budgets[c.id] ?? 0)})`).join(", ")} is a monthly allowance, kept out of the weekly number.`}
      </p>
    </Panel>
  );
}
