"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { BrandSymbol } from "@/components/creator-card";
import { SecondaryButton } from "@/components/ui";

export function GoogleButton({ mode = "signin", role }: { mode?: "signin" | "signup"; role?: "creator" | "brand" }) {
  const params = new URLSearchParams({ mode });
  if (role) params.set("role", role);
  return <SecondaryButton onClick={() => window.location.assign(`/api/auth/google?${params.toString()}`)} className="w-full gap-3"><span className="font-bold text-[#ea4335]">G</span> {mode === "signup" ? "Sign up with Google" : "Continue with Google"}</SecondaryButton>;
}

export function SignInPanel() {
  const [error, setError] = useState("");
  const [role, setRole] = useState<"creator" | "brand">("creator");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setError(params.get("error") || "");
    if (params.get("role") === "brand") setRole("brand");
  }, []);

  return (
    <main className="relative flex min-h-screen justify-center overflow-hidden bg-white px-5 pb-20 pt-8 text-[var(--ink)] sm:pt-12">
      <div className="absolute inset-x-0 top-0 h-1 bg-[var(--ink)]" />
      <div className="w-full max-w-[452px]">
        <div className="mb-14 flex items-center justify-between"><span className="brand-mark text-[20px]"><BrandSymbol /></span><a href="/" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">Back</a></div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--blue)]">WELCOME BACK</p>
        <h1 className="mt-3 text-[28px] font-bold tracking-[-.045em]">Sign in to Naano</h1>
        <p className="mt-3 text-sm leading-5 text-[var(--muted)]">Use your Google account to open your {role} workspace.</p>
        {error && <p role="alert" className="mt-5 flex gap-2 rounded-xl border border-[#f0c9c9] bg-[#fff6f6] p-3 text-xs leading-5 text-[#9f3838]"><AlertCircle size={16} className="shrink-0" />{error}</p>}
        <div className="mt-7 space-y-3">
          <GoogleButton role={role} />
          <SecondaryButton onClick={() => window.location.assign("/demo")} className="w-full">Open demo workspace</SecondaryButton>
        </div>
        <p className="mt-6 rounded-2xl border border-[#cddcff] bg-[#f4f7ff] p-4 text-xs leading-5 text-[#50617e]">Google will ask you to authorize your name, email and profile photo. Naano uses those details to create your local workspace session.</p>
      </div>
    </main>
  );
}
