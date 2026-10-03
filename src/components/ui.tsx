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
  glow = false,
}: {
  title?: ReactNode;
  jp?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <section className={cx("panel p-4 sm:p-5", glow && "glow", className)}>
      {(title || jp || right) && (
        <header className="mb-3 flex items-center gap-2">
          {title && <h2 className="display text-[1.05rem]">{title}</h2>}
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
    <span aria-hidden className={cx("jp rounded-full bg-pink/12 px-2 py-0.5 text-[10px] leading-none text-pink-ink", className)}>
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

/** Soft rounded progress bar. Over 100% turns coral with gentle stripes. */
export function Bar({
  value,
  max,
  color = "pink",
  height = 10,
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
      className={cx("relative overflow-hidden rounded-full bg-sunk", className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemax={Math.round(max)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: `${Math.min(100, pct * 100)}%`,
          background: over
            ? "repeating-linear-gradient(-45deg, var(--red) 0 6px, color-mix(in srgb, var(--red) 75%, #fff) 6px 12px)"
            : tone(color),
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
      <button aria-label="Close" className="anim-fade absolute inset-0 bg-[#2f2a44]/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="anim-rise safe-bottom relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-panel shadow-[0_-10px_40px_-10px_var(--glow)] md:rounded-[28px]">
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line-strong md:hidden" />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 rounded-full bg-sunk p-1.5 text-muted"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line-strong p-4 text-center text-sm text-muted">{children}</p>;
}

export function PageTitle({ title, jp, sub }: { title: string; jp: string; sub?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end gap-2.5">
      <h1 className="display text-[1.9rem] leading-none">{title}</h1>
      <span aria-hidden className="jp mb-0.5 text-sm text-pink-ink">
        {jp}
      </span>
      {sub && <div className="mb-0.5 ml-auto text-right text-xs font-semibold text-muted">{sub}</div>}
    </div>
  );
}

/** Small label + big number tile. */
export function Stat({
  label,
  jp,
  children,
  sub,
  className,
}: {
  label: string;
  jp?: string;
  children: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("panel p-3.5 sm:p-4", className)}>
      <p className="label flex items-center gap-1.5">
        {label}
        {jp && (
          <span aria-hidden className="jp hidden text-[9px] tracking-normal normal-case text-pink-ink sm:inline">
            {jp}
          </span>
        )}
      </p>
      <div className="mt-1">{children}</div>
      {sub && <div className="mt-1 text-[11px] font-semibold text-muted">{sub}</div>}
    </div>
  );
}
