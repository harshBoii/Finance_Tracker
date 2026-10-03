"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { dayLabel, monthLabel } from "@/lib/dates";
import type { FlowItem, FlowSource, FlowStatus } from "@/lib/finance";
import { Empty, Money, Panel, cx, tone } from "./ui";

const SOURCES: Record<FlowSource, { label: string; color: string; dir: "in" | "out" }> = {
  salary: { label: "Salary", color: "green", dir: "in" },
  opening: { label: "Opening cash", color: "cyan", dir: "in" },
  income: { label: "Other income", color: "violet", dir: "in" },
  everyday: { label: "Everyday spending", color: "yellow", dir: "out" },
  installment: { label: "EMIs & pay-later", color: "pink", dir: "out" },
  bill: { label: "Bills", color: "red", dir: "out" },
  purchase: { label: "One-time buys", color: "cyan", dir: "out" },
};
const SOURCE_KEYS = Object.keys(SOURCES) as FlowSource[];

type Dir = "all" | "in" | "out";
type Sort = "date-asc" | "date-desc" | "amt-desc" | "amt-asc" | "name";
type Group = "month" | "source" | "none";

const SORTS: Record<Sort, string> = {
  "date-asc": "Month · oldest first",
  "date-desc": "Month · newest first",
  "amt-desc": "Amount · largest first",
  "amt-asc": "Amount · smallest first",
  name: "Name · A–Z",
};

const sum = (xs: FlowItem[]) => xs.reduce((a, i) => a + i.amount, 0);
const signed = (i: FlowItem) => (i.dir === "in" ? i.amount : -i.amount);

function statusText(i: FlowItem) {
  if (i.status === "estimate") return "estimate";
  if (i.status === "upcoming") return "upcoming";
  return i.dir === "in" ? "received" : i.source === "everyday" ? "spent" : "paid";
}

/** Everything that feeds the projection: what comes in, what goes out, and when — segmented, sortable, filterable. */
export function MoneyFlow({ items, className }: { items: FlowItem[]; className?: string }) {
  const months = useMemo(() => [...new Set(items.map((i) => i.month))], [items]);
  const [dir, setDir] = useState<Dir>("all");
  const [source, setSource] = useState<FlowSource | "all">("all");
  const [month, setMonth] = useState<string>("all");
  const [status, setStatus] = useState<FlowStatus | "all">("all");
  const [sort, setSort] = useState<Sort>("date-asc");
  const [group, setGroup] = useState<Group>("month");

  // Totals and segment bars follow the month/status filters; direction and source narrow only the list.
  const scoped = items.filter((i) => (month === "all" || i.month === month) && (status === "all" || i.status === status));
  const ins = scoped.filter((i) => i.dir === "in");
  const outs = scoped.filter((i) => i.dir === "out");
  const inTotal = sum(ins);
  const outTotal = sum(outs);

  const shown = scoped
    .filter((i) => (dir === "all" || i.dir === dir) && (source === "all" || i.source === source))
    .sort((a, b) => {
      switch (sort) {
        case "date-desc":
          return (
            b.month.localeCompare(a.month) ||
            (a.dir === b.dir ? 0 : a.dir === "in" ? -1 : 1) ||
            (a.dir === "in" ? b.date.localeCompare(a.date) : b.amount - a.amount)
          );
        case "amt-desc":
          return b.amount - a.amount;
        case "amt-asc":
          return a.amount - b.amount;
        case "name":
          return a.label.localeCompare(b.label);
        default:
          // Within a month: income first (by day), then outgoings largest first.
          return (
            a.month.localeCompare(b.month) ||
            (a.dir === b.dir ? 0 : a.dir === "in" ? -1 : 1) ||
            (a.dir === "in" ? a.date.localeCompare(b.date) : b.amount - a.amount)
          );
      }
    });

  const groups: { key: string; title: string; items: FlowItem[] }[] = [];
  if (group === "none") groups.push({ key: "all", title: "", items: shown });
  else {
    const order = group === "month" ? months : SOURCE_KEYS;
    const ordered = group === "month" && sort === "date-desc" ? [...order].reverse() : order;
    for (const k of ordered) {
      const g = shown.filter((i) => (group === "month" ? i.month : i.source) === k);
      if (g.length)
        groups.push({ key: k, title: group === "month" ? monthLabel(k, "long") : SOURCES[k as FlowSource].label, items: g });
    }
    if (group === "source" && sort.startsWith("amt"))
      groups.sort((a, b) => (sort === "amt-desc" ? sum(b.items) - sum(a.items) : sum(a.items) - sum(b.items)));
  }

  const filtered = dir !== "all" || source !== "all" || month !== "all" || status !== "all";
  const reset = () => {
    setDir("all");
    setSource("all");
    setMonth("all");
    setStatus("all");
  };
  const pickSource = (s: FlowSource) => {
    setSource((cur) => (cur === s ? "all" : s));
    setDir("all");
  };

  return (
    <Panel
      title="Money flow"
      jp="収支"
      className={className}
      right={<span className="text-xs font-bold text-muted">{shown.length} items</span>}
    >
      {/* totals */}
      <div className="grid grid-cols-3 gap-3">
        <Total label="Coming in" value={inTotal} className="text-green-ink" />
        <Total label="Going out" value={-outTotal} className="text-red-ink" />
        <Total label={month === "all" ? "Net saved" : `Net in ${monthLabel(month)}`} value={inTotal - outTotal} signed />
      </div>

      {/* segments */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Segments title="What's contributing" items={ins} total={inTotal} active={source} onPick={pickSource} />
        <Segments title="What's exhausting it" items={outs} total={outTotal} active={source} onPick={pickSource} />
      </div>

      {/* controls */}
      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-3">
        <div className="flex gap-1">
          {(["all", "in", "out"] as const).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDir(d);
                if (source !== "all" && d !== "all" && SOURCES[source].dir !== d) setSource("all");
              }}
              className={cx("chip px-3 py-1.5 text-xs", dir === d ? "chip-on" : "text-muted")}
            >
              {d === "all" ? "All" : d === "in" ? "Income" : "Expenses"}
            </button>
          ))}
        </div>
        <Select label="Source" value={source} onChange={(v) => setSource(v as FlowSource | "all")}>
          <option value="all">All sources</option>
          {SOURCE_KEYS.filter((s) => dir === "all" || SOURCES[s].dir === dir).map((s) => (
            <option key={s} value={s}>
              {SOURCES[s].label}
            </option>
          ))}
        </Select>
        <Select label="Month" value={month} onChange={setMonth}>
          <option value="all">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m, "long")}
            </option>
          ))}
        </Select>
        <Select label="Status" value={status} onChange={(v) => setStatus(v as FlowStatus | "all")}>
          <option value="all">Any status</option>
          <option value="done">Done</option>
          <option value="upcoming">Upcoming</option>
          <option value="estimate">Estimate</option>
        </Select>
        <Select label="Sort" value={sort} onChange={(v) => setSort(v as Sort)}>
          {(Object.keys(SORTS) as Sort[]).map((s) => (
            <option key={s} value={s}>
              {SORTS[s]}
            </option>
          ))}
        </Select>
        <Select label="Group" value={group} onChange={(v) => setGroup(v as Group)}>
          <option value="month">By month</option>
          <option value="source">By source</option>
          <option value="none">No grouping</option>
        </Select>
        {filtered && (
          <button className="btn btn-quiet px-3 py-1.5 text-xs" onClick={reset}>
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      {/* list */}
      <div className="mt-3">
        {shown.length === 0 ? (
          <Empty>Nothing matches these filters.</Empty>
        ) : (
          <div className="grid gap-x-6 gap-y-4 xl:grid-cols-2">
            {groups.map((g) => {
              const gin = sum(g.items.filter((i) => i.dir === "in"));
              const gout = sum(g.items.filter((i) => i.dir === "out"));
              return (
                <section key={g.key} className={cx(group === "none" && "xl:col-span-2")}>
                  {g.title && (
                    <header className="mb-1 flex flex-wrap items-baseline gap-x-2 border-b border-line-strong pb-1">
                      <h3 className="display text-sm">{g.title}</h3>
                      <span className="ml-auto text-[11px] font-semibold text-muted">
                        {gin > 0 && <Money value={gin} signed className="text-green-ink" />}
                        {gin > 0 && gout > 0 && " · "}
                        {gout > 0 && <Money value={-gout} className="text-red-ink" />}
                        {gin > 0 && gout > 0 && (
                          <>
                            {" = "}
                            <Money value={gin - gout} signed className="text-ink" />
                          </>
                        )}
                      </span>
                    </header>
                  )}
                  <ul className="divide-y divide-line">
                    {g.items.map((i) => (
                      <Row key={i.id} i={i} showMonth={group !== "month"} showSource={group !== "source"} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </Panel>
  );
}

function Row({ i, showMonth, showSource }: { i: FlowItem; showMonth: boolean; showSource: boolean }) {
  const meta = SOURCES[i.source];
  const exactDay = i.dir === "in";
  const when = exactDay ? dayLabel(i.date) : showMonth ? monthLabel(i.month, "long") : "";
  return (
    <li className="flex items-center gap-2.5 py-1.5">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: tone(meta.color) }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{i.label}</p>
        <p className="text-[11px] font-semibold text-muted">
          {[when, showSource && meta.label].filter(Boolean).join(" · ")}
          <span
            className={cx(
              "ml-1.5 rounded-full px-1.5 py-px text-[10px]",
              i.status === "done" ? "bg-green/15 text-green-ink" : i.status === "upcoming" ? "bg-cyan/15 text-cyan-ink" : "bg-yellow/20 text-yellow-ink",
            )}
          >
            {statusText(i)}
          </span>
        </p>
      </div>
      <Money value={signed(i)} signed className={cx("text-sm", i.dir === "in" ? "text-green-ink" : "text-ink")} />
    </li>
  );
}

function Total({ label, value, className, signed }: { label: string; value: number; className?: string; signed?: boolean }) {
  return (
    <div>
      <p className="label">{label}</p>
      <Money value={value} signed={signed} className={cx("text-[1.05rem] leading-tight sm:text-[1.7rem]", className)} />
    </div>
  );
}

/** One stacked bar of sources plus a clickable legend that filters the list. */
function Segments({
  title,
  items,
  total,
  active,
  onPick,
}: {
  title: string;
  items: FlowItem[];
  total: number;
  active: FlowSource | "all";
  onPick: (s: FlowSource) => void;
}) {
  const parts = SOURCE_KEYS.map((s) => ({ s, v: sum(items.filter((i) => i.source === s)) }))
    .filter((p) => p.v > 0)
    .sort((a, b) => b.v - a.v);
  return (
    <div>
      <p className="label mb-1.5">{title}</p>
      {total <= 0 ? (
        <p className="text-xs font-semibold text-muted">Nothing here.</p>
      ) : (
        <>
          <div className="flex h-3.5 overflow-hidden rounded-full bg-sunk">
            {parts.map((p) => (
              <div
                key={p.s}
                title={`${SOURCES[p.s].label}: ${Math.round((p.v / total) * 100)}%`}
                className={cx("h-full transition-opacity", active !== "all" && active !== p.s && "opacity-30")}
                style={{ width: `${(p.v / total) * 100}%`, background: tone(SOURCES[p.s].color) }}
              />
            ))}
          </div>
          <ul className="mt-2 space-y-1">
            {parts.map((p) => (
              <li key={p.s}>
                <button
                  onClick={() => onPick(p.s)}
                  className={cx(
                    "flex w-full items-center gap-2 rounded-lg px-1.5 py-0.5 text-left text-xs hover:bg-sunk",
                    active === p.s && "bg-sunk",
                  )}
                  aria-pressed={active === p.s}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone(SOURCES[p.s].color) }} />
                  <span className="font-bold">{SOURCES[p.s].label}</span>
                  <span className="text-muted">{Math.round((p.v / total) * 100)}%</span>
                  <Money value={p.v} className="ml-auto font-bold" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-[8.5rem] flex-1 sm:flex-none">
      <span className="label mb-0.5">{label}</span>
      <select className="field py-1.5 text-xs" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  );
}
