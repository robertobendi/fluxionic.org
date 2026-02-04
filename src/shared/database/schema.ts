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
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  uniqueCollectionSlug: unique().on(table.collectionId, table.slug),
  searchIdx: index("entries_search_idx").using(
    "gin",
    sql`to_tsvector('english', ${table.data}::text)`
  ),
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
