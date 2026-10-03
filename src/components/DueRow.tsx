"use client";

import { Check, Lock } from "lucide-react";
import type { Commitment } from "@/lib/types";
import { Money, cx } from "./ui";
import { usePay } from "./usePay";

export const MODE_LABEL: Record<Commitment["mode"], string> = {
  cash: "Cash",
  emi: "EMI",
  paylater: "Paylater",
  loan: "Loan",
  bill: "Bill",
};

/** One payment in one month, with a tap-to-mark-paid checkbox. */
export function DueRow({ c, month, paid }: { c: Commitment; month: string; paid: boolean }) {
  const pay = usePay();
  return (
    <li className="flex items-center gap-3 py-2">
      <button
        onClick={() => pay(c, month, !paid)}
        aria-label={paid ? `Mark ${c.name} unpaid` : `Mark ${c.name} paid`}
        aria-pressed={paid}
        className={cx(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-line-strong",
          paid ? "bg-green/18 text-green-ink" : "bg-panel",
        )}
      >
        {paid && <Check size={16} strokeWidth={4} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cx("flex items-center gap-1 truncate text-sm font-bold", paid && "text-muted line-through")}>
          {c.mustPay && <Lock size={12} strokeWidth={3} className="shrink-0" aria-label="Must pay" />}
          {c.name}
        </p>
        <p className="text-[11px] font-semibold text-muted">
          {MODE_LABEL[c.mode]}
          {c.note ? ` · ${c.note}` : ""}
        </p>
      </div>
      <Money value={c.amount} className={cx("text-base", paid && "text-muted")} />
    </li>
  );
}
