"use client";

import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";

export function AccountMenu({ name, email, picture, demo = false }: { name?: string; email?: string; picture?: string; demo?: boolean }) {
  const [open, setOpen] = useState(false);
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.localStorage.removeItem("naano-demo-session");
      window.location.assign("/");
    }
  };

  return <div className="relative"><button onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="menu" className="flex items-center gap-2 rounded-xl p-1 hover:bg-[#f5f7fa]"><span style={picture ? { backgroundImage: `url(${picture})` } : undefined} className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-[#423365] via-[#7e5b66] to-[#15213c] bg-cover bg-center text-xs font-semibold text-white shadow-sm">{!picture && (name?.[0] || "D")}</span><ChevronDown size={13} className="hidden text-[var(--muted)] sm:block" /></button>{open && <div role="menu" className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-[var(--line)] bg-white p-2 shadow-xl"><div className="border-b border-[var(--line)] px-3 py-2"><p className="truncate text-sm font-semibold">{name || "Devesh"}</p><p className="truncate text-xs text-[var(--muted)]">{email || (demo ? "Demo workspace" : "Naano account")}</p></div><button role="menuitem" onClick={logout} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#b33145] hover:bg-[#fff4f5]"><LogOut size={16} /> Log out</button></div>}</div>;
}
