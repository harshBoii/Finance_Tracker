"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useData } from "@/lib/data";
import { addMonths, dayInMonth, dayLabel, monthLabel, monthOf } from "@/lib/dates";
import { monthlyAllowance } from "@/lib/finance";
import { rupees } from "@/lib/format";
import type { Category } from "@/lib/types";
import { Bar, Money, Panel, Sheet, cx, tone } from "./ui";
import { useToday, useUI } from "./UIProvider";

/** A category with one monthly allowance (perfume): this month, next month, and "mark used". */
export function MonthlyAllowanceCard({ cat, className }: { cat: Category; className?: string }) {
  const { plan, expenses } = useData();
  const today = useToday();
  const [open, setOpen] = useState(false);
  const month = monthOf(today);
  const next = addMonths(month, 1);
  const now = monthlyAllowance(plan, expenses, cat, month);
  const later = monthlyAllowance(plan, expenses, cat, next);
  const left = now.budget - now.spent;
  const status = now.spent === 0 ? "free" : left > 0 ? "partly" : left === 0 ? "used" : "over";

  return (
    <Panel
      className={className}
      title={
        <span className="flex items-center gap-1.5">
          {cat.emoji} {cat.name}
        </span>
      }
      jp={cat.jp}
      right={<span className="rounded-full bg-sunk px-2 py-0.5 text-[10px] font-extrabold text-muted uppercase">monthly</span>}
    >
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="label">{monthLabel(month, "long")}</p>
          {status === "used" ? (
            <p className="mt-0.5 flex items-center gap-1 text-lg font-extrabold text-green-ink">
              <Check size={18} strokeWidth={3} /> Used
            </p>
          ) : status === "over" ? (
            <p className="mt-0.5 text-lg font-extrabold text-red-ink">
              Over by <Money value={-left} />
            </p>
          ) : (
            <p className="mt-0.5 text-lg font-extrabold">
              <Money value={left} /> <span className="text-sm text-muted">available</span>
            </p>
          )}
        </div>
        <button className="btn btn-primary px-3.5 py-1.5 text-sm" onClick={() => setOpen(true)}>
          {status === "free" ? "Mark used" : "Log more"}
        </button>
      </div>
      <Bar className="mt-2" value={now.spent} max={now.budget} color={cat.color} />
      {now.entries.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs font-semibold text-muted">
          {now.entries.map((e) => (
            <li key={e.id} className="flex justify-between">
              <span className="truncate">{e.note || cat.name}</span>
              <Money value={e.amount} className="text-ink" />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 rounded-xl bg-sunk px-3 py-2 text-xs font-semibold text-muted">
        {monthLabel(next)}:{" "}
        {later.spent >= later.budget && later.budget > 0 ? (
          <b className="text-ink">already covered ({rupees(later.spent)} on EMI)</b>
        ) : later.spent > 0 ? (
          <>
            <b className="text-ink">{rupees(later.spent)}</b> pre-booked, {rupees(later.budget - later.spent)} free
          </>
        ) : (
          <>{rupees(later.budget)} free</>
        )}
      </p>
      <MarkUsedSheet cat={cat} open={open} onClose={() => setOpen(false)} suggested={Math.max(left, 0) || now.budget} />
    </Panel>
  );
}

function MarkUsedSheet({
  cat,
  open,
  onClose,
  suggested,
}: {
  cat: Category;
  open: boolean;
  onClose: () => void;
  suggested: number;
}) {
  return (
    <Sheet open={open} onClose={onClose} label={`Log ${cat.name}`}>
      {open && <MarkUsedBody cat={cat} onClose={onClose} suggested={suggested} />}
    </Sheet>
  );
}

function MarkUsedBody({ cat, onClose, suggested }: { cat: Category; onClose: () => void; suggested: number }) {
  const { plan, addExpense } = useData();
  const { toast } = useUI();
  const today = useToday();
  const monthly = plan.categories.find((c) => c.id === cat.id)?.monthly ?? cat.monthly;
  const [amount, setAmount] = useState(String(suggested));
  const [note, setNote] = useState("Decant");
  const [emi, setEmi] = useState(false);
  const [parts, setParts] = useState(2);
  const total = Number(amount) || 0;

  const n = emi ? parts : 1;
  const day = Number(today.slice(8, 10));
  const schedule = Array.from({ length: n }, (_, i) => {
    const base = Math.floor(total / n);
    return {
      amount: i === 0 ? total - base * (n - 1) : base,
      date: i === 0 ? today : dayInMonth(addMonths(monthOf(today), i), day),
    };
  });

  function save() {
    schedule.forEach((p, i) =>
      addExpense({
        amount: p.amount,
        categoryId: cat.id,
        note: n > 1 ? `${note || cat.name} · EMI ${i + 1}/${n}` : note || undefined,
        date: p.date,
      }),
    );
    onClose();
    toast(n > 1 ? `${rupees(total)} split over ${n} months` : `${rupees(total)} · ${cat.name} marked used`);
  }

  return (
    <div className="space-y-4 p-5 pt-6">
      <div>
        <p className="jp text-xs text-pink-ink">{cat.jp}</p>
        <h2 className="display text-2xl">
          {cat.emoji} {cat.name}
        </h2>
      </div>

      <div className="flex flex-wrap gap-2">
        <Preset on={total === monthly && note === "Decant"} onClick={() => (setAmount(String(monthly)), setNote("Decant"), setEmi(false))}>
          Decant · {rupees(monthly)}
        </Preset>
        <Preset
          on={total === monthly * 2 && note === "Full bottle"}
          onClick={() => (setAmount(String(monthly * 2)), setNote("Full bottle"), setEmi(true), setParts(2))}
        >
          Full bottle · {rupees(monthly * 2)}
        </Preset>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label mb-1">Amount</span>
          <input className="field num" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
        </label>
        <label>
          <span className="label mb-1">What</span>
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>

      <div>
        <span className="label mb-1.5">How are you paying?</span>
        <div className="grid grid-cols-2 gap-2">
          <button className={cx("chip py-2 text-sm", !emi && "chip-on")} onClick={() => setEmi(false)}>
            Paid now
          </button>
          <button className={cx("chip py-2 text-sm", emi && "chip-on")} onClick={() => setEmi(true)}>
            On EMI
          </button>
        </div>
        {emi && (
          <div className="mt-2 flex items-center gap-2 text-sm font-bold">
            <span className="text-muted">Split over</span>
            {[2, 3, 4].map((k) => (
              <button key={k} className={cx("chip px-3 py-1", parts === k && "chip-on")} onClick={() => setParts(k)}>
                {k} months
              </button>
            ))}
          </div>
        )}
      </div>

      <ul className="space-y-1 rounded-2xl bg-sunk p-3 text-sm">
        {schedule.map((p, i) => (
          <li key={p.date} className="flex justify-between font-semibold">
            <span className="text-muted">
              {i === 0 ? "Today" : dayLabel(p.date)} · counts against {monthLabel(monthOf(p.date))}&apos;s {cat.name.toLowerCase()}
            </span>
            <Money value={p.amount} />
          </li>
        ))}
      </ul>

      <button className="btn btn-primary w-full py-3" disabled={total <= 0} onClick={save}>
        {n > 1 ? `Mark used for ${n} months` : "Mark used"}
      </button>
    </div>
  );
}

function Preset({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className={cx("chip px-3 py-1.5 text-xs", on && "chip-on")}
      onClick={onClick}
      style={on ? undefined : { borderColor: `color-mix(in srgb, ${tone("cyan")} 30%, transparent)` }}
    >
      {children}
    </button>
  );
}
