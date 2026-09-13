"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Search, Send } from "lucide-react";
import type { MessageThread, WorkspaceMessage } from "@/lib/types";
import { PrimaryButton, Surface } from "@/components/ui";

const demoThread: MessageThread = {
  id: "demo-support",
  type: "support",
  title: "Naano support",
  subtitle: "Product help and account questions",
  updatedAt: "Now",
  messages: [{ id: "demo-welcome", senderId: "naano-support", senderName: "Naano support", body: "Hi, I’m the Naano assistant. Ask a question here and our team can step in when needed.", sentAt: "Now" }],
};

function demoReply(message: string): WorkspaceMessage {
  return { id: `demo-reply-${Date.now()}`, senderId: "naano-support", senderName: "Naano support", body: `Thanks — we received “${message}”. This demo keeps your message in this browser.`, sentAt: "Now" };
}

export function WorkspaceMessages({ variant, demo = false }: { variant: "creator" | "brand"; demo?: boolean }) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const filtered = useMemo(() => threads.filter((thread) => `${thread.title} ${thread.subtitle}`.toLowerCase().includes(query.toLowerCase())), [threads, query]);
  const selected = threads.find((thread) => thread.id === selectedId) || filtered[0] || threads[0];

  useEffect(() => {
    if (demo) {
      const saved = window.localStorage.getItem("naano-demo-message-threads");
      const next = saved ? JSON.parse(saved) as MessageThread[] : [demoThread];
      setThreads(next);
      setSelectedId(next[0]?.id || "");
      return;
    }
    fetch("/api/messages", { cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error("Messages are unavailable"); return response.json() as Promise<{ threads: MessageThread[] }>; })
      .then((data) => { setThreads(data.threads); setSelectedId(data.threads[0]?.id || ""); })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Messages are unavailable"));
  }, [demo]);

  const send = async () => {
    if (!selected || !draft.trim() || sending) return;
    const body = draft.trim();
    setSending(true);
    setError("");
    try {
      if (demo) {
        const outgoing: WorkspaceMessage = { id: `demo-message-${Date.now()}`, senderId: "demo-user", senderName: "Demo creator", body, sentAt: "Now" };
        const next = threads.map((thread) => thread.id === selected.id ? { ...thread, messages: [...thread.messages, outgoing, demoReply(body)], updatedAt: "Now" } : thread);
        window.localStorage.setItem("naano-demo-message-threads", JSON.stringify(next));
        setThreads(next);
      } else {
        const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threadId: selected.id, body }) });
        const data = await response.json() as { threads?: MessageThread[]; error?: string };
        if (!response.ok || !data.threads) throw new Error(data.error || "Message could not be sent");
        setThreads(data.threads);
      }
      setDraft("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Message could not be sent");
    } finally {
      setSending(false);
    }
  };

  const isBrand = variant === "brand";
  return <><div className={`grid overflow-hidden rounded-2xl border border-[var(--line)] bg-white ${isBrand ? "min-h-[660px] lg:grid-cols-[300px_1fr]" : "min-h-[600px] lg:grid-cols-[240px_1fr]"}`}><aside className="border-b border-[var(--line)] p-4 lg:border-b-0 lg:border-r"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Messages</h2><MessageCircle size={18} className="text-[var(--muted)]" /></div><label className="mt-4 flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] px-3"><Search size={14} className="text-[var(--subtle)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" className="w-full bg-transparent text-xs outline-none" /></label><div className="mt-4 space-y-2">{filtered.map((thread) => <button key={thread.id} onClick={() => setSelectedId(thread.id)} className={`w-full rounded-xl p-3 text-left transition ${selected?.id === thread.id ? "bg-[var(--blue-soft)]" : "hover:bg-[#f7f9fc]"}`}><span className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-bold ${thread.type === "support" ? "bg-[#172033] text-white" : "bg-[#e7efff] text-[var(--blue)]"}`}>{thread.type === "support" ? "N" : "↔"}</span><span className="min-w-0 flex-1"><b className="block truncate text-xs">{thread.title}</b><span className="mt-1 block truncate text-[10px] text-[var(--muted)]">{thread.messages.at(-1)?.body || thread.subtitle}</span></span></span></button>)}{!filtered.length && <p className="p-4 text-center text-xs text-[var(--muted)]">No conversations match that search.</p>}</div></aside><section className="flex min-w-0 flex-col"><div className="border-b border-[var(--line)] p-5"><h2 className="font-semibold">{selected?.title || "Messages"}</h2><p className="mt-1 text-xs text-[var(--muted)]">{selected?.subtitle || "Loading your conversations…"}</p></div><div className="flex-1 p-5 sm:p-6">{selected ? <div className="mx-auto max-w-[650px] space-y-3">{selected.type === "support" && <Surface className="sky-panel mb-6 p-4"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--muted)]">Your Naano space</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Ask a product or account question. Your message is saved and the Naano team can follow up in this thread.</p></Surface>}{selected.messages.map((message) => { const fromNaano = message.senderId === "naano-support"; return <div key={message.id} className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${fromNaano ? "bg-[#f0f3f7] text-[var(--ink)]" : "ml-auto bg-[var(--blue)] text-white"}`}><p className={`mb-1 text-[10px] font-semibold ${fromNaano ? "text-[var(--muted)]" : "text-white/75"}`}>{message.senderName} · {message.sentAt}</p><p className="leading-5">{message.body}</p></div>; })}</div> : <div className="grid h-full min-h-[240px] place-items-center text-center text-sm text-[var(--muted)]">Open a conversation to see messages.</div>}</div>{error && <p role="alert" className="mx-4 mb-2 rounded-lg bg-[#fff4f5] px-3 py-2 text-xs text-[#b33145]">{error}</p>}<div className="flex gap-3 border-t border-[var(--line)] p-4"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={selected?.type === "support" ? "Ask Naano a question..." : "Write a message..."} disabled={!selected || sending} className="min-w-0 flex-1 rounded-xl border border-[var(--line-strong)] px-4 text-sm outline-none disabled:bg-[#f7f8fa]" /><PrimaryButton onClick={() => void send()} disabled={!draft.trim() || !selected || sending} aria-label="Send message"><Send size={16} /></PrimaryButton></div></section></div></>;
}
