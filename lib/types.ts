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
