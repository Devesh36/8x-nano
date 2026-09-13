import type { BrandCampaign, BrandCreator, CreatorCardData } from "@/lib/types";
import { creatorCard } from "@/lib/data";
import { getDatabase } from "@/lib/db";
import type { GoogleSession } from "@/lib/auth";

export type WorkspaceRole = "creator" | "brand";

type DbUser = {
  _id: string;
  provider: "google";
  providerId: string;
  email: string;
  name: string;
  picture?: string;
  roles: WorkspaceRole[];
  createdAt: Date;
  updatedAt: Date;
};

type DbWorkspace = {
  _id: string;
  userId: string;
  role: WorkspaceRole;
  creatorProfile?: CreatorCardData;
  linkedinUrl?: string;
  onboardingComplete?: boolean;
  brand?: {
    walletBalance: number;
    metrics: { creatorsActivated: number; postsPublished: number; profilesEngaged: number; impressions: number };
    campaigns: BrandCampaign[];
    todoState: string[];
  };
  createdAt: Date;
  updatedAt: Date;
};

type BrandWorkspaceData = NonNullable<DbWorkspace["brand"]>;

export type WorkspaceSnapshot = {
  persisted: true;
  user: { id: string; name: string; email: string; picture?: string; role: WorkspaceRole };
  role: WorkspaceRole;
  creator?: { profile: CreatorCardData; linkedinUrl?: string; onboardingComplete: boolean };
  brand?: {
    walletBalance: number;
    metrics: BrandWorkspaceData["metrics"];
    campaigns: BrandCampaign[];
    creators: BrandCreator[];
  };
};

const workspaceId = (userId: string, role: WorkspaceRole) => `${userId}:${role}`;

function profileForSession(session: GoogleSession): CreatorCardData {
  return { ...creatorCard, name: session.name, avatarUrl: session.picture };
}

function creatorToBrandCreator(profile: CreatorCardData): BrandCreator {
  const initials = profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const followers = profile.followers >= 1000 ? `${Math.round(profile.followers / 100) / 10}K` : `${profile.followers}`;
  return { name: profile.name, role: profile.industries.join(" · "), industries: profile.industries.join(" · "), followers, price: profile.price, fit: 90, initials, tone: profile.avatarTone, avatarUrl: profile.avatarUrl };
}

export async function ensureAccount(session: GoogleSession) {
  const db = await getDatabase();
  const now = new Date();
  const userId = `google:${session.sub}`;
  const users = db.collection<DbUser>("users");
  await users.updateOne(
    { _id: userId },
    { $set: { provider: "google", providerId: session.sub, email: session.email, name: session.name, picture: session.picture, updatedAt: now }, $setOnInsert: { createdAt: now }, $addToSet: { roles: session.role } },
    { upsert: true },
  );

  const workspaces = db.collection<DbWorkspace>("workspaces");
  const insertFields: Partial<DbWorkspace> = session.role === "brand"
    ? { brand: { walletBalance: 0, metrics: { creatorsActivated: 0, postsPublished: 0, profilesEngaged: 0, impressions: 0 }, campaigns: [], todoState: [] } }
    : { creatorProfile: profileForSession(session) };
  await workspaces.updateOne(
    { _id: workspaceId(userId, session.role) },
    { $set: { userId, role: session.role, updatedAt: now }, $setOnInsert: { ...insertFields, createdAt: now } },
    { upsert: true },
  );
  return { db, userId };
}

export async function saveImportedCreatorProfile(session: GoogleSession, profile: { name: string; picture?: string; sourceUrl: string }) {
  const { db, userId } = await ensureAccount({ ...session, role: "creator" });
  await db.collection<DbWorkspace>("workspaces").updateOne(
    { _id: workspaceId(userId, "creator") },
    { $set: { "creatorProfile.name": profile.name, "creatorProfile.avatarUrl": profile.picture, linkedinUrl: profile.sourceUrl, onboardingComplete: true, updatedAt: new Date() } },
  );
}

export async function hasCompletedCreatorWorkspace(session: GoogleSession) {
  const db = await getDatabase();
  const workspace = await db.collection<DbWorkspace>("workspaces").findOne({ _id: workspaceId(`google:${session.sub}`, "creator") }, { projection: { linkedinUrl: 1, onboardingComplete: 1 } });
  return Boolean(workspace?.onboardingComplete || workspace?.linkedinUrl);
}

export async function getWorkspaceSnapshot(session: GoogleSession, role: WorkspaceRole): Promise<WorkspaceSnapshot> {
  const { db, userId } = await ensureAccount({ ...session, role });
  const user = await db.collection<DbUser>("users").findOne({ _id: userId });
  const workspace = await db.collection<DbWorkspace>("workspaces").findOne({ _id: workspaceId(userId, role) });
  if (!user || !workspace) throw new Error("Workspace could not be loaded");

  const result: WorkspaceSnapshot = { persisted: true, user: { id: userId, name: user.name, email: user.email, picture: user.picture, role }, role };
  if (role === "creator") {
    result.creator = { profile: workspace.creatorProfile || profileForSession(session), linkedinUrl: workspace.linkedinUrl, onboardingComplete: Boolean(workspace.onboardingComplete || workspace.linkedinUrl) };
    return result;
  }

  const creatorWorkspaces = await db.collection<DbWorkspace>("workspaces").find({ role: "creator", creatorProfile: { $exists: true } }).toArray();
  result.brand = {
    walletBalance: workspace.brand?.walletBalance || 0,
    metrics: workspace.brand?.metrics || { creatorsActivated: 0, postsPublished: 0, profilesEngaged: 0, impressions: 0 },
    campaigns: workspace.brand?.campaigns || [],
    creators: creatorWorkspaces.flatMap((item) => item.creatorProfile ? [creatorToBrandCreator(item.creatorProfile)] : []),
  };
  return result;
}

export async function createBrandCampaign(session: GoogleSession, input: Pick<BrandCampaign, "name" | "description">) {
  const { db, userId } = await ensureAccount({ ...session, role: "brand" });
  const campaign: BrandCampaign = { id: `campaign-${Date.now()}`, name: input.name, description: input.description, status: "Draft", creators: 0, published: 0, budget: 0, created: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()) };
  await db.collection<DbWorkspace>("workspaces").updateOne({ _id: workspaceId(userId, "brand") }, { $push: { "brand.campaigns": campaign }, $set: { updatedAt: new Date() } });
  return campaign;
}

export async function deleteBrandCampaign(session: GoogleSession, id: string) {
  const { db, userId } = await ensureAccount({ ...session, role: "brand" });
  await db.collection<DbWorkspace>("workspaces").updateOne({ _id: workspaceId(userId, "brand") }, { $pull: { "brand.campaigns": { id } }, $set: { updatedAt: new Date() } });
}

export async function addBrandBudget(session: GoogleSession, amount: number) {
  const { db, userId } = await ensureAccount({ ...session, role: "brand" });
  await db.collection<DbWorkspace>("workspaces").updateOne({ _id: workspaceId(userId, "brand") }, { $inc: { "brand.walletBalance": amount }, $set: { updatedAt: new Date() } });
}
