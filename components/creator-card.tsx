import { CalendarDays, Linkedin, Share2 } from "lucide-react";
import { creatorCard } from "@/lib/data";
import type { CreatorCardData } from "@/lib/types";

export function CreatorCard({ data = creatorCard, compact = false }: { data?: CreatorCardData; compact?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-[28px] border border-[#dce3ef] bg-white text-center shadow-[0_18px_45px_rgba(31,48,87,.12)] ${compact ? "w-[390px] max-w-full" : "w-full max-w-[408px]"}`}>
      <div className="relative h-[122px] overflow-hidden bg-gradient-to-br from-[#244fe0] via-[#3268f7] to-[#7391ff] px-5 pt-5 text-white">
        <div className="absolute -left-10 bottom-[-55px] h-36 w-36 rounded-full border border-white/15" />
        <div className="absolute right-[-24px] top-[-52px] h-44 w-44 rounded-full border border-white/15" />
        <div className="relative flex items-start justify-between">
          <span className="grid h-10 w-10 place-items-center rounded-xl border-4 border-white/70 bg-white/90 text-[#1769ad] shadow-sm"><Linkedin size={20} fill="currentColor" /></span>
          <span className="brand-mark text-[22px] text-white"><BrandSymbol /> naano</span>
          <div className="flex gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl border-4 border-white/70 bg-white/90 text-lg">🇮🇳</span><span className="grid h-10 w-10 place-items-center rounded-xl border-4 border-white/70 bg-white/90 text-[var(--blue)]"><Share2 size={17} /></span></div>
        </div>
      </div>
      <div className="relative px-5 pb-5 pt-12">
        <div className={`absolute left-1/2 top-[-32px] h-16 w-16 -translate-x-1/2 rounded-full border-2 border-[var(--blue)] bg-gradient-to-br ${data.avatarTone} p-1`}><div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_62%_27%,#d5a47b_0_10%,transparent_11%),linear-gradient(135deg,#263f78,#1d2138_60%,#92645d)]" /></div>
        <h3 className="text-[22px] font-bold tracking-[-.04em]">{data.name}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{data.industries.join(" · ")}</p>
        <p className="mx-auto mt-4 max-w-[300px] text-[13px] leading-5 text-[var(--muted)]">{data.headline}</p>
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[var(--subtle)]"><span>Data</span><div className="h-1.5 w-36 rounded-full bg-[#e6eaf1]" /><span>Pending</span></div>
        <div className="mt-4 flex items-center justify-center gap-2 rounded-full border border-[#e1e7f1] bg-[#fafcff] px-3 py-1 text-[10px] text-[var(--muted)]"><CalendarDays size={12} className="text-[var(--blue)]" /> No post data available</div>
      </div>
      <div className="grid grid-cols-3 border-t border-[var(--line)]">
        <CardMetric value={`${Math.round(data.followers / 1000)}K`} label="Followers" />
        <CardMetric value="—" label="Est. impressions" />
        <CardMetric value={`€${data.price}`} label="Chosen cost" />
      </div>
    </div>
  );
}

function CardMetric({ value, label }: { value: string; label: string }) {
  return <div className="px-2 py-4"><p className="text-xl font-bold tracking-[-.04em]">{value}</p><p className="mt-1 text-[10px] text-[var(--subtle)]">{label}</p></div>;
}

export function BrandSymbol() {
  return <svg width="25" height="24" viewBox="0 0 25 24" fill="none" aria-hidden="true"><path d="M2 6.5c0-1.1.9-2 2-2h7.2c2.7 0 5.2 1.2 6.9 3.3l1.6 2H13l-2.1-2.5H5.5C3.6 7.3 2 8.7 2 10.5v-4Z" fill="currentColor"/><path d="M23 17.5c0 1.1-.9 2-2 2h-7.2c-2.7 0-5.2-1.2-6.9-3.3l-1.6-2H12l2.1 2.5h5.4c1.9 0 3.5-1.4 3.5-3.2v4Z" fill="currentColor"/><circle cx="22.5" cy="20.5" r="2" fill="#315EF5"/></svg>;
}
