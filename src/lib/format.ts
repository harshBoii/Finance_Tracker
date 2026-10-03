const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹1,00,000 style. Negative values get a real minus sign. */
export function rupees(n: number): string {
  const r = Math.round(n);
  return `${r < 0 ? "−" : ""}₹${inr.format(Math.abs(r))}`;
}

/** Digits only (Indian grouping), no symbol. */
export function digits(n: number): string {
  return inr.format(Math.abs(Math.round(n)));
}

/** Compact: ₹950, ₹16k, ₹1.95L. */
export function rupeesShort(n: number): string {
  const sign = n < 0 ? "−" : "";
  const a = Math.abs(n);
  if (a >= 100000) return `${sign}₹${trim(a / 100000)}L`;
  if (a >= 1000) return `${sign}₹${trim(a / 1000)}k`;
  return `${sign}₹${Math.round(a)}`;
}

function trim(x: number): string {
  return x.toFixed(2).replace(/\.?0+$/, "");
}
