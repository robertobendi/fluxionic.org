/**
 * Generates favicon PNG sizes (16x16, 32x32) from public/slatestack.png
 * for use as website icons. Run: pnpm exec tsx scripts/generate-favicon.ts
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const source = path.join(publicDir, "slatestack.png");
const sizes = [16, 32] as const;

async function main() {
  for (const size of sizes) {
    const out = path.join(publicDir, `favicon-${size}.png`);
    await sharp(source)
      .resize(size, size)
      .png()
      .toFile(out);
    console.log(`Wrote ${out}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
