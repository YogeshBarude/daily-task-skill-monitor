"use client";

import clsx from "clsx";
import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={clsx("app-card rounded-lg border border-[#2B3240] bg-[#171B23] p-4", className)}>{children}</section>;
}

export function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[#5B8DEF] text-white shadow-[0_8px_24px_rgba(91,141,239,0.2)] hover:bg-[#6D99F1]",
        variant === "secondary" && "border border-[#252A35] bg-[#1E2330] text-[#F0F2F5] hover:bg-[#252B39]",
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
    <label className="grid gap-1.5 text-[11px] font-semibold uppercase text-[#8792A8]">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "min-h-10 w-full rounded-lg border border-[#252A35] bg-[#1E2330] px-3 py-2 text-sm font-normal text-[#F0F2F5] outline-none placeholder:text-[#7A8499] focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/10";

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
    <div className="rounded-lg border border-dashed border-[#252A35] bg-transparent p-6 text-center">
      <p className="font-semibold text-slate-200">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#29303D]">
      <div className="h-full rounded-full bg-[#5B8DEF]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
