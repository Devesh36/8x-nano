import type { CreatorCardData, NavSection } from "./types";

export const creatorCard: CreatorCardData = {
  name: "Devesh Rathod",
  followers: 1027,
  headline: "Software Engineer | Building AI Systems | Open Source Dev",
  country: "India",
  industries: ["AI", "Productivity", "Software"],
  avatarTone: "from-[#423365] via-[#7e5b66] to-[#15213c]",
  price: 300,
  share: 25,
  rewardPeriod: "3 months",
};

export const demoUser = {
  id: "demo-creator",
  email: "demo@naano.local",
  role: "creator" as const,
  profile: creatorCard,
};

export const navItems: { id: NavSection; label: string; icon: string }[] = [
  { id: "home", label: "Overview", icon: "grid" },
  { id: "profile", label: "My card", icon: "card" },
  { id: "opportunities", label: "Opportunities", icon: "store" },
  { id: "collabs", label: "Collaborations", icon: "layers" },
  { id: "analytics", label: "Analytics", icon: "chart" },
  { id: "community", label: "Community", icon: "users" },
  { id: "earnings", label: "Earnings", icon: "wallet" },
  { id: "referrals", label: "Affiliate program", icon: "percent" },
  { id: "messages", label: "Messages", icon: "message" },
];

export const industries = [
  "B2B", "B2C", "AI", "SaaS", "Software", "Sales", "Marketing", "SEO", "Outreach",
  "CRM", "Creative", "Productivity", "Fintech", "HealthTech", "EdTech", "Cybersecurity",
  "Growth / GTM", "HR", "E-commerce", "Developer Tools", "Data / Analytics", "Customer Support",
  "Design", "Real Estate / PropTech", "LegalTech",
];

export const opportunities = [
  { name: "Premium Inboxes", match: "100% match", region: "Europe · North America", deadline: "6 days", logo: "PI" },
  { name: "OrbiSearch", match: "100% match", region: "Europe · North America", deadline: "6 days", logo: "o" },
];
