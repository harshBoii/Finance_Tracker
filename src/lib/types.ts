// Month keys are "YYYY-MM", day keys are "YYYY-MM-DD" (local time).

export interface Category {
  id: string;
  name: string;
  jp: string; // decorative label
  emoji: string;
  monthly: number; // budget in a normal month
  tripMonthly?: number | null; // budget in trip months (null = same as monthly)
  isRemainder?: boolean; // "whatever's left under the cap"
  color: string; // css color token name, e.g. "pink"
}

export interface IncomeItem {
  id: string;
  label: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export interface Plan {
  periodStart: string; // YYYY-MM
  periodEnd: string; // YYYY-MM
  openingCash: number;
  openingDate: string; // YYYY-MM-DD — cash on hand as of this day
  salary: {
    gross: number;
    officeScheme: number;
    toParents: number;
    creditDay: number; // day of month my share lands
    months: string[]; // months in which my share is credited
  };
  incomes: IncomeItem[]; // one-time inflows (bonus, office payout)
  laptopFund: number; // separate, never counted as savings
  categories: Category[];
  monthlyCap: number;
  tripMonthCap: number;
  tripMonths: string[];
  savingsTargets: Record<string, number>; // month -> amount saved that month
  goal: number;
  milestones: number[];
  installmentWarn: number;
  wishlistThreshold: number;
  wishlistHours: number;
}

export interface Meta {
  lastMilestone: number;
  celebrated: string[]; // commitment ids whose finish was celebrated
}

export interface UserDoc {
  plan: Plan;
  meta: Meta;
  seededAt: number;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  note?: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export type PayMode = "cash" | "emi" | "paylater" | "loan" | "bill";

export interface Commitment {
  id: string;
  name: string;
  amount: number; // per payment
  months: string[]; // payment months, sorted
  kind: "one-time" | "installment";
  mode: PayMode;
  mustPay: boolean;
  optional: boolean;
  ongoing?: boolean; // no fixed end (shown as "ongoing")
  skipped: boolean;
  paidMonths: string[];
  note?: string;
  order: number;
}

export interface Pot {
  id: string;
  name: string;
  jp: string;
  target: number;
  saved: number;
  commitmentIds: string[];
  order: number;
}

export interface WishItem {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  createdAt: number;
  status: "waiting" | "bought" | "dropped";
  resolvedAt?: number;
}
