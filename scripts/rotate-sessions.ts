#!/usr/bin/env tsx

/**
 * Session Rotation Script
 *
 * Invalidates all active sessions in the database.
 * Used for security cleanup when session tokens may have been exposed.
 *
 * Usage:
 *   npx tsx scripts/rotate-sessions.ts
 *
 * Or programmatically:
 *   import { rotateAllSessions } from './scripts/rotate-sessions';
 *   await rotateAllSessions();
 */

import "dotenv/config";
import { db } from "../src/shared/database/index.js";
import { session } from "../src/shared/database/schema.js";
import { sql } from "drizzle-orm";

export async function rotateAllSessions(): Promise<{
  beforeCount: number;
  afterCount: number;
  deleted: number;
}> {
  console.log("🔄 Starting session rotation...");

  // Count sessions before deletion
  const beforeResult = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*) as count FROM ${session}`
  );
  const beforeCount = parseInt(beforeResult?.[0]?.count || "0", 10);
  console.log(`📊 Sessions before deletion: ${beforeCount}`);

  if (beforeCount === 0) {
    console.log("✅ No sessions to delete. Database is already clean.");
    return { beforeCount: 0, afterCount: 0, deleted: 0 };
  }

  // Delete all sessions
  console.log("🗑️  Deleting all sessions...");
  await db.delete(session);

  // Verify deletion
  const afterResult = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*) as count FROM ${session}`
  );
  const afterCount = parseInt(afterResult?.[0]?.count || "0", 10);
  const deleted = beforeCount - afterCount;

  console.log(`📊 Sessions after deletion: ${afterCount}`);
  console.log(`✅ Deleted ${deleted} sessions`);

  if (afterCount > 0) {
    throw new Error(
      `Session deletion verification failed: ${afterCount} sessions remain`
    );
  }

  console.log("✅ Session rotation complete. All leaked tokens are now invalid.");

  return { beforeCount, afterCount, deleted };
}

// Run if executed directly (check if this is the main module)
const isMainModule = process.argv[1] && process.argv[1].includes('rotate-sessions');
if (isMainModule) {
  rotateAllSessions()
    .then((result) => {
      console.log("\n📋 Summary:");
      console.log(`   Before: ${result.beforeCount} sessions`);
      console.log(`   After:  ${result.afterCount} sessions`);
      console.log(`   Deleted: ${result.deleted} sessions`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Session rotation failed:", error);
      process.exit(1);
    });
}
