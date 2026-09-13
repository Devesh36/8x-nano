import { MongoClient, type Db } from "mongodb";

const mongoUri = () => process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var naanoMongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured() {
  return Boolean(mongoUri());
}

export async function getDatabase(): Promise<Db> {
  const uri = mongoUri();
  if (!uri) throw new Error("MONGODB_URI is not configured");

  const parsedUri = new URL(uri);
  if (!parsedUri.searchParams.has("authSource")) parsedUri.searchParams.set("authSource", process.env.MONGODB_AUTH_SOURCE || "admin");
  const clientPromise = global.naanoMongoClientPromise ?? new MongoClient(parsedUri.toString(), { serverSelectionTimeoutMS: 8000 }).connect();
  if (!global.naanoMongoClientPromise) global.naanoMongoClientPromise = clientPromise;
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || "naano");
}

export function mongoErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (code === "8000" || message.includes("authentication failed") || message.includes("bad auth")) return "MongoDB rejected the configured database credentials. Check the database username, password, and authSource in MONGODB_URI.";
  if (message.includes("enotfound") || message.includes("server selection")) return "Naano could not reach MongoDB. Check the cluster hostname, network access list, and MONGODB_URI.";
  return "Naano could not save the workspace to MongoDB. Check MONGODB_URI and try again.";
}
