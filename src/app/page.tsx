"use client";

import Link from "next/link";
import { ChevronRight, Hourglass, Sparkles, TriangleAlert } from "lucide-react";
import { useData } from "@/lib/data";
import { dayLabel, isSunday, monthOf } from "@/lib/dates";
import { currentBalance, dueIn, installmentsTotal, moodFor, projection, weekStats } from "@/lib/finance";
import { rupees } from "@/lib/format";
import { ExpenseList } from "@/components/ExpenseList";
import { Mascot, moodLine } from "@/components/Mascot";
import { PowerMeter } from "@/components/PowerMeter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNow, useToday } from "@/components/UIProvider";
import { Bar, JpTag, Money, Panel, cx } from "@/components/ui";

export default function Home() {
  const { plan, expenses, commitments, wishlist } = useData();
  const today = useToday();
  const now = useNow();
  const week = weekStats(plan, expenses, today);
  const mood = moodFor(week);
  const balance = currentBalance(plan, expenses, commitments, today);
  const proj = projection(plan, expenses, commitments, today);
  const month = monthOf(today);
  const instTotal = installmentsTotal(commitments, month);
  const unpaid = dueIn(commitments, month).filter((d) => !d.paid);
  const readyWishes = wishlist.filter(
    (w) => w.status === "waiting" && now - w.createdAt >= plan.wishlistHours * 3600_000,
  ).length;
  const perDay = week.daysLeft > 0 ? Math.max(0, week.left) / week.daysLeft : 0;
  const over = week.left < 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="flex items-center gap-2">
        <div>
          <p className="text-xs font-bold text-muted">
            {dayLabel(week.start)} – {dayLabel(week.end)}
          </p>
          <h1 className="display text-[2.2rem] leading-none">This week</h1>
        </div>
        <ThemeToggle className="ml-auto md:hidden" />
      </header>

      {/* hero: one big number */}
      <section className={cx("panel halftone overflow-hidden p-4", over && "bg-red/10")}>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Mascot mood={mood} size={92} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative mb-2 inline-block rounded-[10px] border-2 border-line bg-panel px-2.5 py-1 text-xs font-bold">
              {moodLine[mood]}
              <span className="absolute top-1/2 -left-[7px] h-3 w-3 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-line bg-panel" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold tracking-wide uppercase">{over ? "Over this week" : "Left this week"}</span>
              <JpTag>残り</JpTag>
            </div>
            <Money
              value={over ? -week.left : week.left}
              className={cx("block text-[3.4rem] leading-[1.05]", over && "text-red")}
            />
          </div>
        </div>
        <div className="mt-3">
          <Bar value={week.spent} max={week.budget} color={mood === "happy" ? "green" : "yellow"} height={16} />
          <div className="mt-1.5 flex justify-between text-xs font-semibold text-muted">
            <span>
              Spent <Money value={week.spent} className="text-ink" /> of <Money value={week.budget} className="text-ink" />
            </span>
            <span>
              {week.daysLeft} day{week.daysLeft === 1 ? "" : "s"} left
              {!over && week.daysLeft > 0 && (
                <>
                  {" "}
                  · <Money value={perDay} className="text-ink" />
                  /day
                </>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* nudges */}
      <div className="space-y-2">
        {isSunday(today) && (
          <Nudge href="/checkin" icon={<Sparkles size={18} />} tone="violet">
            Sunday check-in is ready. See where the money went.
          </Nudge>
        )}
        {readyWishes > 0 && (
          <Nudge href="/wishlist" icon={<Hourglass size={18} />} tone="yellow">
            {readyWishes} wishlist item{readyWishes > 1 ? "s" : ""} passed {plan.wishlistHours}h. Still want{readyWishes > 1 ? " them" : " it"}?
          </Nudge>
        )}
        {instTotal > plan.installmentWarn && (
          <Nudge href="/installments" icon={<TriangleAlert size={18} />} tone="red">
            Installments this month: {rupees(instTotal)}, above your {rupees(plan.installmentWarn)} limit.
          </Nudge>
        )}
        {unpaid.length > 0 && (
          <Nudge href="/month" icon={<TriangleAlert size={18} />} tone="cyan">
            {unpaid.length} payment{unpaid.length > 1 ? "s" : ""} due this month not marked paid (
            {rupees(unpaid.reduce((s, d) => s + d.c.amount, 0))}).
          </Nudge>
        )}
      </div>

      <Panel title="By category" jp="分類">
        <ul className="space-y-3">
          {week.perCat.filter((c) => c.budget > 0 || c.spent > 0).map(({ cat, budget, spent }) => (
            <li key={cat.id}>
              <div className="mb-1 flex items-baseline gap-2 text-sm">
                <span>{cat.emoji}</span>
                <span className="font-bold">{cat.name}</span>
                <span className={cx("ml-auto text-xs font-semibold", spent > budget ? "text-red" : "text-muted")}>
                  <Money value={spent} className="text-sm text-ink" /> / <Money value={budget} />
                </span>
              </div>
              <Bar value={spent} max={budget} color={cat.color} height={12} />
            </li>
          ))}
        </ul>
      </Panel>

      <PowerMeter
        balance={balance}
        goal={plan.goal}
        milestones={plan.milestones}
        projected={proj[proj.length - 1]?.projected}
      />

      <Panel title="Recent" jp="最近" right={<Link href="/month" className="text-xs font-bold underline">All</Link>}>
        <ExpenseList items={expenses.slice(0, 6)} empty="Tap + to log your first expense." />
      </Panel>
    </div>
  );
}

function Nudge({
  href,
  icon,
  tone,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="anim-pop flex items-center gap-3 rounded-[5px] border-[2.5px] border-line bg-panel px-3 py-2.5 text-sm font-bold"
      style={{ boxShadow: `4px 4px 0 var(--${tone})` }}
    >
      <span className="shrink-0" style={{ color: `var(--${tone})` }}>
        {icon}
      </span>
      <span className="flex-1">{children}</span>
      <ChevronRight size={16} />
    </Link>
  );
}
