import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";

// Disable prefetch as it is not supported for "transaction" mode if using some providers like Supabase
// but for standard Postgres it's fine.
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
