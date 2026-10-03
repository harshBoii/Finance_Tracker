"use client";

import Link from "next/link";
import { ChevronRight, LogOut } from "lucide-react";
import { NAV } from "@/components/Shell";
import { useData } from "@/lib/data";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageTitle } from "@/components/ui";

const MORE = ["/projection", "/wishlist", "/installments", "/checkin", "/settings"];

export default function MorePage() {
  const { lock } = useData();
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <PageTitle title="More" jp="他" />
      {NAV.filter((n) => MORE.includes(n.href)).map((n) => (
        <Link key={n.href} href={n.href} className="panel flex items-center gap-3 px-4 py-3.5 font-extrabold">
          <n.icon size={20} strokeWidth={2.5} />
          {n.label}
          <span aria-hidden className="jp text-xs text-pink-ink">
            {n.jp}
          </span>
          <ChevronRight size={18} className="ml-auto" />
        </Link>
      ))}
      <div className="flex items-center gap-2 pt-4">
        <ThemeToggle />
        <button className="btn ml-auto px-3 py-1.5 text-sm" onClick={lock}>
          <LogOut size={14} /> Lock
        </button>
      </div>
    </div>
  );
}
