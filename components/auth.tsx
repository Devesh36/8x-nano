"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { demoUser } from "@/lib/data";
import { BrandSymbol } from "@/components/creator-card";
import { PrimaryButton, SecondaryButton } from "@/components/ui";

export function GoogleAuthModal({
  mode,
  onClose,
  onSuccess,
}: {
  mode: "signin" | "signup";
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const continueWithDemo = () => {
    setLoading(true);
    window.setTimeout(() => {
      window.localStorage.setItem("naano-demo-session", JSON.stringify(demoUser));
      onSuccess();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#101a2b]/35 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="google-auth-title">
      <div className="relative w-full max-w-[380px] rounded-[24px] border border-[var(--line)] bg-white p-6 shadow-[0_24px_80px_rgba(19,32,58,.24)]">
        <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 text-[var(--muted)] hover:text-[var(--ink)]"><X size={18} /></button>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--blue)] text-white"><BrandSymbol /></div>
        <h2 id="google-auth-title" className="mt-5 text-xl font-bold tracking-[-.03em]">Continue with Google</h2>
        <p className="mt-2 text-sm leading-5 text-[var(--muted)]">Choose the seeded demo account to {mode === "signup" ? "create your creator workspace" : "open the creator workspace"}.</p>
        <button onClick={continueWithDemo} disabled={loading} className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-[var(--line-strong)] p-3 text-left transition hover:border-[var(--blue)] disabled:cursor-wait disabled:opacity-60">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fce8e6] font-bold text-[#ea4335]">G</span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Devesh Rathod</span><span className="block truncate text-xs text-[var(--muted)]">{demoUser.email}</span></span>
          <Check size={16} className="text-[var(--green)]" />
        </button>
        <p className="mt-4 rounded-xl bg-[#f6f8fb] p-3 text-xs leading-5 text-[var(--muted)]">This is a local OAuth demo. It does not contact Google or create a real production session.</p>
        <PrimaryButton onClick={continueWithDemo} disabled={loading} className="mt-5 w-full">{loading ? "Connecting…" : `Continue as Devesh`}</PrimaryButton>
        <SecondaryButton onClick={onClose} className="mt-2 w-full">Cancel</SecondaryButton>
      </div>
    </div>
  );
}

export function SignInPanel() {
  const [googleOpen, setGoogleOpen] = useState(false);

  return (
    <main className="relative flex min-h-screen justify-center overflow-hidden bg-white px-5 pb-20 pt-8 text-[var(--ink)] sm:pt-12">
      <div className="absolute inset-x-0 top-0 h-1 bg-[var(--ink)]" />
      <div className="w-full max-w-[452px]">
        <div className="mb-14 flex items-center justify-between"><span className="brand-mark text-[20px]"><BrandSymbol /></span><a href="/" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">Back</a></div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--blue)]">WELCOME BACK</p>
        <h1 className="mt-3 text-[28px] font-bold tracking-[-.045em]">Sign in to Naano</h1>
        <p className="mt-3 text-sm leading-5 text-[var(--muted)]">Open your creator workspace and keep exploring the opportunities waiting for you.</p>
        <div className="mt-7 space-y-3">
          <SecondaryButton onClick={() => setGoogleOpen(true)} className="w-full gap-3"><span className="font-bold text-[#ea4335]">G</span> Continue with Google</SecondaryButton>
          <SecondaryButton onClick={() => window.location.assign("/demo")} className="w-full">Open demo workspace</SecondaryButton>
        </div>
        <p className="mt-6 rounded-2xl border border-[#cddcff] bg-[#f4f7ff] p-4 text-xs leading-5 text-[#50617e]">For this assignment, sign-in is a client-side demo flow. Use the Google option to continue as the seeded demo creator.</p>
      </div>
      {googleOpen && <GoogleAuthModal mode="signin" onClose={() => setGoogleOpen(false)} onSuccess={() => window.location.assign("/creator?demo=1#home")} />}
    </main>
  );
}
