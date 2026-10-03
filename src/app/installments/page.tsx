"use client";

import { PartyPopper, TriangleAlert } from "lucide-react";
import { useData } from "@/lib/data";
import { addMonths, monthLabel, monthOf, monthRange } from "@/lib/dates";
import { endMonth, installmentsTotal, isPaid, remainingPayments } from "@/lib/finance";
import { rupees, rupeesShort } from "@/lib/format";
import { MODE_LABEL } from "@/components/DueRow";
import { useToday } from "@/components/UIProvider";
import { usePay } from "@/components/usePay";
import { Bar, Money, PageTitle, Panel, cx } from "@/components/ui";

export default function InstallmentsPage() {
  const { plan, commitments } = useData();
  const today = useToday();
  const pay = usePay();
  const items = commitments.filter((c) => c.mode !== "cash" && !c.skipped);
  const active = items.filter((c) => !isPaid(c));
  const finished = items.filter(isPaid);
  const thisMonth = monthOf(today);
  const lastMonth = items.reduce((m, c) => (endMonth(c) > m ? endMonth(c) : m), plan.periodEnd);
  const months = monthRange(plan.periodStart, lastMonth);
  const maxTotal = Math.max(plan.installmentWarn, ...months.map((m) => installmentsTotal(commitments, m)));

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4">
      <PageTitle title="EMIs" jp="分割払い" sub={`limit ${rupees(plan.installmentWarn)}/month`} />

      <div className="page-grid">
      <Panel title="Monthly load" jp="負担">
        <div className="relative flex gap-1.5">
          {months.map((m) => {
            const t = installmentsTotal(commitments, m);
            const over = t > plan.installmentWarn;
            return (
              <div key={m} className="relative z-[1] flex flex-1 flex-col items-center" title={`${monthLabel(m, "long")}: ${rupees(t)}`}>
                <div className="flex h-28 w-full flex-col items-center justify-end">
                  <span className={cx("num mb-0.5 rounded-full bg-panel px-0.5 text-[10px]", over ? "text-red-ink" : "text-muted")}>{t ? rupeesShort(t) : ""}</span>
                  <div
                    className={cx("w-full rounded-t-[4px] border border-b-0 border-line-strong", over ? "bg-red" : "bg-cyan")}
                    style={{ height: `${(t / maxTotal) * 80}%`, minHeight: t ? 4 : 0 }}
                  />
                </div>
                <span className={cx("h-5 border-t border-line pt-0.5 text-center text-[10px] font-bold w-full", m === thisMonth ? "text-ink" : "text-muted")}>
                  {monthLabel(m)}
                </span>
              </div>
            );
          })}
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-red"
            style={{ bottom: `calc(1.25rem + ${(plan.installmentWarn / maxTotal) * 0.8} * 7rem)` }}
          />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted">
          <TriangleAlert size={13} className="text-red-ink" /> Red bars go over your {rupees(plan.installmentWarn)} monthly limit.
        </p>
      </Panel>

      <Panel title="Active" jp="返済中" className="xl:col-span-2 xl:row-span-2">
        <ul className="space-y-5">
          {active.map((c) => {
            const left = remainingPayments(c);
            const done = c.months.length - left.length;
            const due = left[0];
            return (
              <li key={c.id}>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold">{c.name}</span>
                  <span className="rounded-full border border-line-strong px-1 text-[9px] font-extrabold uppercase">{MODE_LABEL[c.mode]}</span>
                  <Money value={c.amount} className="ml-auto text-lg" />
                  <span className="text-xs font-bold text-muted">/{c.months.length > 1 ? "mo" : "once"}</span>
                </div>
                <Bar value={done} max={c.months.length} color="cyan" height={12} className="mt-1.5" />
                <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-muted">
                  <span>
                    <b className="text-ink">{left.length}</b> left ·{" "}
                    {c.ongoing ? "ongoing" : `ends ${monthLabel(endMonth(c), "long")}`} · {rupees(left.length * c.amount)} to go
                  </span>
                  {due && (
                    <button
                      className={cx("btn ml-auto px-2 py-1 text-[11px]", due <= thisMonth ? "bg-yellow" : "bg-panel")}
                      onClick={() => pay(c, due)}
                    >
                      Pay {monthLabel(due)}
                    </button>
                  )}
                </div>
                {c.note && <p className="mt-0.5 text-[11px] text-muted">{c.note}</p>}
              </li>
            );
          })}
        </ul>
      </Panel>

      {finished.length > 0 && (
        <Panel title="Paid off" jp="完済">
          <ul className="space-y-2">
            {finished.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm font-bold">
                <PartyPopper size={16} className="text-pink-ink" />
                {c.name}
                <span className="text-xs text-muted">done {monthLabel(endMonth(c), "long")}</span>
                <Money value={c.amount * c.months.length} className="ml-auto text-muted" />
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <p className="px-1 text-xs font-semibold text-muted">
        Next month&apos;s installments: <Money value={installmentsTotal(commitments, addMonths(thisMonth, 1))} className="text-ink" />.
      </p>
      </div>
    </div>
  );
}
