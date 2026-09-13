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

  const clientPromise = global.naanoMongoClientPromise ?? new MongoClient(uri).connect();
  if (!global.naanoMongoClientPromise) global.naanoMongoClientPromise = clientPromise;
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || "naano");
}
