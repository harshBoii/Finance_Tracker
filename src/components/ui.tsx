"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { digits } from "@/lib/format";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/** CSS color var for a category/accent token name. */
export const tone = (name: string) => `var(--${name})`;

export function Panel({
  title,
  jp,
  right,
  children,
  className,
  dots = true,
}: {
  title?: ReactNode;
  jp?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  dots?: boolean;
}) {
  return (
    <section className={cx("panel p-4", dots && "halftone", className)}>
      {(title || jp || right) && (
        <header className="mb-3 flex items-center gap-2">
          {title && <h2 className="display text-[1.35rem]">{title}</h2>}
          {jp && <JpTag>{jp}</JpTag>}
          {right && <div className="ml-auto">{right}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function JpTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx("jp rounded-[3px] bg-ink px-1.5 py-0.5 text-[10px] leading-none text-paper", className)}
    >
      {children}
    </span>
  );
}

/** Rupee amount with a smaller ₹ so the digits carry the weight. */
export function Money({ value, className, signed }: { value: number; className?: string; signed?: boolean }) {
  const neg = Math.round(value) < 0;
  const sign = neg ? "−" : signed && value > 0 ? "+" : "";
  return (
    <span className={cx("num whitespace-nowrap", className)}>
      {sign}
      <span className="cur">₹</span>
      {digits(value)}
    </span>
  );
}

/** Outlined progress bar. Over 100% turns red with a striped overflow. */
export function Bar({
  value,
  max,
  color = "pink",
  height = 14,
  className,
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
  className?: string;
}) {
  const pct = max > 0 ? value / max : value > 0 ? 2 : 0;
  const over = pct > 1;
  return (
    <div
      className={cx("relative overflow-hidden rounded-[4px] border-2 border-line bg-sunk", className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemax={Math.round(max)}
    >
      <div
        className="h-full border-r-2 border-line transition-[width] duration-500 ease-out"
        style={{
          width: `${Math.min(100, pct * 100)}%`,
          background: over
            ? "repeating-linear-gradient(-45deg, var(--red) 0 6px, color-mix(in srgb, var(--red) 70%, #000) 6px 12px)"
            : tone(color),
          borderRightWidth: pct >= 1 || pct === 0 ? 0 : 2,
        }}
      />
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  children,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-label={label}>
      <button aria-label="Close" className="anim-fade absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="anim-rise safe-bottom relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[10px] border-[2.5px] border-b-0 border-line bg-panel md:rounded-[8px] md:border-b-[2.5px] md:shadow-[6px_6px_0_var(--line)]">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 rounded-full border-2 border-line bg-panel p-1"
        >
          <X size={16} strokeWidth={3} />
        </button>
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[4px] border-2 border-dashed border-line/40 p-4 text-center text-sm text-muted">{children}</p>;
}

export function PageTitle({ title, jp, sub }: { title: string; jp: string; sub?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end gap-3">
      <h1 className="display text-[2.4rem] leading-none">{title}</h1>
      <span aria-hidden className="jp mb-1 text-lg text-pink">
        {jp}
      </span>
      {sub && <div className="mb-1 ml-auto text-right text-xs font-semibold text-muted">{sub}</div>}
    </div>
  );
}
