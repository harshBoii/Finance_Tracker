"use client";

import { useState, type ReactNode } from "react";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useData } from "@/lib/data";
import { addMonths, monthLabel, monthRange } from "@/lib/dates";
import { budgetsFor, salaryShare } from "@/lib/finance";
import { rupees } from "@/lib/format";
import type { Category, Commitment, Plan, Pot } from "@/lib/types";
import { CommitmentEditor, blankCommitment } from "@/components/CommitmentEditor";
import { MODE_LABEL } from "@/components/DueRow";
import { useUI } from "@/components/UIProvider";
import { Money, PageTitle, Panel, cx } from "@/components/ui";

const COLORS = ["green", "red", "violet", "yellow", "cyan", "pink"];

export default function SettingsPage() {
  const { plan, savePlan, commitments, pots, lock } = useData();
  const { toast } = useUI();
  const [draft, setDraft] = useState<Plan>(plan);
  const [editing, setEditing] = useState<Commitment | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(plan);
  const set = <K extends keyof Plan>(k: K, v: Plan[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const periodMonths = monthRange(draft.periodStart, draft.periodEnd);
  const wideMonths = monthRange(addMonths(draft.periodStart, -1), addMonths(draft.periodEnd, 1));

  function setCat(i: number, patch: Partial<Category>) {
    set("categories", draft.categories.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }

  function save() {
    savePlan(draft);
    toast("Plan saved");
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] pb-16">
      <PageTitle title="Settings" jp="設定" />

      <div className="gap-5 lg:columns-2 2xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid lg:[&>*]:mb-5">
      <Panel title="Period & cash" jp="期間">
        <Grid>
          <Field label="Start month">
            <MonthSelect value={draft.periodStart} onChange={(v) => set("periodStart", v)} />
          </Field>
          <Field label="End month">
            <MonthSelect value={draft.periodEnd} onChange={(v) => set("periodEnd", v)} />
          </Field>
          <Field label="Cash on hand">
            <Num value={draft.openingCash} onChange={(v) => set("openingCash", v)} />
          </Field>
          <Field label="…as of">
            <input type="date" className="field" value={draft.openingDate} onChange={(e) => set("openingDate", e.target.value)} />
          </Field>
          <Field label="Laptop fund (kept separate)">
            <Num value={draft.laptopFund} onChange={(v) => set("laptopFund", v)} />
          </Field>
        </Grid>
      </Panel>

      <Panel title="Salary" jp="給料">
        <Grid>
          <Field label="Gross / month">
            <Num value={draft.salary.gross} onChange={(v) => set("salary", { ...draft.salary, gross: v })} />
          </Field>
          <Field label="Office savings scheme">
            <Num value={draft.salary.officeScheme} onChange={(v) => set("salary", { ...draft.salary, officeScheme: v })} />
          </Field>
          <Field label="To parents">
            <Num value={draft.salary.toParents} onChange={(v) => set("salary", { ...draft.salary, toParents: v })} />
          </Field>
          <Field label="Lands on day">
            <Num value={draft.salary.creditDay} onChange={(v) => set("salary", { ...draft.salary, creditDay: Math.min(31, Math.max(1, v)) })} />
          </Field>
        </Grid>
        <p className="mt-2 text-xs font-semibold text-muted">
          Yours each month: <Money value={salaryShare(draft)} className="text-ink" />. Tap the months it lands in:
        </p>
        <Chips
          options={wideMonths}
          selected={draft.salary.months}
          onToggle={(m) =>
            set("salary", {
              ...draft.salary,
              months: draft.salary.months.includes(m) ? draft.salary.months.filter((x) => x !== m) : [...draft.salary.months, m].sort(),
            })
          }
        />
      </Panel>

      <Panel title="Other income" jp="臨時収入">
        <div className="space-y-2">
          {draft.incomes.map((inc, i) => (
            <div key={inc.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 sm:grid-cols-[1fr_6rem_8.5rem_auto]">
              <input
                className="field col-span-3 text-sm sm:col-span-1"
                value={inc.label}
                onChange={(e) => set("incomes", draft.incomes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                aria-label="Income label"
              />
              <Num value={inc.amount} onChange={(v) => set("incomes", draft.incomes.map((x, j) => (j === i ? { ...x, amount: v } : x)))} />
              <input
                type="date"
                className="field text-sm"
                value={inc.date}
                onChange={(e) => set("incomes", draft.incomes.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))}
                aria-label="Income date"
              />
              <IconBtn label="Remove income" onClick={() => set("incomes", draft.incomes.filter((_, j) => j !== i))}>
                <Trash2 size={15} />
              </IconBtn>
            </div>
          ))}
        </div>
        <button
          className="btn mt-3 px-2.5 py-1 text-xs"
          onClick={() =>
            set("incomes", [...draft.incomes, { id: `inc-${Date.now().toString(36)}`, label: "New income", amount: 0, date: `${draft.periodStart}-01` }])
          }
        >
          <Plus size={14} /> Add income
        </button>
      </Panel>

      <Panel title="Monthly budget" jp="予算">
        <Grid>
          <Field label="Normal month cap">
            <Num value={draft.monthlyCap} onChange={(v) => set("monthlyCap", v)} />
          </Field>
          <Field label="Trip month cap">
            <Num value={draft.tripMonthCap} onChange={(v) => set("tripMonthCap", v)} />
          </Field>
        </Grid>
        <p className="mt-3 mb-1 text-[11px] font-extrabold tracking-wide text-muted uppercase">Trip months</p>
        <Chips
          options={periodMonths}
          selected={draft.tripMonths}
          onToggle={(m) => set("tripMonths", draft.tripMonths.includes(m) ? draft.tripMonths.filter((x) => x !== m) : [...draft.tripMonths, m].sort())}
        />
        <p className="mt-4 mb-1 text-[11px] font-extrabold tracking-wide text-muted uppercase">Categories</p>
        <div className="space-y-3">
          {draft.categories.map((c, i) => (
            <div key={c.id} className="rounded-2xl border border-line-strong p-2.5">
              <div className="grid grid-cols-[3rem_1fr_3.5rem_auto] gap-2">
                <input className="field px-1 text-center text-lg" value={c.emoji} onChange={(e) => setCat(i, { emoji: e.target.value })} aria-label="Emoji" />
                <input className="field text-sm" value={c.name} onChange={(e) => setCat(i, { name: e.target.value })} aria-label="Category name" />
                <input className="field jp px-1 text-center text-sm" value={c.jp} onChange={(e) => setCat(i, { jp: e.target.value })} aria-label="Japanese label" />
                <IconBtn
                  label="Remove category"
                  onClick={() => confirm(`Remove ${c.name}? Past expenses keep their amount.`) && set("categories", draft.categories.filter((_, j) => j !== i))}
                >
                  <Trash2 size={15} />
                </IconBtn>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {c.isRemainder ? (
                  <p className="col-span-2 self-center text-xs font-semibold text-muted">
                    Gets what&apos;s left under the cap: {rupees(budgetsFor(draft, draft.periodStart)[c.id] ?? 0)} in {monthLabel(draft.periodStart)}
                  </p>
                ) : (
                  <>
                    <Field label="Monthly">
                      <Num value={c.monthly} onChange={(v) => setCat(i, { monthly: v })} />
                    </Field>
                    <Field label="Trip month">
                      <input
                        className="field num"
                        inputMode="numeric"
                        placeholder="same"
                        value={c.tripMonthly ?? ""}
                        onChange={(e) => setCat(i, { tripMonthly: e.target.value === "" ? null : Number(e.target.value.replace(/\D/g, "")) })}
                      />
                    </Field>
                  </>
                )}
                <Field label="Color">
                  <div className="flex gap-1 pt-1">
                    {COLORS.map((col) => (
                      <button
                        key={col}
                        aria-label={col}
                        onClick={() => setCat(i, { color: col })}
                        className={cx("h-6 w-6 rounded-full border", c.color === col ? "border-line" : "border-transparent")}
                        style={{ background: `var(--${col})` }}
                      />
                    ))}
                  </div>
                </Field>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={!!c.isRemainder}
                  onChange={(e) => setCat(i, { isRemainder: e.target.checked || undefined })}
                />
                Fun / leftover bucket (budget = cap minus the rest)
              </label>
              <label className="mt-1 flex items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={c.period === "month"}
                  onChange={(e) => setCat(i, { period: e.target.checked ? "month" : undefined })}
                />
                Monthly allowance (kept out of the weekly number, with a &ldquo;mark used&rdquo; button)
              </label>
            </div>
          ))}
        </div>
        <button
          className="btn mt-3 px-2.5 py-1 text-xs"
          onClick={() =>
            set("categories", [
              ...draft.categories,
              { id: `cat-${Date.now().toString(36)}`, name: "New", jp: "他", emoji: "🛒", monthly: 0, color: "cyan" },
            ])
          }
        >
          <Plus size={14} /> Add category
        </button>
      </Panel>

      <Panel title="Targets & goal" jp="目標">
        <div className="grid grid-cols-3 gap-2">
          {periodMonths.map((m) => (
            <Field key={m} label={`Save in ${monthLabel(m)}`}>
              <Num value={draft.savingsTargets[m] ?? 0} onChange={(v) => set("savingsTargets", { ...draft.savingsTargets, [m]: v })} />
            </Field>
          ))}
        </div>
        <Grid>
          <Field label="Goal by end of period">
            <Num value={draft.goal} onChange={(v) => set("goal", v)} />
          </Field>
          <Field label="Milestone bursts (₹, comma separated)">
            <input
              className="field num"
              defaultValue={draft.milestones.join(", ")}
              onBlur={(e) =>
                set(
                  "milestones",
                  e.target.value
                    .split(",")
                    .map((x) => Number(x.replace(/\D/g, "")))
                    .filter((x) => x > 0)
                    .sort((a, b) => a - b),
                )
              }
            />
          </Field>
        </Grid>
      </Panel>

      <Panel title="Rules" jp="ルール">
        <Grid>
          <Field label="Warn if installments exceed">
            <Num value={draft.installmentWarn} onChange={(v) => set("installmentWarn", v)} />
          </Field>
          <Field label="Wishlist anything over">
            <Num value={draft.wishlistThreshold} onChange={(v) => set("wishlistThreshold", v)} />
          </Field>
          <Field label="Wishlist wait (hours)">
            <Num value={draft.wishlistHours} onChange={(v) => set("wishlistHours", Math.max(1, v))} />
          </Field>
        </Grid>
      </Panel>

      <Panel
        title="Planned items & EMIs"
        jp="予定"
        right={
          <button className="btn px-2 py-1 text-xs btn-primary" onClick={() => setEditing(blankCommitment(plan.periodStart, commitments.length))}>
            <Plus size={14} strokeWidth={3} /> Add
          </button>
        }
      >
        <p className="mb-2 text-xs font-semibold text-muted">These save immediately.</p>
        <ul className="divide-y divide-line">
          {commitments.map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-2 text-sm">
              {c.mustPay && <Lock size={12} strokeWidth={3} aria-label="Must pay" />}
              <span className="font-bold">{c.name}</span>
              <span className="text-[11px] font-semibold text-muted">
                {MODE_LABEL[c.mode]} · {c.months.length > 1 ? `${monthLabel(c.months[0])}–${monthLabel(c.months[c.months.length - 1])}` : monthLabel(c.months[0])}
              </span>
              <Money value={c.amount} className="ml-auto" />
              <IconBtn label={`Edit ${c.name}`} onClick={() => setEditing(c)}>
                <Pencil size={14} />
              </IconBtn>
            </li>
          ))}
        </ul>
      </Panel>

      <PotsEditor pots={pots} commitments={commitments} />

      <Panel title="Device" jp="端末">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-muted">Lock this device and clear its offline copy.</span>
          <button className="btn ml-auto px-3 py-1.5 text-xs" onClick={lock}>
            Lock
          </button>
        </div>
      </Panel>

      </div>

      {dirty && (
        <div className="fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 flex justify-center px-4 md:bottom-6 md:pl-56">
          <div className="panel anim-pop flex w-full max-w-md items-center gap-2 p-2">
            <span className="flex-1 pl-2 text-sm font-bold">Unsaved changes</span>
            <button className="btn px-3 py-1.5 text-sm" onClick={() => setDraft(plan)}>
              Reset
            </button>
            <button className="btn px-4 py-1.5 text-sm btn-primary" onClick={save}>
              Save plan
            </button>
          </div>
        </div>
      )}

      <CommitmentEditor item={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function PotsEditor({ pots, commitments }: { pots: Pot[]; commitments: Commitment[] }) {
  const { savePot, deletePot } = useData();
  return (
    <Panel title="Set-aside pots" jp="積立">
      <p className="mb-2 text-xs font-semibold text-muted">These save immediately. Paying a linked item uses the pot&apos;s money.</p>
      <div className="space-y-3">
        {pots.map((p) => (
          <div key={p.id} className="rounded-2xl border border-line-strong p-2.5">
            <div className="grid grid-cols-[1fr_3.5rem_6rem_auto] gap-2">
              <input className="field text-sm" defaultValue={p.name} onBlur={(e) => savePot({ ...p, name: e.target.value || p.name })} aria-label="Pot name" />
              <input className="field jp px-1 text-center text-sm" defaultValue={p.jp} onBlur={(e) => savePot({ ...p, jp: e.target.value })} aria-label="Japanese label" />
              <input
                className="field num text-sm"
                inputMode="numeric"
                defaultValue={p.target}
                onBlur={(e) => savePot({ ...p, target: Number(e.target.value.replace(/\D/g, "")) || p.target })}
                aria-label="Target"
              />
              <IconBtn label="Delete pot" onClick={() => confirm(`Delete the ${p.name} pot?`) && deletePot(p.id)}>
                <Trash2 size={15} />
              </IconBtn>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {commitments
                .filter((c) => c.mode === "cash")
                .map((c) => {
                  const on = p.commitmentIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() =>
                        savePot({ ...p, commitmentIds: on ? p.commitmentIds.filter((x) => x !== c.id) : [...p.commitmentIds, c.id] })
                      }
                      className={cx("rounded-full border px-2 py-0.5 text-[11px] font-bold", on ? "chip-on" : "border-line-strong")}
                    >
                      {c.name}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <button
        className="btn mt-3 px-2.5 py-1 text-xs"
        onClick={() =>
          savePot({ id: `pot-${Date.now().toString(36)}`, name: "New pot", jp: "積立", target: 10000, saved: 0, commitmentIds: [], order: pots.length })
        }
      >
        <Plus size={14} /> Add pot
      </button>
    </Panel>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="mt-2 grid grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block truncate text-[11px] font-extrabold tracking-wide text-muted uppercase">{label}</span>
      {children}
    </label>
  );
}

function Num({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      className="field num"
      inputMode="numeric"
      value={value === 0 ? "0" : value || ""}
      onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
    />
  );
}

function MonthSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="month" className="field" value={value} onChange={(e) => e.target.value && onChange(e.target.value)} />;
}

function Chips({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (m: string) => void }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {options.map((m) => (
        <button
          key={m}
          onClick={() => onToggle(m)}
          aria-pressed={selected.includes(m)}
          className={cx(
            "rounded-full border px-2.5 py-0.5 text-xs font-bold",
            selected.includes(m) ? "chip-on" : "border-line-strong",
          )}
        >
          {monthLabel(m)} {m.slice(2, 4)}
        </button>
      ))}
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button aria-label={label} onClick={onClick} className="rounded p-1.5 text-muted hover:text-ink">
      {children}
    </button>
  );
}
