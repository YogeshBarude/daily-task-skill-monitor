"use client";

import clsx from "clsx";
import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={clsx("rounded-lg border border-[#263340] bg-[#0d151f] p-4", className)}>{children}</section>;
}

export function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-blue-600 text-white hover:bg-blue-500",
        variant === "secondary" && "border border-[#304050] bg-[#101923] text-slate-200 hover:bg-[#182330]",
        variant === "danger" && "bg-danger text-white hover:bg-red-700",
        variant === "ghost" && "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-slate-400">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "min-h-10 w-full rounded-md border border-[#304050] bg-[#0a111a] px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "blue" | "green" | "amber" | "red" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        tone === "slate" && "bg-slate-100 text-slate-700",
        tone === "blue" && "bg-blue-100 text-blue-700",
        tone === "green" && "bg-green-100 text-green-700",
        tone === "amber" && "bg-amber-100 text-amber-700",
        tone === "red" && "bg-red-100 text-red-700"
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#304050] bg-[#0a111a] p-6 text-center">
      <p className="font-semibold text-slate-200">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#202b37]">
      <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
