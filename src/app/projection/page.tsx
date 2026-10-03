"use client";

import { useState } from "react";
import { useData } from "@/lib/data";
import { daysInMonth, monthLabel, parseDay } from "@/lib/dates";
import { cashFlow, monthsLeft, projection, remainingPayments } from "@/lib/finance";
import { rupees } from "@/lib/format";
import { MoneyFlow } from "@/components/MoneyFlow";
import { ProjectionChart } from "@/components/ProjectionChart";
import { useToday } from "@/components/UIProvider";
import { Money, PageTitle, Panel, cx } from "@/components/ui";

export default function ProjectionPage() {
  const { plan, expenses, commitments } = useData();
  const today = useToday();
  const [table, setTable] = useState(false);
  const rows = projection(plan, expenses, commitments, today);
  const end = rows[rows.length - 1];
  const vsPlan = end.projected - end.plan;
  const vsGoal = end.projected - plan.goal;
  const nMonths = monthsLeft(plan, today);
  const periodEndDay = `${plan.periodEnd}-${daysInMonth(plan.periodEnd)}`;
  const weeksLeft = Math.max(0, Math.ceil((+parseDay(periodEndDay) - +parseDay(today)) / (7 * 864e5)));
  const skippedTotal = commitments
    .filter((c) => c.skipped)
    .reduce((a, c) => a + remainingPayments(c).length * c.amount, 0);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4">
      <PageTitle title="Future" jp="未来" sub={`to end of ${monthLabel(plan.periodEnd, "long")}`} />

      <div className="page-grid">
      <section className="panel glow p-4">
        <p className="text-[11px] font-extrabold tracking-wide text-muted uppercase">Projected savings by {monthLabel(plan.periodEnd)}</p>
        <Money value={end.projected} className="block text-[3rem] leading-tight" />
        <div className="mt-1 flex flex-wrap gap-2 text-xs font-bold">
          <Pill good={vsGoal >= 0}>
            {vsGoal >= 0 ? `${rupees(vsGoal)} above` : `${rupees(-vsGoal)} short of`} the {rupees(plan.goal)} goal
          </Pill>
          {Math.abs(vsPlan) < 1 ? (
            <span className="rounded-xl border border-line-strong bg-panel px-2 py-0.5">● Exactly on plan</span>
          ) : (
            <Pill good={vsPlan > 0}>
              {vsPlan > 0 ? `${rupees(vsPlan)} ahead of` : `${rupees(-vsPlan)} behind`} plan
            </Pill>
          )}
        </div>
        <p className="mt-2 text-[11px] font-semibold text-muted">
          Past months use what you actually spent. This month counts the larger of your spending so far and its budget.
          Future months assume budget plus every planned, unskipped payment. Includes the office payout.
        </p>
      </section>

      <Panel title="Savings arc" jp="軌跡" className="lg:col-span-2 xl:row-span-2">
        <ProjectionChart rows={rows} goal={plan.goal} />
        <button className="mt-2 text-xs font-bold underline" onClick={() => setTable((t) => !t)}>
          {table ? "Hide" : "Show"} as table
        </button>
        {table && (
          <table className="mt-2 w-full text-right text-xs">
            <thead className="text-muted">
              <tr>
                <th className="py-1 text-left">Month end</th>
                <th>Projected</th>
                <th>Plan</th>
                <th>Targets</th>
              </tr>
            </thead>
            <tbody className="num">
              {rows.map((r) => (
                <tr key={r.month} className="border-t border-line">
                  <td className="py-1 text-left font-bold">{monthLabel(r.month)}</td>
                  <td>{rupees(r.projected)}</td>
                  <td>{rupees(r.plan)}</td>
                  <td>{rupees(r.target)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="What ₹1k over costs" jp="代償">
        <ul className="space-y-3">
          <Cost label="One slip, ₹1,000 over budget once" value={1000} />
          <Cost label={`₹1,000 over every month (${nMonths} month${nMonths === 1 ? "" : "s"} left)`} value={1000 * nMonths} />
          <Cost label={`₹1,000 over every week (${weeksLeft} weeks left)`} value={1000 * weeksLeft} />
        </ul>
        <p className="mt-3 text-[11px] font-semibold text-muted">
          Every rupee over budget comes straight out of the {monthLabel(plan.periodEnd)} total. A ₹1k-a-week habit is{" "}
          {Math.round(((1000 * weeksLeft) / plan.goal) * 100)}% of your goal.
        </p>
      </Panel>

      {skippedTotal > 0 && (
        <Panel title="Skipped wins" jp="勝利">
          <p className="text-sm font-semibold">
            Skipping planned buys added <Money value={skippedTotal} className="text-green-ink" /> to this projection.
          </p>
        </Panel>
      )}

      <MoneyFlow items={cashFlow(plan, expenses, commitments, today)} className="lg:col-span-2 xl:col-span-3" />
      </div>
    </div>
  );
}

function Pill({ good, children }: { good: boolean; children: React.ReactNode }) {
  return (
    <span className={cx("rounded-xl border border-line-strong px-2 py-0.5", good ? "bg-green/18 text-green-ink" : "bg-red text-white")}>
      {good ? "▲" : "▼"}
      {children}
    </span>
  );
}

function Cost({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex-1 text-sm font-bold">{label}</span>
      <Money value={-value} className="text-lg text-red-ink" />
    </li>
  );
}
