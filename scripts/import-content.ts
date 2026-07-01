/**
 * One-shot importer: loads scripts/data/fluxionic-content.json (extracted from the
 * FLUXIONIC website spreadsheet) into the CMS as PUBLISHED entries.
 *
 * Idempotent: wipes existing entries in the target collections, then recreates them.
 * Run with:  npx tsx scripts/import-content.ts
 */
import "dotenv/config";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "../src/shared/database/index.js";
import { entry, collection } from "../src/shared/database/schema.js";
import { seedContentCollections, contentCollections } from "../src/shared/database/seed.js";
import { getCollection } from "../src/modules/content/collection.service.js";
import { createEntry } from "../src/modules/content/entry.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  readFileSync(path.join(__dirname, "data", "fluxionic-content.json"), "utf-8")
) as {
  fellows: any[];
  pis: any[];
  conferences: any[];
  publications: any[];
  outreach: any[];
  events: any[];
};

// ---- derivation helpers -------------------------------------------------
const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9,
  oct: 10, nov: 11, dec: 12,
};

/** Best-effort ISO start date from strings like "14-25 September 2025",
 *  "9-13 December 2024", "29-Sep-25", "April 29, 2026", "2026/1/31". */
function parseStartDate(s: string): string {
  if (!s) return "2025-01-01";
  s = s.trim();
  // 2026/1/31 or 2026-01-31
  let m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  // Month name anywhere + year
  const monMatch = s.match(/([A-Za-z]{3,})/g);
  const yearMatch = s.match(/\b(20\d{2})\b/);
  const dayMatch = s.match(/\b(\d{1,2})\b/);
  let year = yearMatch ? Number(yearMatch[1]) : undefined;
  let month = 1;
  if (monMatch) {
    for (const w of monMatch) {
      const key = w.slice(0, 3).toLowerCase();
      if (MONTHS[key]) { month = MONTHS[key]; break; }
    }
  }
  // dd-Mon-yy  e.g. 29-Sep-25
  const short = s.match(/(\d{1,2})-([A-Za-z]{3})-(\d{2})/);
  if (short) {
    return `20${short[3]}-${String(MONTHS[short[2].toLowerCase()] || 1).padStart(2, "0")}-${short[1].padStart(2, "0")}`;
  }
  const day = dayMatch ? dayMatch[1].padStart(2, "0") : "01";
  if (!year) year = 2025;
  return `${year}-${String(month).padStart(2, "0")}-${day}`;
}

function parseYear(s: string): number {
  const m = s && s.match(/\b(20\d{2})\b/);
  if (m) return Number(m[1]);
  const short = s && s.match(/-(\d{2})\b/); // e.g. 29-Sep-25
  if (short) return 2000 + Number(short[1]);
  return new Date().getFullYear();
}

const isHttp = (s?: string) => !!s && /^https?:\/\//i.test(s.trim());

// fellow name -> node (institution key used by the Nodes page)
const FELLOW_NODE: Record<string, string> = {
  "Mattia Borriello": "RUB",
  "Gabriele Dalla Valle": "UB",
  "Daniel La Valle": "UB",
  "Haoyuan Quan": "FUB",
  "Valentino Sangunetti": "CNRS",
  "Megh Dutta": "CNRS",
  "Alessandro Forina": "EPFL",
  "Paula Sierra Varela": "EPFL",
  "Yann Dumay": "NTNU",
  "Gökmen Tamer Sanli": "TUD",
  "Yucong Chen": "MPG",
  "Sabiar Rahaman": "UNIMAN",
  "Lauriane Pierot Deseilligny": "UOXF",
  "Shu Yang": "UCAM",
  "Hamza ELASSRI": "SWEETCH",
};

// Fellow head-shots live in frontend/public/fellows/<slug>.<ext> and are
// auto-attached after import (see wireFellowPhotos).
const FELLOW_PHOTO_DIR = path.resolve(__dirname, "..", "frontend", "public", "fellows");

// event title -> overrides (thumbnail + status/date corrections)
const CECAM_LOGO = "/logos/cecam.png";
const FLUX_LOGO = "/fluxionic-logo.png";

function eventImage(title: string): string {
  if (/FLUXIONIC/i.test(title)) return FLUX_LOGO;
  if (/Nonequilibrium Physics in Nanoconfinement/i.test(title))
    return "/images/les-houches-mountains.png";
  // CECAM workshops (incl. the last two on the sheet)
  return CECAM_LOGO;
}

// Les Houches year is 2026 (confirmed); the sheet's "2025" is a typo.
const DATE_OVERRIDE: Record<string, string> = {
  "Nonequilibrium Physics in Nanoconfinement": "2026-09-14",
};
const DATERANGE_OVERRIDE: Record<string, string> = {
  "Nonequilibrium Physics in Nanoconfinement": "14-25 September 2026",
};

const TODAY = "2026-07-01";

async function wipe(slug: string, collId: string) {
  await db.delete(entry).where(eq(entry.collectionId, collId));
}

async function collId(slug: string): Promise<string> {
  const c = await getCollection(slug);
  if (!c) throw new Error(`collection ${slug} missing`);
  return c.id;
}

// Public gallery drop-folder: frontend/public/galleries/<entry-slug>/*.{jpg,png,webp,...}
const GALLERY_ROOT = path.resolve(__dirname, "..", "frontend", "public", "galleries");
const IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

/** For every entry in a collection, if a matching gallery folder holds images,
 *  set its `gallery` field to the ordered list of public image paths. */
async function wireGalleries(collSlug: string, collectionId: string) {
  const rows = await db
    .select({ id: entry.id, slug: entry.slug, data: entry.data })
    .from(entry)
    .where(eq(entry.collectionId, collectionId));
  let wired = 0;
  for (const row of rows) {
    const dir = path.join(GALLERY_ROOT, row.slug);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter((f) => IMG_RE.test(f)).sort();
    if (files.length === 0) continue;
    const gallery = files.map((f) => `/galleries/${row.slug}/${f}`);
    await db
      .update(entry)
      .set({ data: { ...(row.data as object), gallery }, updatedAt: new Date() })
      .where(eq(entry.id, row.id));
    wired++;
  }
  if (wired) console.log(`  wired galleries for ${wired} ${collSlug} entries`);
}

/** Attach fellow head-shots from frontend/public/fellows/<slug>.<ext>. */
async function wireFellowPhotos(collectionId: string) {
  const rows = await db
    .select({ id: entry.id, slug: entry.slug, data: entry.data })
    .from(entry)
    .where(eq(entry.collectionId, collectionId));
  let wired = 0;
  for (const row of rows) {
    if (!existsSync(FELLOW_PHOTO_DIR)) break;
    const file = readdirSync(FELLOW_PHOTO_DIR).find(
      (f) => IMG_RE.test(f) && f.replace(IMG_RE, "") === row.slug
    );
    if (!file) continue;
    await db
      .update(entry)
      .set({ data: { ...(row.data as object), photo: `/fellows/${file}` }, updatedAt: new Date() })
      .where(eq(entry.id, row.id));
    wired++;
  }
  if (wired) console.log(`  wired photos for ${wired} fellows`);
}

async function main() {
  await seedContentCollections();

  // Sync field definitions for pre-existing collections (seed skips them if present),
  // so newly-added fields (node, gallery, galleryLink, ...) take effect.
  for (const def of contentCollections) {
    await db
      .update(collection)
      .set({ fields: def.fields as unknown as object, updatedAt: new Date() })
      .where(eq(collection.slug, def.slug));
  }

  // ---- PIs (needed first for fellow supervisor references) ----
  const pisId = await collId("pis");
  await wipe("pis", pisId);
  const piIdByName = new Map<string, string>();
  for (const pi of data.pis) {
    const created = await createEntry(pisId, {
      data: { name: pi.name, affiliation: pi.affiliation || "" },
      status: "published",
    });
    piIdByName.set(pi.name, created.id);
  }
  console.log(`PIs: ${piIdByName.size}`);

  // ---- Fellows ----
  const fellowsId = await collId("fellows");
  await wipe("fellows", fellowsId);
  let fellowN = 0;
  for (const f of data.fellows) {
    const supId = piIdByName.get(f.pi);
    if (!supId) { console.warn(`  ! no PI for fellow ${f.name} (pi=${f.pi})`); continue; }
    const d: Record<string, unknown> = {
      name: f.name,
      topic: f.topic,
      bio: f.description || "",
      supervisor: supId,
      institution: f.organization || "",
      node: FELLOW_NODE[f.name] || "",
    };
    await createEntry(fellowsId, { data: d, status: "published" });
    fellowN++;
  }
  console.log(`Fellows: ${fellowN}`);
  await wireFellowPhotos(fellowsId);

  // ---- Publications ----
  const pubId = await collId("publications");
  await wipe("publications", pubId);
  for (const p of data.publications) {
    const d: Record<string, unknown> = {
      title: p.title,
      authors: p.authors,
      year: parseYear(p.date),
    };
    if (p.journal) d.journal = p.journal;
    if (p.abstract) d.abstract = p.abstract;
    if (isHttp(p.link)) {
      d.url = p.link;
      const doi = p.link.match(/doi\.org\/(.+)$/i);
      if (doi) d.doi = doi[1];
    }
    await createEntry(pubId, { data: d, status: "published" });
  }
  console.log(`Publications: ${data.publications.length}`);

  // ---- Conferences ----
  const confId = await collId("conferences");
  await wipe("conferences", confId);
  for (const c of data.conferences) {
    const d: Record<string, unknown> = {
      title: c.title,
      dateRange: c.dateRange || "",
      date: parseStartDate(c.dateRange),
    };
    if (c.location) d.location = c.location;
    if (c.talk) d.talk = c.talk;
    if (c.poster) d.poster = c.poster;
    if (c.attendees) d.attendees = c.attendees;
    if (c.awards) d.awards = c.awards;
    if (isHttp(c.photos)) d.galleryLink = c.photos;
    await createEntry(confId, { data: d, status: "published" });
  }
  console.log(`Conferences: ${data.conferences.length}`);

  // ---- Outreach ----
  const outId = await collId("outreach");
  await wipe("outreach", outId);
  for (const o of data.outreach) {
    const d: Record<string, unknown> = {
      title: o.title,
      date: parseStartDate(o.dates),
    };
    if (o.location) d.location = o.location;
    const desc = [o.fellow ? `Fellow: ${o.fellow}` : "", o.role].filter(Boolean).join(" — ");
    if (desc) d.description = desc;
    if (isHttp(o.photos)) d.galleryLink = o.photos;
    await createEntry(outId, { data: d, status: "published" });
  }
  console.log(`Outreach: ${data.outreach.length}`);

  // ---- Events ----
  const evId = await collId("events");
  await wipe("events", evId);
  for (const e of data.events) {
    const date = DATE_OVERRIDE[e.title] || parseStartDate(e.dateRange);
    const status = date >= TODAY ? "upcoming" : "concluded";
    const d: Record<string, unknown> = {
      title: e.title,
      dateRange: DATERANGE_OVERRIDE[e.title] || e.dateRange || "",
      date,
      status,
      image: eventImage(e.title),
    };
    if (e.location) d.location = e.location;
    if (e.shortDescription) d.shortDescription = e.shortDescription;
    if (e.description) d.description = e.description;
    if (isHttp(e.link)) d.link = e.link;
    // gallery folder can live in either the Link or Photos column
    const gallery = [e.photos, e.link].find((v: string) => isHttp(v) && /drive\.google|dropbox/i.test(v));
    if (gallery && gallery !== d.link) d.galleryLink = gallery;
    if (isHttp(e.lectures)) d.lectures = [{ title: "Lecture slides", url: e.lectures }];
    await createEntry(evId, { data: d, status: "published" });
  }
  console.log(`Events: ${data.events.length}`);

  // Attach any downloaded gallery images (drop them in frontend/public/galleries/<slug>/)
  await wireGalleries("conferences", confId);
  await wireGalleries("outreach", outId);
  await wireGalleries("events", evId);

  console.log("Import complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
