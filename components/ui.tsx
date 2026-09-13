import type { ReactNode } from "react";

export function Surface({ children, className = "", ...props }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-[var(--line)] bg-white ${className}`} {...props}>{children}</div>;
}

export function PrimaryButton({ children, className = "", ...props }: { children: ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--blue)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--blue-dark)] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>{children}</button>;
}

export function SecondaryButton({ children, className = "", ...props }: { children: ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-white px-5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[#f8faff] ${className}`} {...props}>{children}</button>;
}

export function StatusPill({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "gray" }) {
  const styles = {
    blue: "border-[#cbd8ff] bg-[#f3f6ff] text-[var(--blue)]",
    green: "border-[#bde7d0] bg-[#ecfaf2] text-[#13864d]",
    gray: "border-[var(--line)] bg-[#fafbfc] text-[var(--muted)]",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${styles[tone]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{children}</span>;
}
