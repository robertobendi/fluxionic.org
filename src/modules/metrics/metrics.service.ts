import crypto from "crypto";
import { nanoid } from "nanoid";
import { db } from "../../shared/database/index.js";
import { pageview } from "../../shared/database/schema.js";
import { envSchema } from "../../shared/config/index.js";

// Extract environment config type
type EnvConfig = {
  METRICS_SALT: string;
};

// This will be injected at runtime
let config: EnvConfig;

export function setConfig(envConfig: EnvConfig) {
  config = envConfig;
}

/**
 * Generate privacy-friendly visitor hash
 * Uses daily rotation (date in hash) to prevent long-term tracking
 */
export function generateVisitorHash(
  ip: string,
  userAgent: string | undefined
): string {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const hashInput = `${date}:${config.METRICS_SALT}:${ip}:${userAgent || ""}`;
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

/**
 * Extract domain from referrer URL
 * Strips path, query params for privacy
 */
export function extractReferrerDomain(
  referrer: string | undefined
): string | null {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch {
    // Invalid URL, return null
    return null;
  }
}

/**
 * Record pageview with privacy-friendly hashing
 */
export async function recordPageview(params: {
  path: string;
  referrer?: string;
  ip: string;
  userAgent: string | undefined;
}): Promise<void> {
  const visitorHash = generateVisitorHash(params.ip, params.userAgent);
  const referrerDomain = extractReferrerDomain(params.referrer);

  await db.insert(pageview).values({
    id: nanoid(),
    path: params.path,
    referrerDomain,
    visitorHash,
  });
}
