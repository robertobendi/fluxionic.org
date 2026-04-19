import { nanoid } from "nanoid";
import { db } from "../../shared/database/index.js";
import { mediaFile } from "../../shared/database/schema.js";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { eq, or, ilike, sql, desc, count, inArray, sum } from "drizzle-orm";
import type { MediaFileInput, MediaFileResponse, MediaVariants, ImageVariant } from "./media.types.js";

const VARIANT_SIZES: Array<{ name: keyof MediaVariants; width: number }> = [
  { name: "thumbnail", width: 200 },
  { name: "medium", width: 800 },
  { name: "large", width: 1600 },
];

const SKIP_VARIANT_TYPES = new Set(["image/gif", "image/svg+xml"]);

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "audio/mpeg",
];

const TYPE_FILTERS: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  document: ["application/pdf"],
  video: ["video/mp4"],
  audio: ["audio/mpeg"],
};

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  uploadedBy: string
): Promise<MediaFileResponse> {
  // Validate file type using magic numbers
  const detectedType = await fileTypeFromBuffer(buffer);
  if (!detectedType || !ALLOWED_TYPES.includes(detectedType.mime)) {
    throw new Error(
      `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`
    );
  }

  // Use detected MIME type instead of declared
  const validatedMimeType = detectedType.mime;

  // Generate unique filename
  const filename = generateUniqueFilename(originalName);

  // Get upload directory for current date
  const uploadDir = await getUploadDir();
  const filePath = path.join(uploadDir, filename);

  // Write original file to disk
  await fs.writeFile(filePath, buffer);

  const fileData: MediaFileInput = {
    filename,
    originalName,
    mimeType: validatedMimeType,
    size: buffer.length,
    path: filePath,
    uploadedBy,
  };

  // Process images
  if (validatedMimeType.startsWith("image/")) {
    const processed = await processImage(filePath, validatedMimeType);
    fileData.width = processed.width;
    fileData.height = processed.height;
    fileData.thumbnailPath = processed.variants.thumbnail
      ? filePathFromUrl(processed.variants.thumbnail.url)
      : undefined;
    fileData.variants = processed.variants;
  }

  // Insert into database
  const [inserted] = await db
    .insert(mediaFile)
    .values({
      id: nanoid(),
      ...fileData,
    })
    .returning();

  return toMediaFileResponse(inserted);
}

/**
 * Generate WebP variants at thumbnail/medium/large widths. Original file is
 * preserved untouched. For small images we skip upscaling: if the source is
 * narrower than a target width, we clamp to source width instead.
 */
export async function processImage(
  filePath: string,
  mimeType: string
): Promise<{ width: number; height: number; variants: MediaVariants }> {
  const image = sharp(filePath, { failOn: "none" });
  const metadata = await image.metadata();
  const srcWidth = metadata.width || 0;
  const srcHeight = metadata.height || 0;

  const variants: MediaVariants = {};

  if (SKIP_VARIANT_TYPES.has(mimeType)) {
    return { width: srcWidth, height: srcHeight, variants };
  }

  for (const { name, width } of VARIANT_SIZES) {
    const targetWidth = srcWidth > 0 ? Math.min(width, srcWidth) : width;
    const variantPath = filePath.replace(/\.[^.]+$/, `-${name}.webp`);
    try {
      const info = await sharp(filePath, { failOn: "none" })
        .resize({ width: targetWidth, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(variantPath);
      variants[name] = {
        url: buildMediaUrl(variantPath),
        width: info.width,
        height: info.height,
        format: "webp",
        size: info.size,
      };
    } catch (err) {
      // Leave the variant out on failure; original is still stored.
      // eslint-disable-next-line no-console
      console.warn(`Variant '${name}' failed for ${filePath}:`, err);
    }
  }

  return { width: srcWidth, height: srcHeight, variants };
}

/**
 * Convert a /uploads/... URL back to the filesystem path. Used to keep the
 * legacy thumbnailPath column populated.
 */
function filePathFromUrl(url: string): string {
  if (url.startsWith("/uploads/")) {
    return path.join(process.env.UPLOAD_DIR || "./uploads", url.slice("/uploads/".length));
  }
  return url;
}

async function getUploadDir(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");

  const uploadDir = path.join(process.env.UPLOAD_DIR || "./uploads", year, month);

  // Create directory if it doesn't exist
  await fs.mkdir(uploadDir, { recursive: true });

  return uploadDir;
}

function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const randomBytes = crypto.randomBytes(16).toString("hex");
  return `${randomBytes}${ext}`;
}

function buildMediaUrl(filePath: string): string {
  // Convert absolute path to relative URL
  // e.g., ./uploads/2026/01/abc123.jpg -> /uploads/2026/01/abc123.jpg
  const normalized = filePath.replace(/\\/g, "/");
  const uploadsIndex = normalized.indexOf("uploads/");
  if (uploadsIndex !== -1) {
    return "/" + normalized.substring(uploadsIndex);
  }
  return filePath;
}

function toMediaFileResponse(row: typeof mediaFile.$inferSelect): MediaFileResponse {
  const variants = row.variants as MediaVariants | null;
  return {
    id: row.id,
    filename: row.filename,
    originalName: row.originalName,
    mimeType: row.mimeType,
    size: row.size,
    width: row.width,
    height: row.height,
    altText: row.altText,
    path: row.path,
    thumbnailPath: row.thumbnailPath,
    url: buildMediaUrl(row.path),
    thumbnailUrl: row.thumbnailPath ? buildMediaUrl(row.thumbnailPath) : null,
    variants: variants ?? null,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listMedia(params: {
  page?: string;
  limit?: string;
  type?: string;
  q?: string;
}): Promise<{
  data: MediaFileResponse[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}> {
  // Parse and validate pagination params
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || "20", 10)));
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [];

  // Filter by type category
  if (params.type && TYPE_FILTERS[params.type]) {
    conditions.push(inArray(mediaFile.mimeType, TYPE_FILTERS[params.type]));
  }

  // Search by filename or altText
  if (params.q) {
    const searchTerm = `%${params.q}%`;
    conditions.push(
      or(
        ilike(mediaFile.filename, searchTerm),
        ilike(mediaFile.originalName, searchTerm),
        ilike(mediaFile.altText, searchTerm)
      )
    );
  }

  // Build query
  const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(mediaFile)
    .where(whereClause);

  // Get paginated results
  const results = await db
    .select()
    .from(mediaFile)
    .where(whereClause)
    .orderBy(desc(mediaFile.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    data: results.map(toMediaFileResponse),
    meta: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
}

export async function getMedia(id: string): Promise<MediaFileResponse> {
  const [result] = await db
    .select()
    .from(mediaFile)
    .where(eq(mediaFile.id, id));

  if (!result) {
    throw new Error("Media file not found");
  }

  return toMediaFileResponse(result);
}

export async function getImageInfo(
  mediaId: string
): Promise<{ width: number; height: number; format: string }> {
  // Fetch media file
  const [file] = await db
    .select()
    .from(mediaFile)
    .where(eq(mediaFile.id, mediaId));

  if (!file) {
    throw new Error("Media file not found");
  }

  // Validate it's an image
  if (!file.mimeType.startsWith("image/")) {
    throw new Error("Only image files have dimensions");
  }

  // Get image metadata
  const image = sharp(file.path);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new Error("Unable to read image metadata");
  }

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  };
}

export async function updateMedia(
  id: string,
  updates: { altText?: string }
): Promise<MediaFileResponse> {
  const [result] = await db
    .update(mediaFile)
    .set({
      altText: updates.altText,
      updatedAt: new Date(),
    })
    .where(eq(mediaFile.id, id))
    .returning();

  if (!result) {
    throw new Error("Media file not found");
  }

  return toMediaFileResponse(result);
}

export async function deleteMedia(id: string): Promise<void> {
  // Fetch media file to get paths
  const [file] = await db
    .select()
    .from(mediaFile)
    .where(eq(mediaFile.id, id));

  if (!file) {
    throw new Error("Media file not found");
  }

  // Delete files from disk
  try {
    // Delete original file
    await fs.unlink(file.path);

    // Delete WebP version if it's an image
    if (file.mimeType.startsWith("image/")) {
      const webpPath = file.path.replace(/\.[^.]+$/, ".webp");
      try {
        await fs.unlink(webpPath);
      } catch (error) {
        // WebP might not exist for some images
      }
    }

    // Delete thumbnail if it exists
    if (file.thumbnailPath) {
      try {
        await fs.unlink(file.thumbnailPath);
      } catch (error) {
        // Thumbnail might not exist
      }
    }
  } catch (error) {
    // Log error but continue with database deletion
    console.error("Error deleting files:", error);
  }

  // Delete database record
  await db.delete(mediaFile).where(eq(mediaFile.id, id));
}

export async function cropImage(
  mediaId: string,
  left: number,
  top: number,
  width: number,
  height: number,
  uploadedBy: string
): Promise<MediaFileResponse> {
  // Fetch original media file
  const [original] = await db
    .select()
    .from(mediaFile)
    .where(eq(mediaFile.id, mediaId));

  if (!original) {
    throw new Error("Media file not found");
  }

  // Validate it's an image
  if (!original.mimeType.startsWith("image/")) {
    throw new Error("Only image files can be cropped");
  }

  // Load image to get metadata and validate crop coordinates
  const image = sharp(original.path);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read image dimensions");
  }

  // Validate crop coordinates are within bounds
  if (
    left < 0 ||
    top < 0 ||
    width <= 0 ||
    height <= 0 ||
    left + width > metadata.width ||
    top + height > metadata.height
  ) {
    throw new Error(
      `Invalid crop coordinates. Image dimensions: ${metadata.width}x${metadata.height}, crop: ${left},${top},${width},${height}`
    );
  }

  // Generate unique filename for cropped image
  const cropFilename = generateUniqueFilename(original.originalName);
  const uploadDir = await getUploadDir();
  const cropPath = path.join(uploadDir, cropFilename);

  // Extract region and convert to WebP
  await image
    .extract({ left, top, width, height })
    .toFormat("webp")
    .toFile(cropPath);

  // Generate thumbnail for cropped image
  const thumbnailPath = cropPath.replace(/\.[^.]+$/, "-thumb.webp");
  await sharp(cropPath)
    .resize(200, 200, { fit: "cover" })
    .webp()
    .toFile(thumbnailPath);

  // Get file size
  const stats = await fs.stat(cropPath);

  // Create new media record (original preserved)
  const fileData: MediaFileInput = {
    filename: cropFilename,
    originalName: `cropped-${original.originalName}`,
    mimeType: "image/webp",
    size: stats.size,
    width,
    height,
    path: cropPath,
    thumbnailPath,
    uploadedBy,
  };

  const [inserted] = await db
    .insert(mediaFile)
    .values({
      id: nanoid(),
      ...fileData,
    })
    .returning();

  return toMediaFileResponse(inserted);
}

export async function getStorageStats(): Promise<{
  total: number;
  breakdown: {
    images: number;
    videos: number;
    documents: number;
    audio: number;
  };
}> {
  // Get total storage
  const [{ totalBytes }] = await db
    .select({ totalBytes: sum(mediaFile.size) })
    .from(mediaFile);

  // Get breakdown by category using existing TYPE_FILTERS
  const breakdown = {
    images: 0,
    videos: 0,
    documents: 0,
    audio: 0,
  };

  for (const [category, mimeTypes] of Object.entries(TYPE_FILTERS)) {
    const [{ categoryTotal }] = await db
      .select({ categoryTotal: sum(mediaFile.size) })
      .from(mediaFile)
      .where(inArray(mediaFile.mimeType, mimeTypes));

    // Map 'image' -> 'images', 'document' -> 'documents' for plural category names
    const pluralKey = category === 'image' ? 'images' :
                      category === 'document' ? 'documents' :
                      category === 'video' ? 'videos' : 'audio';
    breakdown[pluralKey] = Number(categoryTotal) || 0;
  }

  return {
    total: Number(totalBytes) || 0,
    breakdown,
  };
}
