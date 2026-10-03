import { rupeesShort } from "@/lib/format";
import { Money, Panel } from "./ui";

/** Savings as a charging "power level" toward the March goal. */
export function PowerMeter({
  balance,
  goal,
  milestones,
  projected,
}: {
  balance: number;
  goal: number;
  milestones: number[];
  projected?: number;
}) {
  const marks = [...milestones].sort((a, b) => a - b);
  const max = Math.max(goal, ...marks) * 1.02;
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
  const level = marks.filter((m) => balance >= m).length;
  const next = marks.find((m) => balance < m);

  return (
    <Panel title="Power level" jp="貯金力" right={<span className="display rounded-[4px] bg-ink px-2 py-0.5 text-lg text-paper">LV {level}</span>}>
      <div className="flex items-baseline gap-2">
        <Money value={balance} className="text-[2.1rem] leading-none" />
        <span className="text-sm font-bold text-muted">
          / <Money value={goal} /> goal
        </span>
      </div>

      <div className="relative mt-4 mb-7">
        <div className="relative h-7 overflow-hidden rounded-[5px] border-[2.5px] border-line bg-sunk">
          <div
            className="charging h-full transition-[width] duration-700 ease-out"
            style={{
              width: pct(balance),
              backgroundColor: "var(--yellow)",
              boxShadow: "inset -3px 0 0 var(--line)",
            }}
          />
          {projected != null && projected > balance && (
            <div
              className="absolute inset-y-0 border-r-2 border-dashed border-line/60"
              style={{ left: 0, width: pct(projected) }}
              title="Projected by March"
            />
          )}
        </div>
        {marks.map((m) => (
          <div key={m} className="absolute top-0 h-7" style={{ left: pct(m) }}>
            <div className={`h-full w-[2.5px] -translate-x-1/2 ${balance >= m ? "bg-line" : "bg-line/35"}`} />
            <span
              className={`num absolute top-8 -translate-x-1/2 text-[11px] ${balance >= m ? "text-ink" : "text-muted"}`}
            >
              {rupeesShort(m)}
            </span>
          </div>
        ))}
        <div className="absolute -top-3 -translate-x-1/2 text-base" style={{ left: pct(goal) }} title="Goal">
          ⭐
        </div>
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
            March projection: <Money value={projected} className="text-ink" />.
          </>
        )}
      </p>
    </Panel>
  );
}
