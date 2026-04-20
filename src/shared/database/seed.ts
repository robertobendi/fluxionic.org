import { db } from "./index.js";
import { user, account, collection } from "./schema.js";
import { auth } from "../../modules/auth/auth.config.js";
import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm";

type SeedField = {
  id: string;
  name: string;
  label: string;
  type:
    | "string"
    | "text"
    | "number"
    | "boolean"
    | "date"
    | "rich-text"
    | "media"
    | "select"
    | "multi-select"
    | "slug"
    | "reference"
    | "multi-reference"
    | "repeater";
  required?: boolean;
  generateFrom?: string;
  referenceCollection?: string;
  labelField?: string;
  options?: string[];
};

const fid = () => nanoid(10);

const contentCollections: Array<{ name: string; slug: string; fields: SeedField[] }> = [
  {
    name: "Principal Investigators",
    slug: "pis",
    fields: [
      { id: fid(), name: "name",        label: "Full Name",   type: "string",    required: true },
      { id: fid(), name: "affiliation", label: "Affiliation", type: "string",    required: true },
      { id: fid(), name: "photo",       label: "Photo",       type: "media" },
      { id: fid(), name: "bio",         label: "Biography",   type: "rich-text" },
      { id: fid(), name: "website",     label: "Website URL", type: "string" },
      { id: fid(), name: "slug",        label: "Slug",        type: "slug",      generateFrom: "name" },
    ],
  },
  {
    name: "Fellows",
    slug: "fellows",
    fields: [
      { id: fid(), name: "name",        label: "Full Name",              type: "string",    required: true },
      { id: fid(), name: "photo",       label: "Photo",                  type: "media" },
      { id: fid(), name: "topic",       label: "Research Topic",         type: "string",    required: true },
      { id: fid(), name: "bio",         label: "Biography",              type: "rich-text" },
      { id: fid(), name: "supervisor",  label: "Supervisor (PI)",        type: "reference", required: true, referenceCollection: "pis", labelField: "name" },
      { id: fid(), name: "institution", label: "Host Institution",       type: "string" },
      { id: fid(), name: "startDate",   label: "Start Date",             type: "date" },
      { id: fid(), name: "website",     label: "Personal website / ORCID", type: "string" },
      { id: fid(), name: "slug",        label: "Slug",                   type: "slug",      generateFrom: "name" },
    ],
  },
  {
    name: "Publications",
    slug: "publications",
    fields: [
      { id: fid(), name: "title",    label: "Title",    type: "string", required: true },
      { id: fid(), name: "authors",  label: "Authors",  type: "string", required: true },
      { id: fid(), name: "journal",  label: "Journal",  type: "string" },
      { id: fid(), name: "year",     label: "Year",     type: "number", required: true },
      { id: fid(), name: "doi",      label: "DOI",      type: "string" },
      { id: fid(), name: "url",      label: "External URL", type: "string" },
      { id: fid(), name: "abstract", label: "Abstract", type: "text" },
      { id: fid(), name: "pdf",      label: "PDF",      type: "media" },
      { id: fid(), name: "slug",     label: "Slug",     type: "slug",   generateFrom: "title" },
    ],
  },
  {
    name: "Outreach Activities",
    slug: "outreach",
    fields: [
      { id: fid(), name: "title",       label: "Title",       type: "string",    required: true },
      { id: fid(), name: "date",        label: "Date",        type: "date",      required: true },
      { id: fid(), name: "location",    label: "Location",    type: "string" },
      { id: fid(), name: "description", label: "Description", type: "rich-text" },
      { id: fid(), name: "image",       label: "Cover image", type: "media" },
      { id: fid(), name: "link",        label: "External link", type: "string" },
      { id: fid(), name: "slug",        label: "Slug",        type: "slug",      generateFrom: "title" },
    ],
  },
];

export async function seedContentCollections() {
  for (const def of contentCollections) {
    const [existing] = await db
      .select()
      .from(collection)
      .where(eq(collection.slug, def.slug))
      .limit(1);
    if (existing) continue;

    await db.insert(collection).values({
      id: nanoid(),
      name: def.name,
      slug: def.slug,
      fields: def.fields,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`Seeded collection: ${def.slug}`);
  }
}

export async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log("ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin seed");
    return;
  }

  // Get better-auth context
  const ctx = await auth.$context;

  // Hash password
  const hashedPassword = await ctx.password.hash(adminPassword);
  const normalizedEmail = adminEmail.toLowerCase();

  // Ensure configured admin always exists and has the configured password
  const [existingAdmin] = await db
    .select()
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (existingAdmin) {
    await db
      .update(user)
      .set({
        role: "admin",
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, existingAdmin.id));

    const [existingCredential] = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, existingAdmin.id), eq(account.providerId, "credential")))
      .limit(1);

    if (existingCredential) {
      await db
        .update(account)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(account.id, existingCredential.id));
    } else {
      await db.insert(account).values({
        id: nanoid(),
        accountId: existingAdmin.id,
        providerId: "credential",
        userId: existingAdmin.id,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log(`Admin credentials synced for: ${normalizedEmail}`);
    return;
  }

  // Generate user ID
  const userId = nanoid();

  // Insert user record
  await db.insert(user).values({
    id: userId,
    email: normalizedEmail,
    name: "Admin",
    emailVerified: true,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Insert account record
  await db.insert(account).values({
    id: nanoid(),
    accountId: userId,
    providerId: "credential",
    userId: userId,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`Admin user created: ${normalizedEmail}`);
}
