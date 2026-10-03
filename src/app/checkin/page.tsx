"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { useData } from "@/lib/data";
import { addDays, dayLabel, isSunday, weekOf } from "@/lib/dates";
import { checkIn, moodFor } from "@/lib/finance";
import { rupees } from "@/lib/format";
import { Mascot } from "@/components/Mascot";
import { useToday } from "@/components/UIProvider";
import { Bar, Money, PageTitle, Panel, cx } from "@/components/ui";

export default function CheckInPage() {
  const { plan, expenses, wishlist } = useData();
  const today = useToday();
  // On Sunday review this week; any other day, the last full week.
  const [anchor, setAnchor] = useState(() => (isSunday(today) ? today : addDays(weekOf(today).start, -1)));
  const ci = checkIn(plan, expenses, wishlist, anchor, today);
  const w = ci.week;
  const mood = moodFor({ ...w, daysLeft: 0 });
  const delta = w.spent - ci.lastWeekSpent;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageTitle title="Check-in" jp="日曜日" />

      <div className="flex items-center gap-2">
        <button className="btn bg-panel p-1.5" onClick={() => setAnchor(addDays(w.start, -1))} aria-label="Previous week">
          <ChevronLeft size={18} strokeWidth={3} />
        </button>
        <p className="flex-1 text-center text-sm font-extrabold">
          {dayLabel(w.start)} – {dayLabel(w.end)}
        </p>
        <button
          className="btn bg-panel p-1.5"
          disabled={addDays(w.end, 1) > today}
          onClick={() => setAnchor(addDays(w.end, 1))}
          aria-label="Next week"
        >
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </div>

      <section className={cx("panel halftone flex items-center gap-4 p-4", w.left < 0 && "bg-red/10")}>
        <Mascot mood={mood} size={84} />
        <div>
          <p className="text-[11px] font-extrabold tracking-wide text-muted uppercase">Spent this week</p>
          <Money value={w.spent} className={cx("block text-[2.6rem] leading-none", w.left < 0 && "text-red")} />
          <p className="mt-1 text-xs font-bold text-muted">
            {w.left >= 0 ? `${rupees(w.left)} under` : `${rupees(-w.left)} over`} the {rupees(w.budget)} weekly budget
          </p>
        </div>
      </section>

      <section className="panel flex gap-3 bg-yellow p-4 text-on-accent">
        <Lightbulb className="mt-0.5 shrink-0" size={20} strokeWidth={2.5} />
        <div>
          <p className="display text-lg">Next week&apos;s move</p>
          <p className="text-sm font-bold">{ci.suggestion}</p>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <Mini label="vs last week">
          <Money value={delta} signed className={cx("text-lg", delta > 0 ? "text-red" : "text-green")} />
        </Mini>
        <Mini label="No-spend days">
          <span className="num text-lg">{ci.noSpendDays}</span>
        </Mini>
        <Mini label="Wishlist avoided">
          <Money value={ci.avoided} className="text-lg text-green" />
        </Mini>
      </div>

      <Panel title="Where it went" jp="内訳">
        <ul className="space-y-3">
          {ci.byCat.map(({ cat, spent, budget }) => (
            <li key={cat.id}>
              <div className="mb-1 flex items-baseline gap-2 text-sm">
                <span>{cat.emoji}</span>
                <span className="font-bold">{cat.name}</span>
                <span className="text-[11px] font-semibold text-muted">
                  {w.spent > 0 ? `${Math.round((spent / w.spent) * 100)}%` : ""}
                </span>
                <span className={cx("ml-auto text-xs font-semibold", spent > budget ? "text-red" : "text-muted")}>
                  <Money value={spent} className="text-sm text-ink" /> / <Money value={budget} />
                </span>
              </div>
              <Bar value={spent} max={budget} color={cat.color} height={10} />
            </li>
          ))}
        </ul>
        {ci.biggest && (
          <p className="mt-4 border-t-2 border-line/10 pt-2 text-xs font-semibold text-muted">
            Biggest spend: <b className="text-ink">{ci.biggest.note || plan.categories.find((c) => c.id === ci.biggest!.categoryId)?.name}</b>{" "}
            <Money value={ci.biggest.amount} className="text-ink" /> on {dayLabel(ci.biggest.date)}.
          </p>
        )}
      </Panel>
    </div>
  );
}

function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="panel p-3">
      <p className="mb-1 text-[10px] leading-tight font-extrabold tracking-wide text-muted uppercase">{label}</p>
      {children}
    </div>
  );
}
