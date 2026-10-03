"use client";

import { useState } from "react";
import { Lock, Pencil, Plus } from "lucide-react";
import { useData } from "@/lib/data";
import { monthLabel, monthOf } from "@/lib/dates";
import { currentBalance, endMonth, isPaid, remainingPayments, upcomingCommitted } from "@/lib/finance";
import { rupees, rupeesShort } from "@/lib/format";
import type { Commitment, Pot } from "@/lib/types";
import { CommitmentEditor, blankCommitment } from "@/components/CommitmentEditor";
import { MODE_LABEL } from "@/components/DueRow";
import { useToday, useUI } from "@/components/UIProvider";
import { usePay } from "@/components/usePay";
import { Bar, JpTag, Money, PageTitle, Panel, cx } from "@/components/ui";

export default function PlanPage() {
  const { plan, expenses, commitments, pots } = useData();
  const today = useToday();
  const [editing, setEditing] = useState<Commitment | null>(null);
  const balance = currentBalance(plan, expenses, commitments, today);
  const committed = upcomingCommitted(commitments);
  const inPots = pots.reduce((a, p) => a + p.saved, 0);

  // Group by the month the item is next due (or its last month once done).
  const groups = new Map<string, Commitment[]>();
  for (const c of commitments) {
    const key = remainingPayments(c)[0] ?? endMonth(c) ?? plan.periodStart;
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  const months = [...groups.keys()].sort();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageTitle title="The plan" jp="計画" />

      {/* what's already spoken for */}
      <section className="panel halftone grid grid-cols-3 divide-x-2 divide-line/15 p-0">
        <Cell label="Savings now" jp="貯金">
          <Money value={balance} className="text-xl" />
        </Cell>
        <Cell label="Committed" jp="予定">
          <Money value={committed} className="text-xl text-pink" />
        </Cell>
        <Cell label="After that" jp="残り">
          <Money value={balance - committed} className={cx("text-xl", balance - committed < 0 && "text-red")} />
        </Cell>
      </section>
      <p className="-mt-2 px-1 text-xs font-semibold text-muted">
        Committed = every unpaid planned item and installment left, including EMIs past March. Future salary covers
        part of it, so a negative &ldquo;after that&rdquo; isn&apos;t a crisis, just what&apos;s already spoken for. Pots hold{" "}
        <Money value={inPots} className="text-ink" /> of your savings, earmarked and not spendable.
      </p>

      <Panel title="Set-aside pots" jp="積立">
        <div className="space-y-4">
          {pots.map((p) => (
            <PotCard key={p.id} pot={p} />
          ))}
        </div>
      </Panel>

      <Panel
        title="Checklist"
        jp="買う物"
        right={
          <button
            className="btn bg-yellow px-2 py-1 text-xs text-on-accent"
            onClick={() => setEditing(blankCommitment(monthOf(today) < plan.periodStart ? plan.periodStart : monthOf(today), commitments.length))}
          >
            <Plus size={14} strokeWidth={3} /> Add
          </button>
        }
      >
        <div className="space-y-5">
          {months.map((m) => (
            <div key={m}>
              <h3 className="mb-1 flex items-center gap-2 text-xs font-extrabold tracking-wider text-muted uppercase">
                {monthLabel(m, "long")}
                {m === monthOf(today) && <JpTag>今月</JpTag>}
              </h3>
              <ul className="divide-y-2 divide-line/10">
                {groups.get(m)!.map((c) => (
                  <ChecklistRow key={c.id} c={c} onEdit={() => setEditing(c)} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>

      <CommitmentEditor item={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function Cell({ label, jp, children }: { label: string; jp: string; children: React.ReactNode }) {
  return (
    <div className="p-3">
      <p className="mb-1 text-[10px] font-extrabold tracking-wide whitespace-nowrap text-muted uppercase">
        {label}{" "}
        <span aria-hidden className="jp hidden text-[9px] opacity-70 sm:inline">
          {jp}
        </span>
      </p>
      {children}
    </div>
  );
}

function PotCard({ pot }: { pot: Pot }) {
  const { commitments, adjustPot } = useData();
  const { toast } = useUI();
  const [amt, setAmt] = useState("");
  const linked = commitments.filter((c) => pot.commitmentIds.includes(c.id));
  const used = linked.length > 0 && linked.every(isPaid);
  const n = Number(amt) || 0;

  function move(delta: number) {
    if (!delta) return;
    adjustPot(pot, delta);
    setAmt("");
    toast(delta > 0 ? `${rupees(delta)} set aside for ${pot.name}` : `${rupees(-delta)} taken out of ${pot.name}`);
  }

  return (
    <div>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="font-extrabold">{pot.name}</span>
        <span aria-hidden className="jp text-[10px] text-pink">
          {pot.jp}
        </span>
        <span className="ml-auto text-sm font-semibold text-muted">
          <Money value={pot.saved} className="text-base text-ink" /> / <Money value={pot.target} />
        </span>
      </div>
      <Bar value={pot.saved} max={pot.target} color={used ? "green" : "violet"} height={16} />
      <p className="mt-1 text-[11px] font-semibold text-muted">
        {used
          ? "Paid out ✓"
          : pot.saved >= pot.target
            ? "Fully funded!"
            : `${rupees(pot.target - pot.saved)} to go`}
        {linked.length > 0 && ` · for ${linked.map((c) => c.name).join(", ")}`}
      </p>
      {!used && (
        <div className="mt-2 flex gap-2">
          {[1000, 2000].map((v) => (
            <button key={v} className="btn bg-panel px-2 py-1 text-xs whitespace-nowrap" onClick={() => move(v)}>
              +{rupeesShort(v)}
            </button>
          ))}
          <input
            className="field num min-w-0 flex-1 py-1 text-sm"
            inputMode="numeric"
            placeholder="₹"
            value={amt}
            onChange={(e) => setAmt(e.target.value.replace(/\D/g, ""))}
            aria-label={`Amount for ${pot.name}`}
          />
          <button className="btn bg-violet px-2 py-1 text-xs text-white" disabled={!n} onClick={() => move(n)}>
            Add
          </button>
          <button className="btn bg-panel px-2 py-1 text-xs whitespace-nowrap" disabled={!n || pot.saved === 0} onClick={() => move(-n)}>
            Take out
          </button>
        </div>
      )}
    </div>
  );
}

function ChecklistRow({ c, onEdit }: { c: Commitment; onEdit: () => void }) {
  const { setSkipped } = useData();
  const { celebrate, toast } = useUI();
  const pay = usePay();
  const left = remainingPayments(c);
  const paid = isPaid(c);
  const status = c.skipped ? "skipped" : paid ? "paid" : "planned";
  const multi = c.months.length > 1;
  const remainingAmt = left.length * c.amount;

  function skip() {
    if (c.mustPay) return;
    setSkipped(c, true);
    if (c.optional)
      celebrate({ title: `+${rupees(remainingAmt)}`, jp: "やった!", sub: `Skipped ${c.name}. That goes straight to your March projection.` });
    else toast(`Skipped ${c.name}: +${rupees(remainingAmt)} to projection`, { label: "Undo", run: () => setSkipped(c, false) });
  }

  return (
    <li className="py-2.5">
      <div className="flex items-start gap-2">
        <p className={cx("flex min-w-0 flex-1 items-center gap-1 text-sm font-bold", status !== "planned" && "text-muted line-through")}>
          {c.mustPay && <Lock size={13} strokeWidth={3} aria-label="Must pay, can't be skipped" className="shrink-0 text-ink" />}
          <span className="truncate">{c.name}</span>
          {c.optional && <span className="shrink-0 rounded-[3px] border border-line/40 px-1 text-[9px] font-extrabold uppercase">optional</span>}
        </p>
        <Money value={multi ? remainingAmt || c.amount * c.months.length : c.amount} className="text-base" />
      </div>
      <p className="mt-0.5 text-[11px] font-semibold text-muted">
        {MODE_LABEL[c.mode]}
        {multi
          ? ` · ${rupees(c.amount)} × ${c.months.length} · ${c.months.length - left.length}/${c.months.length} paid`
          : ` · ${monthLabel(c.months[0])}`}
        {c.note ? ` · ${c.note}` : ""}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <StatusChip status={status} />
        <div className="ml-auto flex items-center gap-1.5">
          {status === "planned" && (
            <>
              {!c.mustPay && (
                <button className="btn bg-panel px-2.5 py-1 text-xs" onClick={skip}>
                  Skip
                </button>
              )}
              <button className="btn bg-green px-2.5 py-1 text-xs text-on-accent" onClick={() => pay(c, left[0])}>
                {multi ? `Pay ${monthLabel(left[0])}` : "Paid"}
              </button>
            </>
          )}
          {status === "skipped" && (
            <button className="btn bg-panel px-2.5 py-1 text-xs" onClick={() => setSkipped(c, false)}>
              Restore
            </button>
          )}
          <button className="p-1 text-muted" onClick={onEdit} aria-label={`Edit ${c.name}`}>
            <Pencil size={15} />
          </button>
        </div>
      </div>
    </li>
  );
}

function StatusChip({ status }: { status: "planned" | "paid" | "skipped" }) {
  const style = {
    planned: "bg-panel",
    paid: "bg-green text-on-accent",
    skipped: "bg-sunk text-muted",
  }[status];
  return (
    <span className={cx("shrink-0 rounded-[3px] border-2 border-line px-1.5 py-0.5 text-center text-[9px] font-extrabold uppercase", style)}>
      {status}
    </span>
  );
}
