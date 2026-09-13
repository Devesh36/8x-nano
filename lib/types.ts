export type CreatorProfile = {
  name: string;
  followers: number;
  headline: string;
  country: string;
  industries: string[];
  avatarTone: string;
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
