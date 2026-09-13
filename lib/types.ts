export type CreatorProfile = {
  name: string;
  followers: number;
  headline: string;
  country: string;
  industries: string[];
  avatarTone: string;
  avatarUrl?: string;
};

export type LinkedInImportedProfile = {
  provider: "linkedin";
  id: string;
  name: string;
  email?: string;
  picture?: string;
  sourceUrl: string;
  importedAt: number;
  exp: number;
};

export type CreatorCardData = CreatorProfile & {
  price: number;
  share: number;
  rewardPeriod: string;
};

export type CreatorOpportunity = {
  id: string;
  name: string;
  brandName: string;
  description: string;
  match: string;
  region: string;
  deadline: string;
  logo: string;
  industry: string;
  compensation: number;
  channel: "LinkedIn";
};

export type CreatorCollaboration = {
  id: string;
  opportunityId: string;
  brandName: string;
  campaignName: string;
  status: "Applications sent" | "Active" | "Needs action" | "Declined" | "Completed";
  performance: string;
  nextAction: string;
  net: number;
  deadline: string;
  appliedAt: string;
  logo: string;
};

export type NavSection =
  | "home"
  | "profile"
  | "opportunities"
  | "collabs"
  | "analytics"
  | "community"
  | "earnings"
  | "referrals"
  | "messages";

export type BrandNavSection = "overview" | "marketplace" | "campaigns" | "collaborations" | "results" | "messages" | "billing";

export type BrandCreator = {
  name: string;
  role: string;
  industries: string;
  followers: string;
  price: number;
  fit: number;
  initials: string;
  tone: string;
  avatarUrl?: string;
};

export type BrandCampaign = {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Draft" | "Completed";
  creators: number;
  published: number;
  budget: number;
  created: string;
};
