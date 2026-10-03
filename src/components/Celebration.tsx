"use client";

import { useEffect } from "react";

export interface CelebrationSpec {
  title: string; // big text inside the burst
  jp: string; // onomatopoeia / label
  sub?: string;
}

function burstPoints(spikes: number, outer: number, inner: number, c = 110) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

const OUTER = burstPoints(18, 106, 74);
const INNER = burstPoints(18, 90, 66);

/** Full-screen speed-line burst for milestones, finished installments and skipped buys. */
export function Celebration({ spec, onDone }: { spec: CelebrationSpec; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <button
      className="anim-fade fixed inset-0 z-[70] flex cursor-pointer items-center justify-center overflow-hidden bg-paper/85"
      onClick={onDone}
      aria-label={`${spec.title}. Tap to close`}
    >
      <div className="speedlines anim-spin-slow pointer-events-none absolute -inset-[50%] opacity-60" />
      <div className="relative flex flex-col items-center">
        <span aria-hidden className="jp anim-burst mb-[-18px] -rotate-6 text-5xl text-pink [text-shadow:3px_3px_0_var(--line)]">
          {spec.jp}
        </span>
        <div className="anim-burst relative h-[17rem] w-[17rem]" style={{ animationDelay: "80ms" }}>
          <svg viewBox="0 0 220 220" className="h-full w-full" aria-hidden>
            <polygon points={OUTER} fill="var(--line)" />
            <polygon points={OUTER} fill="var(--yellow)" transform="translate(-4 -4)" stroke="var(--line)" strokeWidth={3} />
            <polygon points={INNER} fill="#fff" opacity={0.45} transform="translate(-4 -4)" />
          </svg>
          <span className="num absolute inset-0 flex items-center justify-center px-10 text-center text-[2.1rem] leading-tight text-on-accent">
            {spec.title}
          </span>
        </div>
        {spec.sub && (
          <p className="panel anim-pop mt-2 max-w-[18rem] px-3 py-2 text-center text-sm font-bold" style={{ animationDelay: "250ms" }}>
            {spec.sub}
          </p>
        )}
      </div>
    </button>
  );
}
