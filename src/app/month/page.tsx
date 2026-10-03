"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { useData } from "@/lib/data";
import { dayLabel, monthLabel, monthOf } from "@/lib/dates";
import { budgetsFor, inflowsIn, isTripMonth, monthSummary, salaryShare, spentInMonth, takeHome } from "@/lib/finance";
import { rupees } from "@/lib/format";
import { DueRow } from "@/components/DueRow";
import { ExpenseList } from "@/components/ExpenseList";
import { MonthPicker, defaultMonth } from "@/components/MonthPicker";
import { WeeklyBudgets } from "@/components/WeeklyBudgets";
import { useToday } from "@/components/UIProvider";
import { Bar, Empty, Money, PageTitle, Panel, cx } from "@/components/ui";

export default function MonthPage() {
  const { plan, expenses, commitments } = useData();
  const today = useToday();
  const [month, setMonth] = useState(() => defaultMonth(plan, today));
  const s = monthSummary(plan, expenses, commitments, month, today);
  const budgets = budgetsFor(plan, month);
  const fixed = s.due.filter((d) => d.c.mode !== "cash");
  const oneTime = s.due.filter((d) => d.c.mode === "cash");
  const fixedTotal = fixed.reduce((a, d) => a + d.c.amount, 0);
  const ins = inflowsIn(plan, month);
  const isCurrent = month === monthOf(today);
  const isPast = month < monthOf(today);
  const shownSaved = isPast ? s.savedSoFar : s.projectedSaved;
  const items = expenses.filter((e) => monthOf(e.date) === month);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4">
      <PageTitle
        title={monthLabel(month, "long")}
        jp="今月"
        sub={isTripMonth(plan, month) ? <span className="text-pink-ink">Trip month ✈︎</span> : undefined}
      />
      <MonthPicker plan={plan} value={month} onChange={setMonth} />

      <div className="page-grid">
      {/* savings vs target */}
      <Panel title="Savings" jp="貯金">
        <div className="grid grid-cols-2 gap-3">
          <Stat label={isPast ? "Saved" : isCurrent ? "On track to save" : "Planned to save"}>
            <Money value={shownSaved} className={cx("text-[1.9rem] leading-none", shownSaved < s.target && "text-red-ink")} />
          </Stat>
          <Stat label="Target">
            <Money value={s.target} className="text-[1.9rem] leading-none" />
          </Stat>
        </div>
        <Bar className="mt-3" value={Math.max(0, shownSaved)} max={s.target} color="green" height={14} />
        <p className="mt-2 text-xs font-semibold text-muted">
          {shownSaved >= s.target
            ? `Ahead of target by ${rupees(shownSaved - s.target)}.`
            : `${rupees(s.target - shownSaved)} short of target.`}
          {isCurrent && (
            <>
              {" "}
              Saved so far: <Money value={s.savedSoFar} className="text-ink" />.
            </>
          )}
        </p>
      </Panel>

      {/* income */}
      <Panel title="Income" jp="収入" right={<Money value={s.income} className="text-lg" />}>
        {ins.length === 0 ? (
          <Empty>No income lands this month.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {ins.map((i) => (
              <li key={i.label + i.date} className="flex items-center gap-2 text-sm">
                <span className={cx("font-bold", i.date > today && "text-muted")}>{i.label}</span>
                <span className="text-[11px] font-semibold text-muted">
                  {dayLabel(i.date)}
                  {i.date > today ? "· upcoming" : ""}
                </span>
                <Money value={i.amount} className="ml-auto" />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 border-t border-line pt-2 text-[11px] font-semibold text-muted">
          Salary {rupees(plan.salary.gross)} − office scheme {rupees(plan.salary.officeScheme)} = {rupees(takeHome(plan))}{" "}
          take-home − parents {rupees(plan.salary.toParents)} = <b className="text-ink">{rupees(salaryShare(plan))} yours</b>.
          Laptop fund {rupees(plan.laptopFund)} is kept separate.
        </p>
      </Panel>

      {/* fixed payments */}
      <Panel title="Fixed payments" jp="固定費" right={<Money value={fixedTotal} className="text-lg" />}>
        {fixedTotal > plan.installmentWarn && (
          <p className="mb-2 flex items-center gap-2 rounded-xl border border-red bg-red/10 px-2 py-1.5 text-xs font-bold text-red-ink">
            <TriangleAlert size={14} /> Above your {rupees(plan.installmentWarn)} installment limit.
          </p>
        )}
        {fixed.length ? (
          <ul className="divide-y divide-line">
            {fixed.map((d) => (
              <DueRow key={d.c.id} c={d.c} month={month} paid={d.paid} />
            ))}
          </ul>
        ) : (
          <Empty>No installments this month.</Empty>
        )}
      </Panel>

      {oneTime.length > 0 && (
        <Panel title="One-time" jp="特別" right={<Money value={oneTime.reduce((a, d) => a + d.c.amount, 0)} className="text-lg" />}>
          <ul className="divide-y divide-line">
            {oneTime.map((d) => (
              <DueRow key={d.c.id} c={d.c} month={month} paid={d.paid} />
            ))}
          </ul>
        </Panel>
      )}

      {/* budget vs actual */}
      <Panel title="Budget vs actual" jp="予算">
        <div className="mb-3 flex items-baseline gap-2">
          <Money value={s.spent} className={cx("text-[1.6rem] leading-none", s.spent > s.cap && "text-red-ink")} />
          <span className="text-sm font-bold text-muted">
            of <Money value={s.cap} /> everyday cap
          </span>
        </div>
        <Bar value={s.spent} max={s.cap} color="yellow" height={14} />
        <ul className="mt-4 space-y-3">
          {plan.categories.map((cat) => {
            const spent = spentInMonth(expenses, month, cat.id);
            const budget = budgets[cat.id] ?? 0;
            return (
              <li key={cat.id}>
                <div className="mb-1 flex items-baseline gap-2 text-sm">
                  <span>{cat.emoji}</span>
                  <span className="font-bold">{cat.name}</span>
                  <span className={cx("ml-auto text-xs font-semibold", spent > budget ? "text-red-ink" : "text-muted")}>
                    <Money value={spent} className="text-sm text-ink" /> / <Money value={budget} />
                  </span>
                </div>
                <Bar value={spent} max={budget} color={cat.color} height={10} />
              </li>
            );
          })}
        </ul>
      </Panel>

      <WeeklyBudgets key={month} month={month} today={today} />

      <Panel title="Expenses" jp="支出" right={<span className="text-xs font-bold text-muted">{items.length} logged</span>}>
        <ExpenseList items={items} empty="Nothing logged this month." />
      </Panel>
      </div>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-extrabold tracking-wide text-muted uppercase">{label}</p>
      {children}
    </div>
  );
}
