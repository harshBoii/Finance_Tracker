import type { Category, Commitment, Expense, Plan, WishItem } from "./types";
import { addDays, dayInMonth, daysInMonth, monthOf, monthRange, parseDay, weekOf } from "./dates";
import { rupees } from "./format";

/* ---------- budgets ---------- */

export const isTripMonth = (plan: Plan, m: string) => plan.tripMonths.includes(m);
export const capFor = (plan: Plan, m: string) => (isTripMonth(plan, m) ? plan.tripMonthCap : plan.monthlyCap);

function fixedCategoryBudget(plan: Plan, c: Category, m: string): number {
  if (isTripMonth(plan, m) && c.tripMonthly != null) return c.tripMonthly;
  return c.monthly;
}

/** Budget per category for a month. The remainder category gets whatever is left under the cap. */
export function budgetsFor(plan: Plan, m: string): Record<string, number> {
  const out: Record<string, number> = {};
  let used = 0;
  for (const c of plan.categories) {
    if (c.isRemainder) continue;
    out[c.id] = fixedCategoryBudget(plan, c, m);
    used += out[c.id];
  }
  const rest = Math.max(0, capFor(plan, m) - used);
  for (const c of plan.categories) if (c.isRemainder) out[c.id] = rest;
  return out;
}

export const salaryShare = (plan: Plan) => plan.salary.gross - plan.salary.officeScheme - plan.salary.toParents;
export const takeHome = (plan: Plan) => plan.salary.gross - plan.salary.officeScheme;

/* ---------- money in ---------- */

export interface Inflow {
  label: string;
  amount: number;
  date: string;
}

export function inflows(plan: Plan): Inflow[] {
  const list: Inflow[] = [{ label: "Opening cash", amount: plan.openingCash, date: plan.openingDate }];
  for (const m of plan.salary.months)
    list.push({ label: "Salary (my share)", amount: salaryShare(plan), date: dayInMonth(m, plan.salary.creditDay) });
  for (const i of plan.incomes) list.push({ label: i.label, amount: i.amount, date: i.date });
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

export const inflowsIn = (plan: Plan, m: string) => inflows(plan).filter((i) => monthOf(i.date) === m);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/* ---------- money out ---------- */

export function spentBetween(expenses: Expense[], from: string, to: string, categoryId?: string): number {
  let s = 0;
  for (const e of expenses)
    if (e.date >= from && e.date <= to && (!categoryId || e.categoryId === categoryId)) s += e.amount;
  return s;
}

export const spentInMonth = (expenses: Expense[], m: string, categoryId?: string) =>
  spentBetween(expenses, `${m}-01`, `${m}-31`, categoryId);

export const isPaid = (c: Commitment) => c.months.every((m) => c.paidMonths.includes(m));
export const remainingPayments = (c: Commitment) => c.months.filter((m) => !c.paidMonths.includes(m));
export const endMonth = (c: Commitment) => c.months[c.months.length - 1];

export interface Due {
  c: Commitment;
  paid: boolean;
}

/** Commitments with a payment in month `m` (skipped ones excluded). */
export function dueIn(commitments: Commitment[], m: string): Due[] {
  return commitments
    .filter((c) => !c.skipped && c.months.includes(m))
    .map((c) => ({ c, paid: c.paidMonths.includes(m) }));
}

/** EMI / paylater / loan / bill total for a month. */
export const installmentsTotal = (commitments: Commitment[], m: string) =>
  sum(dueIn(commitments, m).filter((d) => d.c.mode !== "cash").map((d) => d.c.amount));

/** Every unpaid, unskipped payment from now on, including EMIs that run past the period. */
export const upcomingCommitted = (commitments: Commitment[]) =>
  sum(commitments.filter((c) => !c.skipped).map((c) => remainingPayments(c).length * c.amount));

/* ---------- balance ---------- */

/** Savings right now: cash in since the opening date, minus logged spending and paid commitments. */
export function currentBalance(plan: Plan, expenses: Expense[], commitments: Commitment[], today: string): number {
  const inn = sum(inflows(plan).filter((i) => i.date >= plan.openingDate && i.date <= today).map((i) => i.amount));
  const out = spentBetween(expenses, plan.openingDate, today);
  const paid = sum(commitments.map((c) => c.paidMonths.length * c.amount));
  return inn - out - paid;
}

/* ---------- month view ---------- */

export interface MonthSummary {
  month: string;
  income: number;
  incomeReceived: number;
  cap: number;
  spent: number;
  due: Due[];
  dueTotal: number;
  paidTotal: number;
  savedSoFar: number; // income received − spent − paid
  projectedSaved: number; // full-month estimate
  target: number;
}

export function monthSummary(
  plan: Plan,
  expenses: Expense[],
  commitments: Commitment[],
  m: string,
  today: string,
): MonthSummary {
  const ins = inflowsIn(plan, m);
  const income = sum(ins.map((i) => i.amount));
  const incomeReceived = sum(ins.filter((i) => i.date <= today).map((i) => i.amount));
  const cap = capFor(plan, m);
  const spent = spentInMonth(expenses, m);
  const due = dueIn(commitments, m);
  const dueTotal = sum(due.map((d) => d.c.amount));
  const paidTotal = sum(due.filter((d) => d.paid).map((d) => d.c.amount));
  const cur = monthOf(today);
  const expectedSpend = m < cur ? spent : Math.max(spent, cap);
  return {
    month: m,
    income,
    incomeReceived,
    cap,
    spent,
    due,
    dueTotal,
    paidTotal,
    savedSoFar: incomeReceived - spent - paidTotal,
    projectedSaved: income - expectedSpend - dueTotal,
    target: plan.savingsTargets[m] ?? 0,
  };
}

/* ---------- projection ---------- */

export interface ProjectionRow {
  month: string;
  when: "past" | "current" | "future";
  plan: number; // end-of-month balance if everything goes to plan
  projected: number; // actuals so far + plan for the rest
  target: number; // cumulative savings targets
}

export function projection(plan: Plan, expenses: Expense[], commitments: Commitment[], today: string): ProjectionRow[] {
  const cur = monthOf(today);
  let p = 0;
  let q = 0;
  let t = 0;
  return monthRange(plan.periodStart, plan.periodEnd).map((m) => {
    const income = sum(inflowsIn(plan, m).map((i) => i.amount));
    const cap = capFor(plan, m);
    const spent = spentInMonth(expenses, m);
    const allDue = sum(commitments.filter((c) => c.months.includes(m)).map((c) => c.amount));
    const due = sum(dueIn(commitments, m).map((d) => d.c.amount));
    const spend = m < cur ? spent : m === cur ? Math.max(spent, cap) : cap;
    p += income - cap - allDue;
    q += income - spend - due;
    t += plan.savingsTargets[m] ?? 0;
    return { month: m, when: m < cur ? "past" : m === cur ? "current" : "future", plan: p, projected: q, target: t };
  });
}

/** Months from the current one to the end of the period, inclusive. */
export function monthsLeft(plan: Plan, today: string): number {
  const cur = monthOf(today);
  const start = cur < plan.periodStart ? plan.periodStart : cur;
  return start > plan.periodEnd ? 0 : monthRange(start, plan.periodEnd).length;
}

/* ---------- week ---------- */

export interface CatSpend {
  cat: Category;
  budget: number;
  spent: number;
}

export interface WeekStats {
  start: string;
  end: string;
  budget: number;
  spent: number;
  left: number;
  daysLeft: number; // including today
  perCat: CatSpend[];
}

/** Weekly allowance = monthly budget ÷ weeks in the month the week is measured in. */
export function weekStats(plan: Plan, expenses: Expense[], day: string, today: string = day): WeekStats {
  const { start, end } = weekOf(day);
  const m = monthOf(day);
  const factor = 7 / daysInMonth(m);
  const budgets = budgetsFor(plan, m);
  const budget = Math.round(capFor(plan, m) * factor);
  const spent = spentBetween(expenses, start, end);
  const perCat = plan.categories.map((cat) => ({
    cat,
    budget: Math.round((budgets[cat.id] ?? 0) * factor),
    spent: spentBetween(expenses, start, end, cat.id),
  }));
  const daysLeft = today > end ? 0 : today < start ? 7 : Math.round((+parseDay(end) - +parseDay(today)) / 864e5) + 1;
  return { start, end, budget, spent, left: budget - spent, daysLeft, perCat };
}

export type Mood = "happy" | "worried" | "dramatic";

export function moodFor(w: WeekStats): Mood {
  if (w.spent > w.budget) return "dramatic";
  // Compare against how much of the week has gone by, so Monday splurges still register.
  const elapsed = Math.max(1, 7 - w.daysLeft + 1) / 7;
  const pace = w.budget > 0 ? w.spent / (w.budget * elapsed) : 0;
  return w.spent >= w.budget * 0.8 || pace > 1.15 ? "worried" : "happy";
}

/* ---------- sunday check-in ---------- */

export interface CheckIn {
  week: WeekStats;
  lastWeekSpent: number;
  biggest?: Expense;
  noSpendDays: number;
  byCat: CatSpend[];
  avoided: number;
  suggestion: string;
}

export function checkIn(plan: Plan, expenses: Expense[], wishlist: WishItem[], day: string, today: string): CheckIn {
  const week = weekStats(plan, expenses, day, today);
  const last = weekOf(addDays(week.start, -1));
  const lastWeekSpent = spentBetween(expenses, last.start, last.end);
  const inWeek = expenses.filter((e) => e.date >= week.start && e.date <= week.end);
  const biggest = [...inWeek].sort((a, b) => b.amount - a.amount)[0];
  const spendDays = new Set(inWeek.map((e) => e.date));
  const elapsed = 7 - week.daysLeft + (week.daysLeft > 0 ? 1 : 0);
  const noSpendDays = Math.max(0, elapsed - spendDays.size);
  const byCat = [...week.perCat].filter((c) => c.spent > 0 || c.budget > 0).sort((a, b) => b.spent - a.spent);
  const startMs = +parseDay(week.start);
  const endMs = +parseDay(week.end) + 864e5;
  const avoided = sum(
    wishlist
      .filter((w) => w.status === "dropped" && (w.resolvedAt ?? 0) >= startMs && (w.resolvedAt ?? 0) < endMs)
      .map((w) => w.amount),
  );

  return { week, lastWeekSpent, biggest, noSpendDays, byCat, avoided, suggestion: suggest(week, byCat, lastWeekSpent) };
}

function suggest(week: WeekStats, byCat: CatSpend[], lastWeekSpent: number): string {
  const worst = byCat
    .filter((c) => c.spent > c.budget)
    .sort((a, b) => b.spent - b.budget - (a.spent - a.budget))[0];
  if (worst) {
    const over = worst.spent - worst.budget;
    return worst.cat.isRemainder
      ? `Impulse spending ran ${rupees(over)} over. Put anything over ₹1,000 on the 48-hour wishlist next week.`
      : `${worst.cat.name} went ${rupees(over)} over. Aim for ${rupees(worst.budget)} next week, or trim it from Fun.`;
  }
  if (week.spent === 0) return "No spending logged this week. If that's not real, log from memory now while it's fresh.";
  if (week.left > 0)
    return `You came in ${rupees(week.left)} under. Move it to a set-aside pot so it doesn't drift into impulse buys.`;
  if (lastWeekSpent > 0 && week.spent > lastWeekSpent * 1.2)
    return `Spending jumped ${Math.round((week.spent / lastWeekSpent - 1) * 100)}% from last week. Plan meals before you shop.`;
  return "Right on budget. Keep logging every spend the moment it happens.";
}
