// Dev-only preview: `NEXT_PUBLIC_DEMO=1 npm run dev` runs the whole UI on in-memory
// sample data with no database or password. It is compiled out of production builds.

import { addDays, dayKey } from "./dates";
import type { Snapshot } from "./ops";
import { seedCommitments, seedPlan, seedPots } from "./seed";
import type { Expense } from "./types";

export const DEMO = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEMO === "1";

function sampleExpenses(): Expense[] {
  const t = dayKey();
  const rows: [number, number, string, string?][] = [
    [0, 420, "cooking", "Veggies"],
    [0, 180, "fun", "Chai & samosa"],
    [-1, 650, "meat", "Chicken"],
    [-2, 500, "petrol"],
    [-3, 900, "cooking", "Monthly staples"],
    [-4, 350, "fun", "Movie"],
    [-6, 1200, "perfume", "Decant set"],
  ];
  return rows.map(([d, amount, categoryId, note], i) => ({
    id: `demo-${i}`,
    amount,
    categoryId,
    note,
    date: addDays(t, d),
    createdAt: Date.now() - i * 1000,
  }));
}

export function demoSnapshot(): Snapshot {
  return {
    plan: seedPlan(),
    meta: { lastMilestone: 0, celebrated: [] },
    expenses: sampleExpenses(),
    commitments: seedCommitments(),
    pots: seedPots().map((p, i) => ({ ...p, saved: i === 0 ? 6000 : 2000 })),
    wishlist: [
      { id: "w1", name: "Sneakers", amount: 3200, categoryId: "fun", createdAt: Date.now() - 50 * 3600_000, status: "waiting" },
      { id: "w2", name: "Headphones", amount: 2400, categoryId: "fun", createdAt: Date.now() - 5 * 3600_000, status: "waiting" },
      {
        id: "w3",
        name: "Hoodie",
        amount: 1800,
        categoryId: "fun",
        createdAt: Date.now() - 90 * 3600_000,
        status: "dropped",
        resolvedAt: Date.now() - 30 * 3600_000,
      },
    ],
  };
}
