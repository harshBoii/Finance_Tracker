"use client";

import { useData } from "@/lib/data";
import { rupees } from "@/lib/format";
import type { Commitment } from "@/lib/types";
import { useUI } from "./UIProvider";

/** Mark a payment paid/unpaid, with undo, and a burst when an EMI/paylater is fully done. */
export function usePay() {
  const { setPaid, meta, saveMeta } = useData();
  const { toast, celebrate } = useUI();

  return function pay(c: Commitment, month: string, paid = true) {
    const { finished } = setPaid(c, month, paid);
    if (!paid) return;
    if (finished && c.mode !== "cash" && !c.ongoing && !meta.celebrated.includes(c.id)) {
      saveMeta({ celebrated: [...meta.celebrated, c.id] });
      celebrate({ title: "PAID OFF!", jp: "完済!", sub: `${c.name} is done. ${rupees(c.amount)}/month freed up.` });
    } else {
      toast(`${c.name}: ${rupees(c.amount)} paid`, { label: "Undo", run: () => setPaid({ ...c, paidMonths: [...c.paidMonths, month] }, month, false) });
    }
  };
}
