"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Globe2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { creatorCard, industries } from "@/lib/data";
import { BrandSymbol, CreatorCard } from "@/components/creator-card";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { GoogleAuthModal } from "@/components/auth";

const steps = ["role", "signup", "profile", "details", "pricing", "professional", "preview"] as const;
type Step = (typeof steps)[number];

export function OnboardingFlow({ initialStep = "role" }: { initialStep?: Step }) {
  const [step, setStep] = useState<Step>(initialStep);
  const [selectedRole, setSelectedRole] = useState<"creator" | "brand" | null>(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [country, setCountry] = useState("India");
  const [selectedIndustries, setSelectedIndustries] = useState(["AI", "Software", "Productivity"]);
  const [price, setPrice] = useState(creatorCard.price);
  const [savedProfessional, setSavedProfessional] = useState(false);
  const [googleOpen, setGoogleOpen] = useState(false);
  const [importedProfile, setImportedProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const stepIndex = steps.indexOf(step);
  useEffect(() => {
    const requestedStep = new URLSearchParams(window.location.search).get("step") as Step | null;
    if (requestedStep && steps.includes(requestedStep)) setStep(requestedStep);
  }, []);

  const goTo = (nextStep: Step) => {
    setStep(nextStep);
    const params = new URLSearchParams(window.location.search);
    params.set("step", nextStep);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  };
  const next = () => goTo(steps[Math.min(steps.length - 1, stepIndex + 1)]);
  const previous = () => goTo(steps[Math.max(0, stepIndex - 1)]);
  const toggleIndustry = (name: string) => setSelectedIndustries((current) => current.includes(name) ? current.filter((item) => item !== name) : current.length < 3 ? [...current, name] : current);
  const updateProfileUrl = (value: string) => {
    setProfileUrl(value);
    setImportedProfile(false);
    setProfileError("");
  };
  const importProfile = () => {
    const slug = profileUrl.replace(/\/$/, "").split("/").pop()?.toLowerCase();
    if (["demo-creator", "devesh-rathod", "devesh36"].includes(slug ?? "")) {
      setImportedProfile(true);
      setProfileError("");
    } else {
      setImportedProfile(false);
      setProfileError("Live LinkedIn import is not connected in this demo. Use the seeded demo profile to continue safely.");
    }
  };

  return (
    <main className="relative flex min-h-screen justify-center overflow-hidden bg-white px-5 pb-28 pt-8 text-[var(--ink)] sm:pt-12">
      <div className="absolute inset-x-0 top-0 h-1 bg-[var(--ink)]" />
      <div className="w-full max-w-[452px]">
        <div className="mb-8 flex items-center justify-between"><span className="brand-mark text-[20px]"><BrandSymbol /></span><span className="flex items-center gap-2 text-sm text-[var(--ink)]"><Globe2 size={15} className="text-[var(--muted)]" /> EN</span></div>
        {step !== "role" && step !== "preview" && <button onClick={previous} className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)]"><ArrowLeft size={15} /> {step === "profile" ? "Back to my account" : "Back"}</button>}
        {step !== "role" && step !== "professional" && step !== "preview" && <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--blue)]">STEP {stepIndex} OF 4</p>}
        {step === "role" && <RoleStep selected={selectedRole} onSelect={setSelectedRole} onContinue={next} onDemo={() => window.location.assign("/demo")} onSignIn={() => window.location.assign("/signin")} />}
        {step === "signup" && <SignupStep onContinue={next} onGoogle={() => setGoogleOpen(true)} onSignIn={() => window.location.assign("/signin")} />}
        {step === "profile" && <ProfileStep value={profileUrl} onChange={updateProfileUrl} onUseDemo={() => updateProfileUrl("https://www.linkedin.com/in/demo-creator")} imported={importedProfile} error={profileError} onImport={importProfile} onContinue={next} />}
        {step === "details" && <DetailsStep country={country} setCountry={setCountry} selected={selectedIndustries} toggle={toggleIndustry} onContinue={next} />}
        {step === "pricing" && <PricingStep price={price} setPrice={setPrice} onContinue={next} />}
        {step === "professional" && <ProfessionalStep saved={savedProfessional} setSaved={setSavedProfessional} onContinue={next} />}
        {step === "preview" && <PreviewStep onContinue={() => window.location.assign("/creator#home")} />}
      </div>
      <AssistantBar label={step === "role" ? "What would you like to see?" : "What would you like to do?"} />
      {googleOpen && <GoogleAuthModal mode="signup" onClose={() => setGoogleOpen(false)} onSuccess={() => { setGoogleOpen(false); next(); }} />}
    </main>
  );
}

function RoleStep({ selected, onSelect, onContinue, onDemo, onSignIn }: { selected: string | null; onSelect: (role: "creator" | "brand") => void; onContinue: () => void; onDemo: () => void; onSignIn: () => void }) {
  return <section><h1 className="text-[26px] font-bold tracking-[-.04em]">Create your account</h1><p className="mt-1 text-sm text-[var(--muted)]">First, who are you here as?</p><div className="mt-6 space-y-3"><RoleOption title="I'm a creator" text="Get paid to create LinkedIn content for B2B brands you actually use." selected={selected === "creator"} onClick={() => onSelect("creator")} /><RoleOption title="I'm a brand" text="Find creators, launch campaigns, and trace real pipeline back to each post." selected={selected === "brand"} onClick={() => onSelect("brand")} /></div><p className="mt-6 text-center text-xs text-[var(--muted)]">Already have an account? <button onClick={onSignIn} className="text-[var(--blue)]">Sign in</button></p><PrimaryButton disabled={!selected} onClick={onContinue} className="mt-8 w-full">Continue</PrimaryButton><button onClick={onDemo} className="mt-4 w-full text-center text-sm font-semibold text-[var(--blue)]">Explore the demo workspace</button></section>;
}

function RoleOption({ title, text, selected, onClick }: { title: string; text: string; selected: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`w-full rounded-2xl border p-5 text-left transition ${selected ? "border-[var(--blue)] bg-[var(--blue-soft)]" : "border-[var(--line-strong)] bg-white hover:border-[#9eb4f9]"}`}><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-5 text-[var(--muted)]">{text}</p></button>;
}

function SignupStep({ onContinue, onGoogle, onSignIn }: { onContinue: () => void; onGoogle: () => void; onSignIn: () => void }) {
  return <section><p className="text-xs font-semibold uppercase tracking-wide text-[var(--blue)]">STEP 1 OF 4</p><h1 className="mt-3 text-[26px] font-bold tracking-[-.04em]">Join Naano</h1><p className="mt-3 text-sm text-[var(--muted)]">Get paid to create LinkedIn content for B2B brands you actually use.</p><div className="mt-7 space-y-3"><SecondaryButton onClick={onContinue} className="w-full gap-3"><span className="font-bold text-[#1769ad]">in</span> Sign up with LinkedIn</SecondaryButton><SecondaryButton onClick={onGoogle} className="w-full gap-3"><span className="font-bold text-[#ea4335]">G</span> Sign up with Google</SecondaryButton><SecondaryButton onClick={onContinue} className="w-full gap-3"><Mail size={18} className="text-[var(--muted)]" /> Sign up with email</SecondaryButton></div><p className="mt-5 text-center text-xs text-[var(--muted)]">Already have an account? <button onClick={onSignIn} className="text-[var(--blue)]">Sign in here</button></p></section>;
}

function ProfileStep({ value, onChange, onUseDemo, imported, error, onImport, onContinue }: { value: string; onChange: (value: string) => void; onUseDemo: () => void; imported: boolean; error: string; onImport: () => void; onContinue: () => void }) {
  const valid = /^https?:\/\/(www\.)?linkedin\.com\/in\/[^/]+/.test(value);
  return <section><p className="text-xs font-semibold uppercase tracking-wide text-[var(--blue)]">STEP 2 OF 4</p><h1 className="mt-3 text-[25px] font-bold tracking-[-.04em]">Add your public LinkedIn profile</h1><p className="mt-3 text-sm leading-5 text-[var(--muted)]">No extension is needed. We’ll retrieve only the minimum public information required to create your Basic card.</p><label className="mt-5 block text-xs font-semibold uppercase text-[#5c6470]">Public LinkedIn profile URL<input value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://www.linkedin.com/in/you" aria-invalid={value.length > 0 && !valid} className="mt-2 h-10 w-full rounded-xl border border-[var(--line-strong)] px-3 text-sm outline-none focus:border-[var(--blue)]" /></label><button onClick={onUseDemo} className="mt-2 text-xs font-semibold text-[var(--blue)]">Use the demo LinkedIn profile</button>{error && <p role="alert" className="mt-3 rounded-xl border border-[#f0c9c9] bg-[#fff6f6] p-3 text-xs leading-5 text-[#9f3838]">{error}</p>}{imported ? <ImportedProfilePreview onChange={() => onChange("")} onContinue={onContinue} /> : <><div className="mt-4 flex gap-3 rounded-2xl border border-[#cddcff] bg-[#f4f7ff] p-4 text-xs leading-5 text-[#50617e]"><ShieldCheck size={18} className="shrink-0 text-[var(--blue)]" /><span>Only the seeded demo URL can be imported in this local build. No LinkedIn data is sent anywhere.</span></div><PrimaryButton disabled={!valid} onClick={onImport} className="mt-4 w-full">Import my public profile</PrimaryButton></>}</section>;
}

function ImportedProfilePreview({ onChange, onContinue }: { onChange: () => void; onContinue: () => void }) {
  return <div className="mt-4 rounded-2xl border border-[#bfe4ce] bg-[#f4fcf7] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#13864d]"><Check size={14} className="mr-1 inline" />Profile imported</p><div className="mt-3 flex items-center gap-3"><div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#423365] via-[#7e5b66] to-[#15213c]" /><div><p className="font-semibold">Devesh Rathod</p><p className="text-xs text-[var(--muted)]">1,027 followers · India</p></div></div><p className="mt-3 text-xs leading-5 text-[var(--muted)]">Software Engineer | Building AI Systems | Open Source Dev</p><PrimaryButton onClick={onContinue} className="mt-4 w-full">Use this profile</PrimaryButton><button onClick={onChange} className="mt-3 w-full text-center text-xs font-semibold text-[var(--blue)]">Use a different URL</button></div>;
}

function DetailsStep({ country, setCountry, selected, toggle, onContinue }: { country: string; setCountry: (value: string) => void; selected: string[]; toggle: (name: string) => void; onContinue: () => void }) {
  return <section><p className="text-xs font-semibold uppercase tracking-wide text-[var(--blue)]">STEP 3 OF 4</p><h1 className="mt-3 text-[25px] font-bold tracking-[-.04em]">Complete your creator card</h1><div className="mt-4 flex items-center gap-3"><div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#423365] via-[#7e5b66] to-[#15213c]" /><div><p className="text-lg font-semibold">1,027 <span className="text-sm font-normal text-[var(--muted)]">followers</span></p><p className="text-xs text-[var(--muted)]">Software Engineer | Building AI Systems | Open Source Dev</p></div></div><label className="mt-6 block text-sm font-semibold">Your country<span className="mt-1 block text-xs font-normal text-[var(--muted)]">Confirm your country before continuing.</span><div className="relative mt-2"><select value={country} onChange={(event) => setCountry(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-[var(--line-strong)] bg-white px-3 text-sm"><option>India</option><option>France</option><option>United States</option><option>United Kingdom</option></select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-3" /></div></label><div className="mt-5"><p className="text-sm font-semibold">Your industries <span className="font-normal text-[var(--muted)]">(pick up to 3)</span></p><p className="mt-1 text-xs text-[var(--muted)]">Choose up to 3 industries to help relevant brands find your card.</p><div className="mt-3 flex max-h-36 flex-wrap gap-2 overflow-hidden">{industries.map((name) => <button key={name} onClick={() => toggle(name)} className={`rounded-full border px-3 py-1 text-xs ${selected.includes(name) ? "border-[#a7d9bd] bg-[#effbf4] text-[#13864d]" : "border-[var(--line)] text-[var(--subtle)]"}`}>{selected.includes(name) && <Check size={12} className="mr-1 inline" />}{name}</button>)}</div></div><PrimaryButton onClick={onContinue} className="mt-5 w-full">Continue</PrimaryButton></section>;
}

function PricingStep({ price, setPrice, onContinue }: { price: number; setPrice: (value: number) => void; onContinue: () => void }) {
  return <section><p className="text-xs font-semibold uppercase tracking-wide text-[var(--blue)]">STEP 4 OF 4</p><h1 className="mt-3 text-[25px] font-bold tracking-[-.04em]">Complete your creator card</h1><p className="mt-4 text-center text-xs font-semibold uppercase tracking-[.16em] text-[var(--blue)]">Our recommendation</p><div className="mt-3 rounded-[24px] border border-[var(--line)] bg-white p-5 text-center"><p className="text-sm leading-6 text-[var(--muted)]">Naano recommends this starting price from the public audience and performance information currently available.</p><div className="mt-5 flex items-center justify-center gap-3 rounded-2xl border border-[#dce4f1] bg-[#f8faff] py-5"><span className="text-3xl font-semibold">€</span><input type="number" value={price} onChange={(event) => setPrice(Number(event.target.value))} className="w-32 bg-transparent text-5xl font-bold outline-none" /><span className="text-sm text-[var(--muted)]">/ post</span></div><p className="mt-5 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)]">This is your net price per post. You can change it at any time from your Naano profile.</p></div><PrimaryButton onClick={onContinue} className="mt-4 w-full">Create my marketplace profile</PrimaryButton><SecondaryButton onClick={onContinue} className="mt-3 w-full">Finish later</SecondaryButton></section>;
}

function ProfessionalStep({ saved, setSaved, onContinue }: { saved: boolean; setSaved: (value: boolean) => void; onContinue: () => void }) {
  return <section><p className="text-xs font-semibold uppercase tracking-wide text-[var(--blue)]">OPTIONAL</p><h1 className="mt-3 text-[25px] font-bold tracking-[-.04em]">Complete your professional information now?</h1><p className="mt-3 text-sm leading-5 text-[var(--muted)]">This step is optional now. You can complete it later from your profile, before applying to paid campaigns, accepting bookings, invoicing or withdrawing your earnings.</p><div className="mt-5 rounded-2xl border border-[#cddcff] bg-[#f4f7ff] p-4 text-sm leading-6 text-[#50617e]"><p><b>France and European Union:</b> a registered professional activity is required to invoice companies and withdraw your earnings.</p><p className="mt-2"><b>United States and outside the European Union:</b> a registered business is not mandatory.</p></div>{saved && <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--line)] p-3 text-sm"><span><Check size={16} className="mr-2 inline text-[var(--green)]" />Devesh Rathod</span><SecondaryButton className="min-h-8 px-3 text-xs">Edit</SecondaryButton></div>}<PrimaryButton onClick={() => { setSaved(true); onContinue(); }} className="mt-4 w-full">{saved ? "Save my professional information" : "Complete now"}</PrimaryButton><SecondaryButton onClick={onContinue} className="mt-3 w-full">Finish later</SecondaryButton></section>;
}

function PreviewStep({ onContinue }: { onContinue: () => void }) {
  return <section className="text-center"><h1 className="text-[30px] font-bold tracking-[-.05em]">Here is your Marketplace card</h1><p className="mt-2 text-base leading-6 text-[var(--muted)]">Tap it to flip it over. You will be able to customize it in the profile coming next.</p><div className="mt-6 flex justify-center"><CreatorCard data={creatorCard} /></div><PrimaryButton onClick={onContinue} className="mt-8 w-full">Continue to my profile</PrimaryButton></section>;
}


function AssistantBar({ label }: { label: string }) {
  return <div className="fixed bottom-3 left-1/2 z-20 flex w-[calc(100%-40px)] max-w-[340px] -translate-x-1/2 items-center justify-between rounded-full border border-[#e5e8ed] bg-white/95 p-1.5 pl-4 shadow-[0_8px_28px_rgba(25,36,64,.12)] backdrop-blur"><span className="flex items-center gap-3 text-sm text-[#9aa1aa]"><Sparkles size={18} className="text-[#8d9095]" />{label}</span><span className="grid h-9 w-9 place-items-center rounded-full bg-[#f1f2f4] text-[#9aa1aa]">⌁</span></div>;
}
