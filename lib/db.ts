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

  let parsedUri: URL;
  try {
    parsedUri = new URL(uri);
  } catch {
    throw new Error("MONGODB_URI is not a valid MongoDB connection string");
  }
  if (!parsedUri.searchParams.has("authSource")) parsedUri.searchParams.set("authSource", process.env.MONGODB_AUTH_SOURCE || "admin");
  if (!global.naanoMongoClientPromise) {
    const client = new MongoClient(parsedUri.toString(), { serverSelectionTimeoutMS: 8000 });
    global.naanoMongoClientPromise = client.connect().catch((error: unknown) => {
      // Do not retain a rejected connection across subsequent serverless calls.
      global.naanoMongoClientPromise = undefined;
      throw error;
    });
  }
  const clientPromise = global.naanoMongoClientPromise;
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || "naano");
}

export function mongoErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("not configured")) return "MONGODB_URI is missing from this deployment's environment variables.";
  if (message.includes("not a valid mongodb connection string")) return "MONGODB_URI is not a valid MongoDB connection string. Check that it has no surrounding quotes or placeholder values.";
  if (code === "18" || code === "8000" || message.includes("authentication failed") || message.includes("bad auth")) return "MongoDB rejected the configured database credentials. Check the database username, password, and authSource in MONGODB_URI.";
  if (message.includes("enotfound") || message.includes("server selection") || message.includes("could not connect") || message.includes("econnrefused")) return "Naano could not reach MongoDB. Check the Atlas cluster hostname, network access list, and MONGODB_URI.";
  return "Naano could not save the workspace to MongoDB. Check MONGODB_URI and try again.";
}
