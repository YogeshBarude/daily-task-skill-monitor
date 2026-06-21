"use client";

import clsx from "clsx";
import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={clsx("app-card rounded-lg border border-[#D5EBE7] bg-white p-4", className)}>{children}</section>;
}

export function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[#10A89A] text-white shadow-[0_8px_22px_rgba(16,168,154,0.16)] hover:bg-[#0D978B]",
        variant === "secondary" && "border border-[#D5EBE7] bg-[#F4FBFA] text-[#123F3B] hover:bg-[#E8F6F4]",
        variant === "danger" && "bg-danger text-white hover:bg-red-700",
        variant === "ghost" && "text-[#688B87] hover:bg-[#E8F6F4] hover:text-[#123F3B]",
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
    <label className="grid gap-1.5 text-[11px] font-semibold uppercase text-[#527D78]">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "min-h-10 w-full rounded-lg border border-[#D5EBE7] bg-[#F8FCFB] px-3 py-2 text-sm font-normal text-[#123F3B] outline-none placeholder:text-[#91AAA7] focus:border-[#10A89A] focus:ring-2 focus:ring-[#10A89A]/10";

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
    <div className="rounded-lg border border-dashed border-[#B9DDD7] bg-[#F8FCFB] p-6 text-center">
      <p className="font-semibold text-slate-200">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#DCEFEB]">
      <div className="h-full rounded-full bg-[#10A89A]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
