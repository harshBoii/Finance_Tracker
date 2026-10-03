"use client";

import { useEffect, useRef, useState } from "react";
import { monthLabel } from "@/lib/dates";
import type { ProjectionRow } from "@/lib/finance";
import { rupees, rupeesShort } from "@/lib/format";

const H = 240;
const M = { top: 16, right: 58, bottom: 26, left: 44 };

const SERIES = [
  { key: "projected", label: "Projected", color: "var(--chart-1)", width: 3, dash: undefined },
  { key: "target", label: "Targets", color: "var(--chart-2)", width: 2, dash: "2 5" },
  { key: "plan", label: "Original plan", color: "var(--muted)", width: 2, dash: "7 5" },
] as const;

/** End-of-month savings: actuals-so-far vs the original plan vs cumulative targets, with the goal line. */
export function ProjectionChart({ rows, goal }: { rows: ProjectionRow[]; goal: number }) {
  const [sel, setSel] = useState<number | null>(null);
  // Draw at the real pixel width so labels stay 11px on a phone and on a Mac.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(340);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const all = rows.flatMap((r) => [r.plan, r.projected, r.target]).concat(goal);
  const yMin = Math.min(0, ...all);
  const step = niceStep((Math.max(...all) * 1.05 - yMin) / 4);
  const yMax = Math.ceil((Math.max(...all) * 1.05) / step) * step;
  const iw = W - M.left - M.right;
  const ih = H - M.top - M.bottom;
  const x = (i: number) => M.left + (rows.length === 1 ? iw / 2 : (i / (rows.length - 1)) * iw);
  const y = (v: number) => M.top + ih - ((v - yMin) / (yMax - yMin)) * ih;
  const ticks: number[] = [];
  for (let t = Math.floor(yMin / step) * step; t <= yMax; t += step) ticks.push(t);
  const path = (k: (typeof SERIES)[number]["key"]) => rows.map((r, i) => `${i ? "L" : "M"}${x(i)},${y(r[k])}`).join("");
  const curIdx = rows.findIndex((r) => r.when === "current");

  // Direct labels at the right edge, nudged apart so they never overlap.
  const last = rows[rows.length - 1];
  const ends = SERIES.map((s) => ({ ...s, y: y(last[s.key]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;

  const s = sel != null ? rows[sel] : null;

  return (
    <div>
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <svg width="22" height="8" aria-hidden>
              <line x1="1" x2="21" y1="4" y2="4" stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinecap="round" />
            </svg>
            {s.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">⭐ Goal {rupeesShort(goal)}</li>
      </ul>
      <div className="relative" ref={box}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="w-full select-none" role="img" aria-label="Projected savings through the period">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeOpacity={0.1} />
              <text x={M.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="var(--muted)" className="num">
                {rupeesShort(t)}
              </text>
            </g>
          ))}
          {curIdx >= 0 && (
            <rect x={x(curIdx) - 18} y={M.top} width={36} height={ih} fill="var(--yellow)" opacity={0.18} rx={4} />
          )}
          <line x1={M.left} x2={W - M.right} y1={y(goal)} y2={y(goal)} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="1 4" strokeLinecap="round" />
          <text x={M.left + 4} y={y(goal) - 6} fontSize="11" fontWeight="800" fill="var(--ink)">
            ⭐ Goal
          </text>
          {rows.map((r, i) => (
            <text key={r.month} x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fontWeight={i === curIdx ? 800 : 600} fill={i === curIdx ? "var(--ink)" : "var(--muted)"}>
              {monthLabel(r.month)}
            </text>
          ))}
          {[...SERIES].reverse().map((s) => (
            <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {rows.map((r, i) => (
            <circle key={r.month} cx={x(i)} cy={y(r.projected)} r={4.5} fill="var(--chart-1)" stroke="var(--panel)" strokeWidth={2} />
          ))}
          {ends.map((e) => (
            <g key={e.key}>
              <line x1={W - M.right + 6} x2={W - M.right + 14} y1={e.y} y2={e.y} stroke={e.color} strokeWidth={3} strokeLinecap="round" />
              <text x={W - M.right + 18} y={e.y + 4} fontSize="11" fontWeight="800" fill="var(--ink)" className="num">
                {rupeesShort(last[e.key])}
              </text>
            </g>
          ))}
          {s && sel != null && (
            <g pointerEvents="none">
              <line x1={x(sel)} x2={x(sel)} y1={M.top} y2={M.top + ih} stroke="var(--line)" strokeOpacity={0.5} />
              {SERIES.map((sr) => (
                <circle key={sr.key} cx={x(sel)} cy={y(s[sr.key])} r={5} fill={sr.color} stroke="var(--panel)" strokeWidth={2} />
              ))}
            </g>
          )}
          {/* hit targets: one column per month */}
          {rows.map((r, i) => (
            <rect
              key={r.month}
              x={x(i) - iw / (rows.length - 1 || 1) / 2}
              y={0}
              width={iw / (rows.length - 1 || 1)}
              height={H}
              fill="transparent"
              onPointerEnter={() => setSel(i)}
              onPointerDown={() => setSel(i)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setSel(null)}
            />
          ))}
        </svg>
        {s && sel != null && (
          <div
            className="panel pointer-events-none absolute top-1 z-10 w-44 px-2.5 py-2 text-xs"
            style={{
              left: `${(x(sel) / W) * 100}%`,
              transform: `translateX(${sel > rows.length / 2 ? "calc(-100% - 10px)" : "10px"})`,
            }}
          >
            <p className="mb-1 font-extrabold">
              End of {monthLabel(s.month, "long")}
              {s.when === "past" ? "" : s.when === "current" ? " (now)" : ""}
            </p>
            {SERIES.map((sr) => (
              <p key={sr.key} className="flex items-center gap-1.5 font-semibold text-muted">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: sr.color }} />
                {sr.label}
                <span className="num ml-auto text-ink">{rupees(s[sr.key])}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function niceStep(raw: number) {
  return [10000, 20000, 25000, 50000, 100000, 200000].find((s) => s >= raw) ?? 500000;
}
