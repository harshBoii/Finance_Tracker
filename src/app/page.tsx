"use client";

import Link from "next/link";
import { ChevronRight, Hourglass, Sparkles, TriangleAlert } from "lucide-react";
import { useData } from "@/lib/data";
import { dayLabel, isSunday, monthLabel, monthOf } from "@/lib/dates";
import {
  capFor,
  currentBalance,
  dueIn,
  installmentsTotal,
  isMonthly,
  moodFor,
  projection,
  spentInMonth,
  weekStats,
} from "@/lib/finance";
import { rupees, rupeesShort } from "@/lib/format";
import { DueRow } from "@/components/DueRow";
import { ExpenseList } from "@/components/ExpenseList";
import { Mascot, moodLine } from "@/components/Mascot";
import { MonthlyAllowanceCard } from "@/components/MonthlyAllowanceCard";
import { PowerMeter } from "@/components/PowerMeter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNow, useToday } from "@/components/UIProvider";
import { Bar, Empty, JpTag, Money, Panel, Stat, cx } from "@/components/ui";

export default function Home() {
  const { plan, expenses, commitments, wishlist, pots } = useData();
  const today = useToday();
  const now = useNow();
  const month = monthOf(today);
  const week = weekStats(plan, expenses, today);
  const mood = moodFor(week);
  const balance = currentBalance(plan, expenses, commitments, today);
  const proj = projection(plan, expenses, commitments, today);
  const cap = capFor(plan, month);
  const pocket = spentInMonth(expenses, month);
  const due = dueIn(commitments, month);
  const unpaid = due.filter((d) => !d.paid);
  const unpaidSum = unpaid.reduce((s, d) => s + d.c.amount, 0);
  const instTotal = installmentsTotal(commitments, month);
  const potSaved = pots.reduce((s, p) => s + p.saved, 0);
  const potTarget = pots.reduce((s, p) => s + p.target, 0);
  const waiting = wishlist.filter((w) => w.status === "waiting");
  const ready = waiting.filter((w) => now - w.createdAt >= plan.wishlistHours * 3600_000).length;
  const avoided = wishlist.filter((w) => w.status === "dropped").reduce((s, w) => s + w.amount, 0);
  const monthlyCats = plan.categories.filter(isMonthly);
  const perDay = week.daysLeft > 0 ? Math.max(0, week.left) / week.daysLeft : 0;
  const over = week.left < 0;
  const next = [...plan.milestones].sort((a, b) => a - b).find((m) => balance < m);

  const headsUp = [
    isSunday(today) && { href: "/checkin", icon: <Sparkles size={15} />, text: "Sunday check-in is ready", tone: "violet" },
    ready > 0 && {
      href: "/wishlist",
      icon: <Hourglass size={15} />,
      text: `${ready} wishlist item${ready > 1 ? "s" : ""} finished cooling off`,
      tone: "yellow",
    },
    instTotal > plan.installmentWarn && {
      href: "/installments",
      icon: <TriangleAlert size={15} />,
      text: `EMIs this month ${rupees(instTotal)}, over your ${rupeesShort(plan.installmentWarn)} limit`,
      tone: "red",
    },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; text: string; tone: string }[];

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <header className="mb-4 flex items-center gap-2">
        <div>
          <p className="text-xs font-bold text-muted">
            {dayLabel(today)} · week {dayLabel(week.start)} – {dayLabel(week.end)}
          </p>
          <h1 className="display text-[1.7rem] leading-tight">
            Okaeri! <span className="jp text-base text-pink-ink">おかえり</span>
          </h1>
        </div>
        <ThemeToggle className="ml-auto md:hidden" />
      </header>

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        {/* hero: the one number that matters */}
        <section className={cx("panel glow p-4 sm:p-5 lg:col-span-5", over && "bg-red/5")}>
          <div className="flex items-center gap-3">
            <Mascot mood={mood} size={104} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="relative mb-2 inline-block rounded-2xl bg-sunk px-3 py-1.5 text-xs font-bold">
                {moodLine[mood]}
              </div>
              <p className="label flex items-center gap-1.5">
                {over ? "Over budget this week" : "Left to spend this week"} <JpTag>残り</JpTag>
              </p>
              <Money
                value={over ? -week.left : week.left}
                className={cx("block text-[2.9rem] leading-[1.05] sm:text-[3.3rem]", over && "text-red-ink")}
              />
            </div>
          </div>
          <Bar className="mt-3" value={week.spent} max={week.budget} color={mood === "happy" ? "green" : mood === "worried" ? "yellow" : "red"} height={12} />
          <div className="mt-1.5 flex justify-between text-xs font-semibold text-muted">
            <span>
              Spent <Money value={week.spent} className="text-ink" /> of <Money value={week.budget} className="text-ink" />
            </span>
            <span>
              {week.daysLeft} day{week.daysLeft === 1 ? "" : "s"} left
              {!over && week.daysLeft > 0 && (
                <>
                  {" "}· <Money value={perDay} className="text-ink" />/day
                </>
              )}
            </span>
          </div>
        </section>

        {/* at-a-glance tiles */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-7 lg:gap-5">
          <Stat label={`Pocket spend · ${monthLabel(month)}`} jp="生活費" sub={<>{rupees(Math.max(0, cap - pocket))} left of {rupees(cap)}</>}>
            <Money value={pocket} className={cx("text-[1.6rem] leading-none", pocket > cap && "text-red-ink")} />
            <Bar className="mt-2" value={pocket} max={cap} color="cyan" height={6} />
          </Stat>
          <Stat label="Savings now" jp="貯金" sub={next ? `${rupees(next - balance)} to ${rupeesShort(next)} ★` : "All milestones hit ★"}>
            <Money value={balance} className="text-[1.6rem] leading-none" />
            <Bar className="mt-2" value={balance} max={plan.goal} color="violet" height={6} />
          </Stat>
          <Stat
            label="Due this month"
            jp="支払い"
            sub={unpaid.length ? `${unpaid.length} payment${unpaid.length > 1 ? "s" : ""} not marked paid` : "All paid ✓"}
          >
            <Money value={unpaidSum} className={cx("text-[1.6rem] leading-none", unpaidSum > 0 && "text-pink-ink")} />
            <Bar className="mt-2" value={due.length - unpaid.length} max={Math.max(1, due.length)} color="green" height={6} />
          </Stat>
          <Stat label="Set aside" jp="積立" sub={pots.map((p) => `${p.name.split(" ")[0]} ${rupeesShort(p.saved)}`).join(" · ")}>
            <Money value={potSaved} className="text-[1.6rem] leading-none" />
            <Bar className="mt-2" value={potSaved} max={potTarget} color="yellow" height={6} />
          </Stat>
        </div>

        {headsUp.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:col-span-12">
            {headsUp.map((h) => (
              <Link
                key={h.href}
                href={h.href}
                className="anim-pop flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-bold"
                style={{
                  borderColor: `color-mix(in srgb, var(--${h.tone}) 40%, transparent)`,
                  background: `color-mix(in srgb, var(--${h.tone}) 12%, var(--panel))`,
                  color: `var(--${h.tone}-ink)`,
                }}
              >
                {h.icon}
                {h.text}
                <ChevronRight size={14} />
              </Link>
            ))}
          </div>
        )}

        <Panel title="This week by category" jp="分類" className="lg:col-span-4">
          <ul className="space-y-2.5">
            {week.perCat
              .filter((c) => c.budget > 0 || c.spent > 0)
              .map(({ cat, budget, spent }) => (
                <li key={cat.id}>
                  <div className="mb-1 flex items-baseline gap-2 text-sm">
                    <span>{cat.emoji}</span>
                    <span className="font-bold">{cat.name}</span>
                    <span className={cx("ml-auto text-xs font-semibold", spent > budget ? "text-red-ink" : "text-muted")}>
                      <Money value={spent} className="text-sm text-ink" /> / <Money value={budget} />
                    </span>
                  </div>
                  <Bar value={spent} max={budget} color={cat.color} height={8} />
                </li>
              ))}
          </ul>
        </Panel>

        <div className="grid gap-4 lg:col-span-4 lg:gap-5">
          {monthlyCats.map((cat) => (
            <MonthlyAllowanceCard key={cat.id} cat={cat} />
          ))}
          <Panel
            title="Wishlist"
            jp="欲しい"
            right={
              <Link href="/wishlist" className="text-xs font-bold text-pink-ink">
                Open
              </Link>
            }
          >
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-muted">
                {waiting.length ? `${waiting.length} cooling off (${rupees(waiting.reduce((s, w) => s + w.amount, 0))})` : "Nothing cooling off"}
              </span>
              <span>
                <Money value={avoided} className="text-green-ink" /> <span className="text-xs text-muted">avoided</span>
              </span>
            </div>
          </Panel>
        </div>

        <Panel
          title="Payments this month"
          jp="固定費"
          className="lg:col-span-4"
          right={
            <Link href="/month" className="text-xs font-bold text-pink-ink">
              Month view
            </Link>
          }
        >
          {due.length === 0 ? (
            <Empty>Nothing due this month.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {[...unpaid, ...due.filter((d) => d.paid)].map((d) => (
                <DueRow key={d.c.id} c={d.c} month={month} paid={d.paid} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent spends"
          jp="最近"
          className="lg:col-span-6 xl:col-span-7"
          right={
            <Link href="/month" className="text-xs font-bold text-pink-ink">
              All
            </Link>
          }
        >
          <ExpenseList items={expenses.filter((e) => e.date <= today).slice(0, 6)} empty="Tap + to log your first expense." />
        </Panel>

        <PowerMeter
          className="lg:col-span-6 xl:col-span-5"
          balance={balance}
          goal={plan.goal}
          milestones={plan.milestones}
          projected={proj[proj.length - 1]?.projected}
        />
      </div>
    </div>
  );
}
