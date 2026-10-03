// All dates are local-time strings so a ₹200 chai at 11pm stays on the right day.

const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function monthOf(day: string): string {
  return day.slice(0, 7);
}

export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day: string, n: number): string {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let m = start; m <= end; m = addMonths(m, 1)) out.push(m);
  return out;
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** Day key for a given day-of-month, clamped to the month's length. */
export function dayInMonth(month: string, day: number): string {
  return `${month}-${pad(Math.min(day, daysInMonth(month)))}`;
}

/** Monday-start week containing `day`. */
export function weekOf(day: string): { start: string; end: string } {
  const d = parseDay(day);
  const offset = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  const start = addDays(day, -offset);
  return { start, end: addDays(start, 6) };
}

export function monthLabel(month: string, style: "short" | "long" = "short"): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return style === "short"
    ? d.toLocaleDateString("en-IN", { month: "short" })
    : d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function dayLabel(day: string): string {
  return parseDay(day).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function isSunday(day: string): boolean {
  return parseDay(day).getDay() === 0;
}
