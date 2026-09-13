import type { ReactNode } from "react";

export function Surface({ children, className = "", ...props }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-[var(--line)] bg-white/95 shadow-[var(--shadow-sm)] ${className}`} {...props}>{children}</div>;
}

export function PrimaryButton({ children, className = "", ...props }: { children: ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--blue)] px-5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(45,93,242,.18)] transition duration-200 hover:-translate-y-px hover:bg-[var(--blue-dark)] hover:shadow-[0_11px_22px_rgba(45,93,242,.25)] active:translate-y-0 active:scale-[.99] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>{children}</button>;
}

export function SecondaryButton({ children, className = "", ...props }: { children: ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--line-strong)] bg-white px-5 text-sm font-semibold text-[var(--ink)] shadow-[0_1px_1px_rgba(20,37,66,.03)] transition duration-200 hover:-translate-y-px hover:border-[#aebee0] hover:bg-[#f8faff] hover:shadow-sm active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>{children}</button>;
}

export function StatusPill({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "gray" }) {
  const styles = {
    blue: "border-[#cbd8ff] bg-[#f3f6ff] text-[var(--blue)]",
    green: "border-[#bde7d0] bg-[#ecfaf2] text-[#13864d]",
    gray: "border-[var(--line)] bg-[#fafbfc] text-[var(--muted)]",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold shadow-[0_1px_1px_rgba(20,37,66,.02)] ${styles[tone]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{children}</span>;
}
