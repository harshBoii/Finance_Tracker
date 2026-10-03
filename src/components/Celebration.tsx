"use client";

import { useEffect } from "react";

export interface CelebrationSpec {
  title: string; // big text inside the burst
  jp: string; // little exclamation above it
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

const OUTER = burstPoints(14, 104, 80);

/** Soft speed-line burst for milestones, finished installments and skipped buys. */
export function Celebration({ spec, onDone }: { spec: CelebrationSpec; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <button
      className="anim-fade fixed inset-0 z-[70] flex cursor-pointer items-center justify-center overflow-hidden bg-bg/80 backdrop-blur-sm"
      onClick={onDone}
      aria-label={`${spec.title}. Tap to close`}
    >
      <div className="speedlines anim-spin-slow pointer-events-none absolute -inset-[50%] opacity-50" />
      <div className="relative flex flex-col items-center">
        <span aria-hidden className="jp anim-burst mb-[-14px] -rotate-6 text-4xl text-pink-ink">
          {spec.jp}
        </span>
        <div className="anim-burst relative h-[16rem] w-[16rem]" style={{ animationDelay: "80ms" }}>
          <svg viewBox="0 0 220 220" className="h-full w-full drop-shadow-[0_14px_30px_rgba(239,122,166,0.35)]" aria-hidden>
            <defs>
              <linearGradient id="burst-fill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffe7a8" />
                <stop offset="1" stopColor="#ffc2d8" />
              </linearGradient>
            </defs>
            <polygon points={OUTER} fill="url(#burst-fill)" stroke="#fff" strokeWidth={5} strokeLinejoin="round" />
          </svg>
          <span className="num absolute inset-0 flex items-center justify-center px-10 text-center text-[2rem] leading-tight text-[#5a3150]">
            {spec.title}
          </span>
        </div>
        {spec.sub && (
          <p className="panel anim-pop mt-1 max-w-[18rem] px-4 py-2.5 text-center text-sm font-bold" style={{ animationDelay: "250ms" }}>
            {spec.sub}
          </p>
        )}
      </div>
    </button>
  );
}
