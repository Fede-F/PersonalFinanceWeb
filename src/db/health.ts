import { db } from "./index";
import { sql } from "drizzle-orm";

let lastCheckTime = 0;
let lastCheckResult = true;
const CHECK_INTERVAL = 10000; // 10 seconds

/**
 * Checks if the database is currently connected and responsive.
 * Returns true if the connection is successful, false otherwise.
 * Includes a simple cache to avoid spamming the DB on every request.
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  const now = Date.now();
  
  // Return cached result if interval hasn't passed
  if (now - lastCheckTime < CHECK_INTERVAL) {
    return lastCheckResult;
  }

  try {
    // Perform a simple query to verify connection
    await db.execute(sql`SELECT 1`);
    lastCheckTime = now;
    lastCheckResult = true;
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    lastCheckTime = now;
    lastCheckResult = false;
    return false;
  }
}
