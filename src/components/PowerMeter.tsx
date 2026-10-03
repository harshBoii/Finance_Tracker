import { rupeesShort } from "@/lib/format";
import { Money, Panel } from "./ui";

/** Savings as a charging "power level" toward the March goal. */
export function PowerMeter({
  balance,
  goal,
  milestones,
  projected,
  className,
}: {
  balance: number;
  goal: number;
  milestones: number[];
  projected?: number;
  className?: string;
}) {
  const marks = [...milestones].sort((a, b) => a - b);
  const max = Math.max(goal, ...marks) * 1.02;
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
  const level = marks.filter((m) => balance >= m).length;
  const next = marks.find((m) => balance < m);

  return (
    <Panel
      className={className}
      title="Power level"
      jp="貯金力"
      right={<span className="display rounded-full bg-violet/15 px-2.5 py-0.5 text-sm text-violet-ink">LV {level}</span>}
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <Money value={balance} className="text-[1.9rem] leading-none" />
        <span className="text-sm font-bold text-muted">
          / <Money value={goal} /> goal
        </span>
      </div>

      <div className="relative mt-4 mb-6">
        <div className="relative h-4 overflow-hidden rounded-full bg-sunk">
          <div
            className="shimmer h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: pct(balance), backgroundColor: "var(--pink)", backgroundImage: undefined }}
          >
            <div className="h-full w-full rounded-full bg-gradient-to-r from-pink to-violet" />
          </div>
          {projected != null && projected > balance && (
            <div
              className="absolute inset-y-0 left-0 rounded-full border-r-2 border-dashed border-violet/70"
              style={{ width: pct(projected) }}
              title="Projected by March"
            />
          )}
        </div>
        {marks.map((m) => (
          <div key={m} className="absolute top-0 h-4" style={{ left: pct(m) }}>
            <div className={`h-full w-0.5 -translate-x-1/2 ${balance >= m ? "bg-white/90" : "bg-line-strong"}`} />
            <span className={`num absolute top-5 -translate-x-1/2 text-[11px] ${balance >= m ? "text-violet-ink" : "text-muted"}`}>
              {balance >= m ? "★ " : ""}
              {rupeesShort(m)}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold text-muted">
        {next ? (
          <>
            <Money value={next - balance} className="text-ink" /> to the {rupeesShort(next)} burst.
          </>
        ) : (
          "Every milestone cleared. Max power!"
        )}
        {projected != null && (
          <>
            {" "}
            March projection <Money value={projected} className="text-ink" />.
          </>
        )}
      </p>
    </Panel>
  );
}
