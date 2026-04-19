import { pgTable, text, boolean, timestamp, jsonb, integer, unique, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"),
  banned: boolean("banned").default(false),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonatedBy"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// Content tables
export const collection = pgTable("collection", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  fields: jsonb("fields").notNull(),
  // Permissions granted to non-admin roles, e.g. { editor: "write", viewer: "read" }
  permissions: jsonb("permissions"),
  // When true, this collection accepts unauthenticated writes via /api/forms/:slug
  isForm: boolean("is_form").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const entry = pgTable("entry", {
  id: text("id").primaryKey(),
  collectionId: text("collectionId")
    .notNull()
    .references(() => collection.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  data: jsonb("data").notNull(),
  status: text("status").notNull().default("draft"),
  position: integer("position").notNull().default(0),
  publishAt: timestamp("publish_at", { withTimezone: true }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  uniqueCollectionSlug: unique().on(table.collectionId, table.slug),
  searchIdx: index("entries_search_idx").using(
    "gin",
    sql`to_tsvector('english', ${table.data}::text)`
  ),
  publishAtIdx: index("entry_publish_at_idx").on(table.publishAt),
}));

// Entry revisions — snapshot of data per update, bounded to N per entry.
export const entryRevision = pgTable("entry_revision", {
  id: text("id").primaryKey(),
  entryId: text("entry_id")
    .notNull()
    .references(() => entry.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  data: jsonb("data").notNull(),
  status: text("status").notNull(),
  updatedBy: text("updated_by").references(() => user.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  entryVersionIdx: index("entry_revision_entry_version_idx").on(table.entryId, table.version.desc()),
}));

// Content relations
export const collectionRelations = relations(collection, ({ many }) => ({
  entries: many(entry),
}));

export const entryRelations = relations(entry, ({ one }) => ({
  collection: one(collection, {
    fields: [entry.collectionId],
    references: [collection.id],
  }),
}));

// Media table
export const mediaFile = pgTable("media_file", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  altText: text("alt_text"),
  path: text("path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  // Pre-generated image variants: { thumbnail, medium, large } → { url, width, height }
  variants: jsonb("variants"),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Media relations
export const mediaFileRelations = relations(mediaFile, ({ one }) => ({
  uploader: one(user, {
    fields: [mediaFile.uploadedBy],
    references: [user.id],
  }),
}));

// API keys (bearer tokens)
export const apiKey = pgTable("api_key", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // SHA-256 hex digest of token material; never store plaintext.
  tokenHash: text("token_hash").notNull().unique(),
  prefix: text("prefix").notNull(), // first ~10 chars for admin UI display
  scopes: jsonb("scopes").notNull(), // { read: "*" | string[], write: "*" | string[] }
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

// Webhooks
export const webhook = pgTable("webhook", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(), // random per-webhook secret used for HMAC
  events: jsonb("events").notNull(), // array of event names
  collectionSlug: text("collection_slug"), // optional filter
  enabled: boolean("enabled").notNull().default(true),
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

export const webhookDelivery = pgTable("webhook_delivery", {
  id: text("id").primaryKey(),
  webhookId: text("webhook_id")
    .notNull()
    .references(() => webhook.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("pending"), // pending | success | failed
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pendingIdx: index("webhook_delivery_pending_idx").on(table.status, table.nextAttemptAt),
}));

// Form submissions (unauthenticated writes to collections marked as forms)
export const formSubmission = pgTable("form_submission", {
  id: text("id").primaryKey(),
  collectionId: text("collection_id")
    .notNull()
    .references(() => collection.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  collectionIdx: index("form_submission_collection_idx").on(table.collectionId, table.createdAt.desc()),
}));

// Metrics table
export const pageview = pgTable("pageview", {
  id: text("id").primaryKey(),
  path: text("path").notNull(),
  referrerDomain: text("referrer_domain"),
  visitorHash: text("visitor_hash").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  timePathIdx: index("pageview_time_path_idx").on(table.createdAt.desc(), table.path),
}));
