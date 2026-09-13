import type { BrandCampaign, BrandCollaboration, BrandCreator, BrandProfile, CreatorCardData, CreatorCollaboration, CreatorEarnings, CreatorOpportunity, CreatorWithdrawal, MessageThread, WorkspaceMessage } from "@/lib/types";
import { creatorCard, opportunities as demoOpportunities } from "@/lib/data";
import { getDatabase, isMongoConfigured } from "@/lib/db";
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
  creatorApplications?: CreatorCollaboration[];
  creatorPayout?: {
    payoutMethod: "stripe" | "bank";
    stripeConnected: boolean;
    withdrawals: CreatorWithdrawal[];
  };
  linkedinUrl?: string;
  onboardingComplete?: boolean;
  brand?: {
    walletBalance: number;
    metrics: { creatorsActivated: number; postsPublished: number; profilesEngaged: number; impressions: number };
    campaigns: BrandCampaign[];
    collaborations: BrandCollaboration[];
    todoState: string[];
    profile?: BrandProfile;
  };
  createdAt: Date;
  updatedAt: Date;
};

type BrandWorkspaceData = NonNullable<DbWorkspace["brand"]>;

type DbOpportunity = CreatorOpportunity & { _id: string; createdAt: Date; updatedAt: Date; brandWorkspaceId?: string };

type DbMessageThread = {
  _id: string;
  participantIds: string[];
  type: MessageThread["type"];
  title: string;
  subtitle: string;
  messages: WorkspaceMessage[];
  createdAt: Date;
  updatedAt: Date;
};

export type WorkspaceSnapshot = {
  persisted: true;
  user: { id: string; name: string; email: string; picture?: string; role: WorkspaceRole };
  role: WorkspaceRole;
  creator?: { profile: CreatorCardData; linkedinUrl?: string; onboardingComplete: boolean; earnings: CreatorEarnings };
  brand?: {
    walletBalance: number;
    metrics: BrandWorkspaceData["metrics"];
    campaigns: BrandCampaign[];
    creators: BrandCreator[];
    collaborations: BrandCollaboration[];
    profile?: BrandProfile;
  };
};

function collaborationForOpportunity(opportunity: CreatorOpportunity): CreatorCollaboration {
  return {
    id: `application-${opportunity.id}`,
    opportunityId: opportunity.id,
    brandName: opportunity.brandName,
    campaignName: opportunity.name,
    status: "Applications sent",
    performance: "Not started",
    nextAction: "Wait for the brand to review your application",
    net: opportunity.compensation,
    deadline: opportunity.deadline,
    appliedAt: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()),
    logo: opportunity.logo,
  };
}

async function seedDemoOpportunities() {
  const db = await getDatabase();
  const collection = db.collection<DbOpportunity>("opportunities");
  const now = new Date();
  await Promise.all(demoOpportunities.map((opportunity) => collection.updateOne({ _id: opportunity.id }, { $set: { ...opportunity, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true })));
  return collection;
}

function toPublicOpportunity(opportunity: DbOpportunity): CreatorOpportunity {
  const { _id: _ignoredId, createdAt: _ignoredCreatedAt, updatedAt: _ignoredUpdatedAt, brandWorkspaceId: _ignoredBrandWorkspaceId, ...publicOpportunity } = opportunity;
  return publicOpportunity;
}

export async function getCreatorOpportunities() {
  if (!isMongoConfigured()) return demoOpportunities;
  const collection = await seedDemoOpportunities();
  const opportunities = await collection.find({}).sort({ createdAt: 1 }).toArray();
  return opportunities.map(toPublicOpportunity);
}

export async function getCreatorCollaborations(session: GoogleSession) {
  const { db, userId } = await ensureAccount({ ...session, role: "creator" });
  const workspace = await db.collection<DbWorkspace>("workspaces").findOne({ _id: workspaceId(userId, "creator") }, { projection: { creatorApplications: 1 } });
  return workspace?.creatorApplications || [];
}

export async function applyToCreatorOpportunity(session: GoogleSession, opportunityId: string) {
  const collection = await seedDemoOpportunities();
  const opportunity = await collection.findOne({ _id: opportunityId });
  if (!opportunity) throw new Error("Opportunity not found");
  const { db, userId } = await ensureAccount({ ...session, role: "creator" });
  const collaboration = collaborationForOpportunity(opportunity);
  await db.collection<DbWorkspace>("workspaces").updateOne(
    { _id: workspaceId(userId, "creator"), "creatorApplications.opportunityId": { $ne: opportunityId } },
    { $push: { creatorApplications: collaboration }, $set: { updatedAt: new Date() } },
  );
  const workspace = await db.collection<DbWorkspace>("workspaces").findOne({ _id: workspaceId(userId, "creator") }, { projection: { creatorApplications: 1 } });
  const saved = workspace?.creatorApplications?.find((item) => item.opportunityId === opportunityId) || collaboration;
  if (opportunity.brandWorkspaceId) {
    const brandCollaboration: BrandCollaboration = {
      id: `brand-application-${opportunity.id}-${userId}`,
      creatorName: session.name,
      creatorEmail: session.email,
      creatorPicture: session.picture,
      creatorUserId: userId,
      creatorApplicationId: saved.id,
      campaignId: opportunity.id,
      campaignName: opportunity.name,
      status: "Application received",
      nextAction: "Review the creator application",
      amount: opportunity.compensation,
      deadline: opportunity.deadline,
      updatedAt: saved.appliedAt,
    };
    const brandResult = await db.collection<DbWorkspace>("workspaces").updateOne(
      { _id: opportunity.brandWorkspaceId, "brand.collaborations.id": { $ne: brandCollaboration.id } },
      { $push: { "brand.collaborations": brandCollaboration }, $set: { updatedAt: new Date() } },
    );
    if (brandResult.modifiedCount) {
      await db.collection<DbWorkspace>("workspaces").updateOne(
        { _id: opportunity.brandWorkspaceId, "brand.campaigns.id": opportunity.id },
        { $inc: { "brand.campaigns.$.creators": 1, "brand.metrics.creatorsActivated": 1 } },
      );
    }
  }
  return saved;
}

const workspaceId = (userId: string, role: WorkspaceRole) => `${userId}:${role}`;

function messageTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

async function ensureSupportThread(db: Awaited<ReturnType<typeof getDatabase>>, userId: string) {
  const now = new Date();
  const greeting: WorkspaceMessage = { id: `support-welcome-${userId}`, senderId: "naano-support", senderName: "Naano support", body: "Hi, I’m the Naano assistant. Ask a question here and our team can step in when needed.", sentAt: messageTimestamp(now) };
  await db.collection<DbMessageThread>("messageThreads").updateOne(
    { _id: `support:${userId}` },
    { $setOnInsert: { participantIds: [userId], type: "support", title: "Naano support", subtitle: "Product help and account questions", messages: [greeting], createdAt: now, updatedAt: now } },
    { upsert: true },
  );
}

function toMessageThread(thread: DbMessageThread): MessageThread {
  return { id: thread._id, type: thread.type, title: thread.title, subtitle: thread.subtitle, messages: thread.messages, updatedAt: messageTimestamp(thread.updatedAt) };
}

export async function getMessageThreads(session: GoogleSession) {
  const { db, userId } = await ensureAccount(session);
  await ensureSupportThread(db, userId);
  const threads = await db.collection<DbMessageThread>("messageThreads").find({ participantIds: userId }).sort({ updatedAt: -1 }).toArray();
  return threads.map(toMessageThread);
}

export async function sendWorkspaceMessage(session: GoogleSession, threadId: string, body: string) {
  const content = body.trim().replace(/\s+/g, " ").slice(0, 2000);
  if (!content) throw new Error("A message cannot be empty");
  const { db, userId } = await ensureAccount(session);
  await ensureSupportThread(db, userId);
  const thread = await db.collection<DbMessageThread>("messageThreads").findOne({ _id: threadId, participantIds: userId });
  if (!thread) throw new Error("Message thread not found");
  const now = new Date();
  const message: WorkspaceMessage = { id: `message-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`, senderId: userId, senderName: session.name, body: content, sentAt: messageTimestamp(now) };
  const messages = [message];
  if (thread.type === "support") messages.push({ id: `support-reply-${now.getTime()}`, senderId: "naano-support", senderName: "Naano support", body: "Thanks — we received your message. A Naano teammate will follow up here if you need more help.", sentAt: messageTimestamp(now) });
  await db.collection<DbMessageThread>("messageThreads").updateOne({ _id: threadId, participantIds: userId }, { $push: { messages: { $each: messages } }, $set: { updatedAt: now } });
  return getMessageThreads(session);
}

async function createCollaborationMessageThread(db: Awaited<ReturnType<typeof getDatabase>>, brandUserId: string, brandName: string, collaboration: BrandCollaboration) {
  const now = new Date();
  const welcome: WorkspaceMessage = { id: `collaboration-welcome-${collaboration.id}`, senderId: "naano-support", senderName: "Naano", body: `${brandName} accepted this collaboration. Use this thread to agree the content angle, delivery date and any campaign details.`, sentAt: messageTimestamp(now) };
  await db.collection<DbMessageThread>("messageThreads").updateOne(
    { _id: `collaboration:${collaboration.id}` },
    { $setOnInsert: { participantIds: [brandUserId, collaboration.creatorUserId], type: "collaboration", title: collaboration.campaignName, subtitle: `${collaboration.creatorName} · €${collaboration.amount}/post`, messages: [welcome], createdAt: now }, $set: { updatedAt: now } },
    { upsert: true },
  );
}

function profileForSession(session: GoogleSession): CreatorCardData {
  return { ...creatorCard, name: session.name, avatarUrl: session.picture };
}

function creatorToBrandCreator(profile: CreatorCardData): BrandCreator {
  const initials = profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const followers = profile.followers >= 1000 ? `${Math.round(profile.followers / 100) / 10}K` : `${profile.followers}`;
  return { name: profile.name, role: profile.industries.join(" · "), industries: profile.industries.join(" · "), followers, price: profile.price, fit: 90, initials, tone: profile.avatarTone, avatarUrl: profile.avatarUrl };
}

function withdrawalTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function creatorEarningsForWorkspace(workspace: DbWorkspace): CreatorEarnings {
  const payouts = {
    payoutMethod: workspace.creatorPayout?.payoutMethod || ("stripe" as const),
    stripeConnected: workspace.creatorPayout?.stripeConnected || false,
    withdrawals: workspace.creatorPayout?.withdrawals || [],
  };
  const totalEarned = (workspace.creatorApplications || [])
    .filter((item) => item.status === "Completed")
    .reduce((total, item) => total + item.net, 0);
  const inTransit = payouts.withdrawals
    .filter((withdrawal) => withdrawal.status === "Pending")
    .reduce((total, withdrawal) => total + withdrawal.amount, 0);
  return {
    totalEarned,
    inTransit,
    available: Math.max(totalEarned - inTransit, 0),
    payoutMethod: payouts.payoutMethod,
    stripeConnected: payouts.stripeConnected,
    withdrawals: payouts.withdrawals,
  };
}

export async function getCreatorEarnings(session: GoogleSession) {
  const { db, userId } = await ensureAccount({ ...session, role: "creator" });
  const workspace = await db.collection<DbWorkspace>("workspaces").findOne({ _id: workspaceId(userId, "creator") });
  if (!workspace) throw new Error("Creator workspace could not be loaded");
  return creatorEarningsForWorkspace(workspace);
}

export async function connectCreatorStripe(session: GoogleSession) {
  const { db, userId } = await ensureAccount({ ...session, role: "creator" });
  await db.collection<DbWorkspace>("workspaces").updateOne(
    { _id: workspaceId(userId, "creator") },
    { $set: { "creatorPayout.payoutMethod": "stripe", "creatorPayout.stripeConnected": true, updatedAt: new Date() } },
  );
  await db.collection<DbWorkspace>("workspaces").updateOne(
    { _id: workspaceId(userId, "creator"), "creatorPayout.withdrawals": { $exists: false } },
    { $set: { "creatorPayout.withdrawals": [] } },
  );
  return getCreatorEarnings(session);
}

export async function requestCreatorWithdrawal(session: GoogleSession) {
  const { db, userId } = await ensureAccount({ ...session, role: "creator" });
  const workspace = await db.collection<DbWorkspace>("workspaces").findOne({ _id: workspaceId(userId, "creator") });
  if (!workspace) throw new Error("Creator workspace could not be loaded");
  const earnings = creatorEarningsForWorkspace(workspace);
  if (!earnings.stripeConnected || earnings.payoutMethod !== "stripe") throw new Error("Connect Stripe before requesting a withdrawal");
  if (earnings.available <= 0) throw new Error("There are no cleared earnings available to withdraw yet");
  const withdrawal: CreatorWithdrawal = { id: `withdrawal-${Date.now()}`, amount: earnings.available, method: "stripe", status: "Pending", requestedAt: withdrawalTimestamp() };
  await db.collection<DbWorkspace>("workspaces").updateOne(
    { _id: workspaceId(userId, "creator") },
    { $push: { "creatorPayout.withdrawals": withdrawal }, $set: { updatedAt: new Date() } },
  );
  return getCreatorEarnings(session);
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
    ? { brand: { walletBalance: 0, metrics: { creatorsActivated: 0, postsPublished: 0, profilesEngaged: 0, impressions: 0 }, campaigns: [], collaborations: [], todoState: [] } }
    : { creatorProfile: profileForSession(session), creatorPayout: { payoutMethod: "stripe", stripeConnected: false, withdrawals: [] } };
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

export async function hasCompletedBrandWorkspace(session: GoogleSession) {
  const db = await getDatabase();
  const workspace = await db.collection<DbWorkspace>("workspaces").findOne({ _id: workspaceId(`google:${session.sub}`, "brand") }, { projection: { "brand.profile.onboardingComplete": 1 } });
  return Boolean(workspace?.brand?.profile?.onboardingComplete);
}

export async function saveBrandOnboarding(session: GoogleSession, profile: Omit<BrandProfile, "onboardingComplete">) {
  const { db, userId } = await ensureAccount({ ...session, role: "brand" });
  const savedProfile: BrandProfile = { ...profile, onboardingComplete: true };
  await db.collection<DbWorkspace>("workspaces").updateOne(
    { _id: workspaceId(userId, "brand") },
    { $set: { "brand.profile": savedProfile, updatedAt: new Date() } },
  );
  return savedProfile;
}

export async function getWorkspaceSnapshot(session: GoogleSession, role: WorkspaceRole): Promise<WorkspaceSnapshot> {
  const { db, userId } = await ensureAccount({ ...session, role });
  const user = await db.collection<DbUser>("users").findOne({ _id: userId });
  const workspace = await db.collection<DbWorkspace>("workspaces").findOne({ _id: workspaceId(userId, role) });
  if (!user || !workspace) throw new Error("Workspace could not be loaded");

  const result: WorkspaceSnapshot = { persisted: true, user: { id: userId, name: user.name, email: user.email, picture: user.picture, role }, role };
  if (role === "creator") {
    result.creator = { profile: workspace.creatorProfile || profileForSession(session), linkedinUrl: workspace.linkedinUrl, onboardingComplete: Boolean(workspace.onboardingComplete || workspace.linkedinUrl), earnings: creatorEarningsForWorkspace(workspace) };
    return result;
  }

  const creatorWorkspaces = await db.collection<DbWorkspace>("workspaces").find({ role: "creator", creatorProfile: { $exists: true } }).toArray();
  result.brand = {
    walletBalance: workspace.brand?.walletBalance || 0,
    metrics: workspace.brand?.metrics || { creatorsActivated: 0, postsPublished: 0, profilesEngaged: 0, impressions: 0 },
    campaigns: workspace.brand?.campaigns || [],
    creators: creatorWorkspaces.flatMap((item) => item.creatorProfile ? [creatorToBrandCreator(item.creatorProfile)] : []),
    collaborations: workspace.brand?.collaborations || [],
    profile: workspace.brand?.profile,
  };
  return result;
}

export async function createBrandCampaign(session: GoogleSession, input: Pick<BrandCampaign, "name" | "description" | "industry" | "region" | "compensation" | "deadline">) {
  const { db, userId } = await ensureAccount({ ...session, role: "brand" });
  const brandWorkspaceId = workspaceId(userId, "brand");
  const workspace = await db.collection<DbWorkspace>("workspaces").findOne({ _id: brandWorkspaceId }, { projection: { "brand.profile.companyName": 1 } });
  const industry = input.industry || "Software";
  const region = input.region || "Europe · North America";
  const compensation = input.compensation || 500;
  const deadline = input.deadline || "14 days";
  const campaign: BrandCampaign = { id: `campaign-${Date.now()}`, name: input.name, description: input.description, status: "Active", creators: 0, published: 0, budget: 0, created: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()), industry, region, compensation, deadline };
  const brandName = workspace?.brand?.profile?.companyName || session.name;
  const logo = brandName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "B";
  const opportunity: DbOpportunity = { _id: campaign.id, id: campaign.id, name: campaign.name, brandName, description: campaign.description, match: "Strong match", region, deadline, logo, industry, compensation, channel: "LinkedIn", brandWorkspaceId, createdAt: new Date(), updatedAt: new Date() };
  const { _id: _opportunityId, ...opportunityFields } = opportunity;
  await Promise.all([
    db.collection<DbWorkspace>("workspaces").updateOne({ _id: brandWorkspaceId }, { $push: { "brand.campaigns": campaign }, $set: { updatedAt: new Date() } }),
    db.collection<DbOpportunity>("opportunities").updateOne({ _id: campaign.id }, { $set: opportunityFields }, { upsert: true }),
  ]);
  return campaign;
}

export async function deleteBrandCampaign(session: GoogleSession, id: string) {
  const { db, userId } = await ensureAccount({ ...session, role: "brand" });
  const brandWorkspaceId = workspaceId(userId, "brand");
  await Promise.all([
    db.collection<DbWorkspace>("workspaces").updateOne({ _id: brandWorkspaceId }, { $pull: { "brand.campaigns": { id } }, $set: { updatedAt: new Date() } }),
    db.collection<DbOpportunity>("opportunities").deleteOne({ _id: id, brandWorkspaceId }),
  ]);
}

export async function reviewBrandCollaboration(session: GoogleSession, collaborationId: string, decision: "accept" | "decline") {
  const { db, userId } = await ensureAccount({ ...session, role: "brand" });
  const brandWorkspaceId = workspaceId(userId, "brand");
  const workspace = await db.collection<DbWorkspace>("workspaces").findOne({ _id: brandWorkspaceId, "brand.collaborations.id": collaborationId }, { projection: { "brand.collaborations.$": 1 } });
  const collaboration = workspace?.brand?.collaborations?.[0];
  if (!collaboration) throw new Error("Creator application not found");
  const accepted = decision === "accept";
  const brandStatus: BrandCollaboration["status"] = accepted ? "Active" : "Declined";
  const creatorStatus: CreatorCollaboration["status"] = accepted ? "Active" : "Declined";
  const nextAction = accepted ? "Agree the content angle and due date" : "No action needed";
  await Promise.all([
    db.collection<DbWorkspace>("workspaces").updateOne(
      { _id: brandWorkspaceId, "brand.collaborations.id": collaborationId },
      { $set: { "brand.collaborations.$.status": brandStatus, "brand.collaborations.$.nextAction": nextAction, "brand.collaborations.$.updatedAt": new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()), updatedAt: new Date() } },
    ),
    db.collection<DbWorkspace>("workspaces").updateOne(
      { _id: workspaceId(collaboration.creatorUserId, "creator"), "creatorApplications.id": collaboration.creatorApplicationId },
      { $set: { "creatorApplications.$.status": creatorStatus, "creatorApplications.$.nextAction": nextAction, updatedAt: new Date() } },
    ),
  ]);
  if (accepted) await createCollaborationMessageThread(db, userId, session.name, collaboration);
}

export async function addBrandBudget(session: GoogleSession, amount: number) {
  const { db, userId } = await ensureAccount({ ...session, role: "brand" });
  await db.collection<DbWorkspace>("workspaces").updateOne({ _id: workspaceId(userId, "brand") }, { $inc: { "brand.walletBalance": amount }, $set: { updatedAt: new Date() } });
}
