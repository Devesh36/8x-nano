import type { BrandCampaign, BrandCreator, CreatorCardData, NavSection } from "./types";

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
  { name: "Premium Inboxes", match: "100% match", region: "Europe · North America", deadline: "6 days", logo: "PI", industry: "Productivity" },
  { name: "OrbiSearch", match: "100% match", region: "Europe · North America", deadline: "6 days", logo: "o", industry: "Software" },
];

export const brandCreators: BrandCreator[] = [
  { name: "Dr Bart Jaworski", role: "AI · Software · SaaS", industries: "AI · Software · SaaS", followers: "12.4K", price: 625, fit: 90, initials: "BJ", tone: "from-[#bde4f4] to-[#eaf7ff]" },
  { name: "Josue Valles", role: "B2B · Marketing · Creative", industries: "B2B · Marketing · Creative", followers: "8.7K", price: 788, fit: 90, initials: "JV", tone: "from-[#c9cdf6] to-[#eef0ff]" },
  { name: "Luis Rodrigues", role: "AI · Software · Sales", industries: "AI · Software · Sales", followers: "24.1K", price: 1875, fit: 90, initials: "LR", tone: "from-[#cce9d6] to-[#f0fff4]" },
  { name: "Sandhya Mishra", role: "AI · Marketing · SaaS", industries: "AI · Marketing · SaaS", followers: "6.2K", price: 625, fit: 90, initials: "SM", tone: "from-[#bde4f4] to-[#eaf7ff]" },
  { name: "Charlie Lass", role: "E-commerce · AI · Software", industries: "E-commerce · AI · Software", followers: "18.8K", price: 2500, fit: 90, initials: "CL", tone: "from-[#c9cdf6] to-[#eef0ff]" },
  { name: "Petronella James", role: "HR · Leadership · B2B", industries: "HR · Leadership · B2B", followers: "4.8K", price: 490, fit: 88, initials: "PJ", tone: "from-[#cce9d6] to-[#f0fff4]" },
];

export const brandCampaigns: BrandCampaign[] = [
  { id: "devops-brief", name: "Devesh creator brief", description: "A creator campaign for DevOps teams looking for practical systems content and trusted technical voices.", status: "Active", creators: 0, published: 0, budget: 0, created: "13 Sept 2026" },
];
