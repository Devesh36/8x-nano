"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleDollarSign, Landmark, LoaderCircle, WalletCards } from "lucide-react";
import type { CreatorEarnings } from "@/lib/types";
import { PrimaryButton, StatusPill, Surface } from "@/components/ui";

const emptyEarnings: CreatorEarnings = {
  totalEarned: 0,
  inTransit: 0,
  available: 0,
  payoutMethod: "stripe",
  stripeConnected: false,
  withdrawals: [],
};

const euro = (value: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export function CreatorEarnings({ demo = false }: { demo?: boolean }) {
  const [earnings, setEarnings] = useState<CreatorEarnings>(emptyEarnings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"connect" | "withdraw" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (demo) {
      const stored = window.localStorage.getItem("naano-demo-creator-earnings");
      if (stored) {
        try { setEarnings(JSON.parse(stored) as CreatorEarnings); } catch { window.localStorage.removeItem("naano-demo-creator-earnings"); }
      }
      setLoading(false);
      return;
    }
    fetch("/api/creator/payouts", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { earnings?: CreatorEarnings; error?: string };
        if (!response.ok || !data.earnings) throw new Error(data.error || "Could not load earnings");
        setEarnings(data.earnings);
      })
      .catch((error) => setNotice(error instanceof Error ? error.message : "Could not load earnings"))
      .finally(() => setLoading(false));
  }, [demo]);

  const saveDemo = (next: CreatorEarnings) => {
    window.localStorage.setItem("naano-demo-creator-earnings", JSON.stringify(next));
    setEarnings(next);
  };

  const act = async (action: "connect" | "withdraw") => {
    setSaving(action);
    setNotice(null);
    try {
      if (demo) {
        if (action === "connect") {
          saveDemo({ ...earnings, payoutMethod: "stripe", stripeConnected: true });
          setNotice("Stripe is connected for this demo workspace.");
        } else if (earnings.available <= 0) {
          throw new Error("There are no cleared earnings available to withdraw yet");
        }
        return;
      }
      const response = await fetch("/api/creator/payouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: action === "connect" ? "connect_stripe" : "withdraw" }) });
      const data = await response.json() as { earnings?: CreatorEarnings; error?: string };
      if (!response.ok || !data.earnings) throw new Error(data.error || "Payout action could not be completed");
      setEarnings(data.earnings);
      setNotice(action === "connect" ? "Stripe is connected. You can request a payout when earnings clear." : "Withdrawal request submitted. It is now in transit.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Payout action could not be completed");
    } finally {
      setSaving(null);
    }
  };

  return <>
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--muted)]">Creator workspace</p><h1 className="mt-2 text-[30px] font-bold tracking-[-.055em] sm:text-[34px]">Earnings</h1><p className="mt-1 text-sm text-[var(--muted)]">Track revenue from paid collaborations and withdraw cleared funds.</p></div><StatusPill>Paid collaborations</StatusPill></div>
    <div className="grid gap-3 xl:grid-cols-3">
      <EarningsStat label="Total earned" value={euro(earnings.totalEarned)} detail={`${earnings.totalEarned ? "Completed collaboration earnings" : "No paid collaborations yet"}`} />
      <EarningsStat label="In transit" value={euro(earnings.inTransit)} detail="Withdrawal requests are processed within 1–7 days" />
      <EarningsStat label="Available now" value={euro(earnings.available)} detail="Cleared earnings ready for your selected payout method" />
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Surface className="p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Earnings over time</h2><span className="text-xs font-semibold text-[var(--blue)]">{euro(earnings.totalEarned)} total</span></div>
        <div className="mt-8 flex h-36 items-end gap-2">{["Apr", "May", "Jun", "Jul", "Aug", "Sept"].map((month, index) => <div key={month} className={`flex flex-1 flex-col justify-end rounded-t-lg border-b-4 border-[var(--blue)] bg-[#f1f4f9] ${index === 5 ? "bg-[#e9efff]" : ""}`}><span className="mb-2 text-center text-[9px] text-[var(--muted)]">{index === 5 ? euro(earnings.totalEarned) : "€0"}</span><span className="mt-auto text-center text-[9px] text-[var(--muted)]">{month}</span></div>)}</div>
        <div className="mt-8 border-t border-[var(--line)] pt-4"><h3 className="text-sm font-semibold">Withdrawal history</h3>{earnings.withdrawals.length ? <div className="mt-3 space-y-2">{earnings.withdrawals.map((withdrawal) => <div key={withdrawal.id} className="flex items-center justify-between rounded-xl bg-[#f7f9fc] px-3 py-2 text-xs"><span><b>{euro(withdrawal.amount)}</b> · Stripe · {withdrawal.requestedAt}</span><StatusPill tone={withdrawal.status === "Paid" ? "green" : "blue"}>{withdrawal.status}</StatusPill></div>)}</div> : <p className="mt-3 text-xs text-[var(--muted)]">Your completed collaboration payouts will appear here.</p>}</div>
      </Surface>
      <Surface className="p-5">
        <h2 className="font-semibold">Withdraw earnings</h2>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Payout method</p>
        <div className="mt-2 rounded-xl border border-[var(--line)] p-3 text-sm"><span className="flex items-center gap-2"><Landmark size={16} /> Bank transfer</span><p className="mt-1 text-xs text-[var(--muted)]">No bank account is configured yet.</p></div>
        <div className={`mt-2 rounded-xl border p-3 text-sm ${earnings.payoutMethod === "stripe" ? "border-[var(--blue)] bg-[var(--blue-soft)]" : "border-[var(--line)]"}`}><span className="flex items-center gap-2"><CircleDollarSign size={16} /> Stripe</span><p className="mt-1 text-xs text-[var(--muted)]">{earnings.stripeConnected ? "Connected and ready to receive cleared earnings." : "Connect your Stripe payout account to receive earnings."}</p>{!earnings.stripeConnected && <PrimaryButton onClick={() => act("connect")} disabled={saving !== null || loading} className="mt-3 min-h-9 px-3 text-xs">{saving === "connect" ? <><LoaderCircle className="animate-spin" size={14} /> Connecting</> : "Connect Stripe"}</PrimaryButton>}{earnings.stripeConnected && <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#159358]"><CheckCircle2 size={14} /> Connected</span>}</div>
        <PrimaryButton onClick={() => act("withdraw")} disabled={loading || saving !== null || !earnings.stripeConnected || earnings.available <= 0} className="mt-3 w-full">{saving === "withdraw" ? <><LoaderCircle className="animate-spin" size={15} /> Requesting withdrawal</> : <><WalletCards size={15} /> Withdraw {euro(earnings.available)}</>}</PrimaryButton>
        <p className="mt-2 text-center text-[10px] text-[var(--muted)]">{earnings.available > 0 ? "A request moves the full cleared balance to Stripe." : "Complete a paid collaboration before withdrawing funds."}</p>
        {notice && <p role="status" className="mt-3 rounded-xl border border-[#cddcff] bg-[#f3f6ff] p-3 text-xs leading-5 text-[#3556aa]">{notice}</p>}
      </Surface>
    </div>
  </>;
}

function EarningsStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Surface className="p-5"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--muted)]">{label}</p><p className="mt-4 text-3xl font-bold tracking-[-.055em]">{value}</p><p className="mt-2 text-xs text-[var(--muted)]">{detail}</p></Surface>;
}
