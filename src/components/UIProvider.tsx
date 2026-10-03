"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Celebration, type CelebrationSpec } from "./Celebration";
import { QuickAdd } from "./QuickAdd";
import { dayKey } from "@/lib/dates";

interface ToastSpec {
  message: string;
  action?: { label: string; run: () => void };
}

interface UI {
  toast: (message: string, action?: ToastSpec["action"]) => void;
  celebrate: (spec: CelebrationSpec) => void;
  openQuickAdd: () => void;
}

const UICtx = createContext<UI | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [toastSpec, setToast] = useState<ToastSpec | null>(null);
  const [queue, setQueue] = useState<{ id: number; spec: CelebrationSpec }[]>([]);
  const [quickOpen, setQuickOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toast = useCallback((message: string, action?: ToastSpec["action"]) => {
    clearTimeout(timer.current);
    setToast({ message, action });
    timer.current = setTimeout(() => setToast(null), action ? 5000 : 2600);
  }, []);
  const celebrate = useCallback((spec: CelebrationSpec) => setQueue((q) => [...q, { id: Date.now() + Math.random(), spec }]), []);
  const openQuickAdd = useCallback(() => {
    setToast(null);
    setQuickOpen(true);
  }, []);
  const closeCelebration = useCallback(() => setQueue((q) => q.slice(1)), []);

  return (
    <UICtx.Provider value={{ toast, celebrate, openQuickAdd }}>
      {children}
      <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} />
      {toastSpec && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 md:bottom-6">
          <div
            role="status"
            className="panel anim-pop pointer-events-auto flex max-w-md items-center gap-3 bg-ink px-4 py-2.5 text-sm font-bold text-paper"
          >
            <span>{toastSpec.message}</span>
            {toastSpec.action && (
              <button
                className="rounded-[3px] bg-yellow px-2 py-0.5 text-on-accent"
                onClick={() => {
                  toastSpec.action!.run();
                  setToast(null);
                }}
              >
                {toastSpec.action.label}
              </button>
            )}
          </div>
        </div>
      )}
      {queue[0] && <Celebration key={queue[0].id} spec={queue[0].spec} onDone={closeCelebration} />}
    </UICtx.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UICtx);
  if (!ctx) throw new Error("useUI outside UIProvider");
  return ctx;
}

/** Ticks so countdowns and "today" stay fresh while the app sits open. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    const wake = () => setNow(Date.now());
    document.addEventListener("visibilitychange", wake);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [intervalMs]);
  return now;
}

export function useToday() {
  return dayKey(new Date(useNow()));
}
