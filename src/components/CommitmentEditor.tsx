"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useData } from "@/lib/data";
import { addMonths, monthLabel, monthRange } from "@/lib/dates";
import type { Commitment, PayMode } from "@/lib/types";
import { MODE_LABEL } from "./DueRow";
import { Sheet } from "./ui";

export function blankCommitment(start: string, order: number): Commitment {
  return {
    id: `c-${Date.now().toString(36)}`,
    name: "",
    amount: 0,
    months: [start],
    kind: "one-time",
    mode: "cash",
    mustPay: false,
    optional: true,
    skipped: false,
    paidMonths: [],
    order,
  };
}

/** Add or edit a one-time expense, EMI, paylater, loan or bill. */
export function CommitmentEditor({ item, onClose }: { item: Commitment | null; onClose: () => void }) {
  return (
    <Sheet open={!!item} onClose={onClose} label="Edit planned item">
      {item && <EditorBody key={item.id} item={item} onClose={onClose} />}
    </Sheet>
  );
}

function EditorBody({ item, onClose }: { item: Commitment; onClose: () => void }) {
  const { plan, commitments, saveCommitment, deleteCommitment } = useData();
  const isNew = !commitments.some((c) => c.id === item.id);
  const [c, setC] = useState(item);
  const [start, setStart] = useState(item.months[0] ?? plan.periodStart);
  const [count, setCount] = useState(item.months.length || 1);
  const set = <K extends keyof Commitment>(k: K, v: Commitment[K]) => setC((x) => ({ ...x, [k]: v }));
  const startOptions = monthRange(addMonths(plan.periodStart, -2), addMonths(plan.periodEnd, 6));

  function save() {
    const months = monthRange(start, addMonths(start, Math.max(1, count) - 1));
    saveCommitment({
      ...c,
      name: c.name.trim() || "Untitled",
      months,
      kind: months.length > 1 ? "installment" : c.kind === "installment" && c.mode !== "cash" ? "installment" : "one-time",
      paidMonths: c.paidMonths.filter((m) => months.includes(m)),
      optional: c.mustPay ? false : c.optional,
    });
    onClose();
  }

  return (
    <div className="space-y-3 p-5 pt-6">
      <h2 className="display text-2xl">{isNew ? "New planned item" : "Edit item"}</h2>
      <Field label="Name">
        <input className="field" value={c.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Watch" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={count > 1 ? "Amount per month" : "Amount"}>
          <input
            className="field num"
            inputMode="numeric"
            value={c.amount || ""}
            onChange={(e) => set("amount", Number(e.target.value.replace(/\D/g, "")))}
          />
        </Field>
        <Field label="Payment mode">
          <select className="field" value={c.mode} onChange={(e) => set("mode", e.target.value as PayMode)}>
            {(Object.keys(MODE_LABEL) as PayMode[]).map((m) => (
              <option key={m} value={m}>
                {MODE_LABEL[m]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={count > 1 ? "First month" : "Target month"}>
          <select className="field" value={start} onChange={(e) => setStart(e.target.value)}>
            {startOptions.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m, "long")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Number of payments">
          <input
            className="field num"
            type="number"
            min={1}
            max={60}
            value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
          />
        </Field>
      </div>
      <Field label="Note">
        <input className="field" value={c.note ?? ""} onChange={(e) => set("note", e.target.value || undefined)} />
      </Field>
      <div className="flex flex-wrap gap-4 text-sm font-bold">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={c.mustPay} onChange={(e) => set("mustPay", e.target.checked)} /> 🔒 Must pay
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={c.optional && !c.mustPay}
            disabled={c.mustPay}
            onChange={(e) => set("optional", e.target.checked)}
          />{" "}
          Optional
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!c.ongoing} onChange={(e) => set("ongoing", e.target.checked || undefined)} /> Ongoing
        </label>
      </div>
      <div className="flex gap-3 pt-2">
        {!isNew && (
          <button
            className="btn bg-panel px-3 py-2.5 text-red"
            onClick={() => {
              if (confirm(`Delete "${c.name}"?`)) {
                deleteCommitment(c.id);
                onClose();
              }
            }}
            aria-label="Delete item"
          >
            <Trash2 size={18} />
          </button>
        )}
        <button className="btn flex-1 bg-yellow py-2.5 text-on-accent" onClick={save} disabled={c.amount <= 0}>
          Save
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-extrabold tracking-wide text-muted uppercase">{label}</span>
      {children}
    </label>
  );
}
