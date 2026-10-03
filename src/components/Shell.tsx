"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartLine,
  CreditCard,
  Ellipsis,
  Home,
  Hourglass,
  ListChecks,
  LogOut,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import { DataProvider, useData } from "@/lib/data";
import { currentBalance } from "@/lib/finance";
import { rupeesShort } from "@/lib/format";
import { Mascot } from "./Mascot";
import { ThemeToggle } from "./ThemeToggle";
import { UIProvider, useToday, useUI } from "./UIProvider";
import { cx } from "./ui";

export function Shell({ children }: { children: ReactNode }) {
  // Everything below depends on the clock and on-device data, so render it client-side only.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) return <Splash />;
  return (
    <DataProvider>
      <UIProvider>
        <Gate>{children}</Gate>
      </UIProvider>
    </DataProvider>
  );
}

const noop = () => () => {};

function Gate({ children }: { children: ReactNode }) {
  const { status, error } = useData();
  if (status === "locked") return <Unlock />;
  if (status === "error")
    return (
      <Splash text="Couldn't load your data">
        <p className="max-w-xs text-center text-sm font-semibold text-muted">{error}</p>
        <button className="btn bg-yellow px-4 py-2 text-on-accent" onClick={() => location.reload()}>
          Try again
        </button>
      </Splash>
    );
  if (status !== "ready") return <Splash text="Loading your plan…" />;
  return <Frame>{children}</Frame>;
}

function Splash({ text = "Loading…", children }: { text?: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6">
      <Mascot mood={children ? "worried" : "happy"} size={88} />
      <p className="display text-xl">{text}</p>
      {children}
    </div>
  );
}

function Unlock() {
  const { unlock } = useData();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pw || busy) return;
    setBusy(true);
    setError(await unlock(pw));
    setBusy(false);
  }

  return (
    <main className="safe-top flex min-h-dvh items-center justify-center p-4">
      <form onSubmit={submit} className="panel halftone anim-pop w-full max-w-sm p-6 text-center">
        <div className="flex justify-center">
          <Mascot mood={error ? "worried" : "happy"} size={120} />
        </div>
        <h1 className="display mt-2 text-5xl">Kakeibo</h1>
        <p aria-hidden className="jp text-pink">
          家計簿
        </p>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="field mt-5 text-center"
          placeholder="Password"
          aria-label="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
        />
        <button className="btn mt-3 w-full bg-yellow py-3 text-on-accent" disabled={!pw || busy}>
          {busy ? "Unlocking…" : "Unlock"}
        </button>
        {error && <p className="mt-3 text-sm font-semibold text-red">{error}</p>}
      </form>
    </main>
  );
}

const NAV = [
  { href: "/", label: "Week", jp: "今週", icon: Home },
  { href: "/month", label: "Month", jp: "今月", icon: CalendarDays },
  { href: "/plan", label: "Plan", jp: "計画", icon: ListChecks },
  { href: "/projection", label: "Future", jp: "未来", icon: ChartLine },
  { href: "/wishlist", label: "Wishlist", jp: "欲しい", icon: Hourglass },
  { href: "/installments", label: "EMIs", jp: "分割", icon: CreditCard },
  { href: "/checkin", label: "Check-in", jp: "日曜", icon: Sparkles },
  { href: "/settings", label: "Settings", jp: "設定", icon: Settings },
];
const MOBILE = ["/", "/month", "/plan"];

function Frame({ children }: { children: ReactNode }) {
  const { lock, offline, pending } = useData();
  const { openQuickAdd } = useUI();
  const path = usePathname();

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const moreActive = !MOBILE.some(active);

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl">
      <MilestoneWatcher />
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-1 border-r-[2.5px] border-line p-4 md:flex">
        <Link href="/" className="mb-4 flex items-center gap-2">
          <span className="display text-3xl">Kakeibo</span>
          <span aria-hidden className="jp text-xs text-pink">
            家計簿
          </span>
        </Link>
        <button className="btn mb-3 bg-yellow py-2.5 text-on-accent" onClick={openQuickAdd}>
          <Plus size={18} strokeWidth={3} /> Quick add
        </button>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cx(
              "flex items-center gap-2.5 rounded-[5px] border-2 px-3 py-2 text-sm font-bold",
              active(n.href) ? "border-line bg-ink text-paper" : "border-transparent hover:border-line/30",
            )}
          >
            <n.icon size={17} strokeWidth={2.5} />
            {n.label}
            <span aria-hidden className="jp ml-auto text-[10px] opacity-60">
              {n.jp}
            </span>
          </Link>
        ))}
        <div className="mt-auto flex items-center gap-2">
          <ThemeToggle />
          <button className="btn bg-panel p-2" onClick={lock} aria-label="Lock">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {offline && (
        <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+6px)] z-40 flex justify-center">
          <span className="rounded-full border-2 border-line bg-ink px-3 py-0.5 text-[11px] font-bold text-paper">
            Offline{pending ? ` · ${pending} change${pending > 1 ? "s" : ""} will sync` : ""}
          </span>
        </div>
      )}
      <main className="safe-top min-w-0 flex-1 px-4 pt-4 pb-[calc(96px+env(safe-area-inset-bottom))] md:px-8 md:pt-8 md:pb-10">
        {children}
      </main>

      {/* mobile tab bar */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t-[2.5px] border-line bg-panel md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end">
          {NAV.filter((n) => MOBILE.includes(n.href))
            .slice(0, 2)
            .map((n) => (
              <Tab key={n.href} href={n.href} label={n.label} jp={n.jp} Icon={n.icon} active={active(n.href)} />
            ))}
          <div className="flex justify-center">
            <button
              onClick={openQuickAdd}
              aria-label="Quick add expense"
              className="btn -mt-6 h-16 w-16 rounded-full bg-yellow text-on-accent"
            >
              <Plus size={32} strokeWidth={3.5} />
            </button>
          </div>
          <Tab href="/plan" label="Plan" jp="計画" Icon={ListChecks} active={active("/plan")} />
          <Tab href="/more" label="More" jp="他" Icon={Ellipsis} active={moreActive} />
        </div>
      </nav>
    </div>
  );
}

function Tab({
  href,
  label,
  jp,
  Icon,
  active,
}: {
  href: string;
  label: string;
  jp: string;
  Icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-0.5 py-2" aria-current={active ? "page" : undefined}>
      <span className={cx("rounded-full px-3 py-1", active && "bg-ink text-paper")}>
        <Icon size={20} strokeWidth={2.5} />
      </span>
      <span className="text-[11px] font-extrabold">
        {label} <span aria-hidden className="jp text-[8px] text-muted">{jp}</span>
      </span>
    </Link>
  );
}

/** Fires the burst once each time savings cross a new milestone. */
function MilestoneWatcher() {
  const { plan, meta, expenses, commitments, saveMeta } = useData();
  const { celebrate } = useUI();
  const today = useToday();
  const balance = currentBalance(plan, expenses, commitments, today);
  const hit = [...plan.milestones].sort((a, b) => b - a).find((m) => balance >= m) ?? 0;
  const fired = useRef(0);

  useEffect(() => {
    if (hit > meta.lastMilestone && hit > fired.current) {
      fired.current = hit;
      saveMeta({ lastMilestone: hit });
      celebrate({ title: rupeesShort(hit), jp: "ドーン!", sub: `Power level up! Savings just passed ${rupeesShort(hit)}.` });
    }
  }, [hit, meta.lastMilestone, saveMeta, celebrate]);
  return null;
}

export { NAV };
