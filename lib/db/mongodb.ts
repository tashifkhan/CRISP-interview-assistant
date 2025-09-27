import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI as string | undefined;
const dbName = process.env.MONGODB_DB as string | undefined;

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (!uri) throw new Error('MONGODB_URI not set');
  if (!dbName) throw new Error('MONGODB_DB not set');
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}

export function collection(name: string) {
  if (!db) throw new Error('DB not initialized yet - call getDb first');
  return db.collection(name);
}
