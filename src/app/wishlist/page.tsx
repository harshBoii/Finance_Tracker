"use client";

import { useState } from "react";
import { Hourglass, ShoppingBag, Trash2 } from "lucide-react";
import { useData } from "@/lib/data";
import { rupees } from "@/lib/format";
import type { WishItem } from "@/lib/types";
import { useNow, useUI } from "@/components/UIProvider";
import { Bar, Empty, Money, PageTitle, Panel, cx } from "@/components/ui";

export default function WishlistPage() {
  const { plan, wishlist, addWish } = useData();
  const { toast } = useUI();
  const now = useNow(1000);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState(plan.categories.find((c) => c.isRemainder)?.id ?? plan.categories[0]?.id);
  const waiting = wishlist.filter((w) => w.status === "waiting");
  const done = wishlist.filter((w) => w.status !== "waiting");
  const avoided = wishlist.filter((w) => w.status === "dropped").reduce((a, w) => a + w.amount, 0);
  const n = Number(amount) || 0;

  function add() {
    if (!name.trim() || !n || !cat) return;
    addWish({ name: name.trim(), amount: n, categoryId: cat });
    setName("");
    setAmount("");
    toast(`Timer started: ${plan.wishlistHours}h to decide`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageTitle title="Wishlist" jp="欲しい物" sub={`${plan.wishlistHours}h rule · over ${rupees(plan.wishlistThreshold)}`} />

      <section className="panel halftone flex items-center gap-4 p-4">
        <div className="flex-1">
          <p className="text-[11px] font-extrabold tracking-wide text-muted uppercase">Avoided by deleting</p>
          <Money value={avoided} className="text-[2.6rem] leading-none text-green" />
        </div>
        <span aria-hidden className="jp rotate-6 text-3xl text-pink">
          我慢
        </span>
      </section>

      <Panel title="Want something?" jp="待て">
        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <input className="field" placeholder="What is it?" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            className="field num"
            placeholder="₹"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {plan.categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cx(
                "rounded-full border-2 px-2.5 py-1 text-xs font-bold",
                cat === c.id ? "border-line bg-ink text-paper" : "border-line/25",
              )}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
        <button className="btn mt-3 w-full bg-yellow py-2.5 text-on-accent" onClick={add} disabled={!name.trim() || !n}>
          <Hourglass size={16} strokeWidth={2.5} /> Start the {plan.wishlistHours}h timer
        </button>
      </Panel>

      <Panel title="Cooling off" jp="冷却中">
        {waiting.length === 0 ? (
          <Empty>Nothing waiting. Impulse buys over {rupees(plan.wishlistThreshold)} land here from Quick add.</Empty>
        ) : (
          <ul className="space-y-4">
            {waiting.map((w) => (
              <WishRow key={w.id} w={w} now={now} hours={plan.wishlistHours} />
            ))}
          </ul>
        )}
      </Panel>

      {done.length > 0 && (
        <Panel title="History" jp="履歴">
          <ul className="divide-y-2 divide-line/10">
            {done.slice(0, 20).map((w) => (
              <li key={w.id} className="flex items-center gap-2 py-2 text-sm">
                <span className={cx("font-bold", w.status === "dropped" && "line-through")}>{w.name}</span>
                <span
                  className={cx(
                    "rounded-[3px] px-1.5 text-[10px] font-extrabold uppercase",
                    w.status === "dropped" ? "bg-green text-on-accent" : "bg-sunk text-muted",
                  )}
                >
                  {w.status === "dropped" ? "avoided" : "bought"}
                </span>
                <Money value={w.amount} className="ml-auto" />
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function WishRow({ w, now, hours }: { w: WishItem; now: number; hours: number }) {
  const { resolveWish } = useData();
  const { toast, celebrate } = useUI();
  const total = hours * 3600_000;
  const left = Math.max(0, w.createdAt + total - now);
  const ready = left === 0;
  const h = Math.floor(left / 3600_000);
  const m = Math.floor((left % 3600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);

  return (
    <li>
      <div className="flex items-baseline gap-2">
        <span className="font-extrabold">{w.name}</span>
        <Money value={w.amount} className="ml-auto text-lg" />
      </div>
      <Bar value={total - left} max={total} color={ready ? "green" : "cyan"} height={10} className="mt-1.5" />
      <div className="mt-2 flex items-center gap-2">
        <span className={cx("num min-w-0 flex-1 text-sm", ready ? "text-green" : "text-muted")}>
          {ready ? "Time\u2019s up. Still want it?" : `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`}
        </span>
        <button
          className="btn bg-green px-2.5 py-1 text-xs whitespace-nowrap text-on-accent"
          onClick={() => {
            resolveWish(w, "dropped");
            celebrate({ title: `+${rupees(w.amount)}`, jp: "我慢!", sub: `Didn't buy ${w.name}. Saved instead.` });
          }}
        >
          <Trash2 size={13} /> Don&apos;t buy
        </button>
        <button
          className="btn bg-panel px-2.5 py-1 text-xs whitespace-nowrap"
          disabled={!ready}
          title={ready ? undefined : "Locked until the timer ends"}
          onClick={() => {
            resolveWish(w, "bought");
            toast(`${w.name} logged as an expense`);
          }}
        >
          <ShoppingBag size={13} /> Bought
        </button>
      </div>
    </li>
  );
}
