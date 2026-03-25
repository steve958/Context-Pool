/**
 * generate-icons.mjs
 *
 * Converts icon.svg → PNG sizes + favicon.ico
 * Run once after any icon design change:
 *   node scripts/generate-icons.mjs
 *
 * Requires: npm install --save-dev sharp
 */

import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const pub = resolve(__dir, "../public");

const iconSvg   = readFileSync(resolve(pub, "icon.svg"));
const faviconSvg = readFileSync(resolve(pub, "favicon.svg"));

const sizes = [16, 32, 48, 64, 128, 180, 192, 512];

console.log("Generating PNG icons from icon.svg…");
for (const size of sizes) {
  const src = size <= 64 ? faviconSvg : iconSvg;
  await sharp(src)
    .resize(size, size)
    .png()
    .toFile(resolve(pub, `icon-${size}.png`));
  console.log(`  ✓ icon-${size}.png`);
}

// apple-touch-icon (180×180) as standard filename
await sharp(iconSvg).resize(180, 180).png().toFile(resolve(pub, "apple-touch-icon.png"));
console.log("  ✓ apple-touch-icon.png");

// icon.png (512×512 for PWA manifest)
await sharp(iconSvg).resize(512, 512).png().toFile(resolve(pub, "icon.png"));
console.log("  ✓ icon.png");

// favicon.ico — pack 16, 32, 48 px PNG images into a .ico file
// ICO format: header(6) + N*directory(16) + N*image_data
const icoSizes = [16, 32, 48];
const pngs = await Promise.all(
  icoSizes.map((s) =>
    sharp(faviconSvg).resize(s, s).png().toBuffer()
  )
);

// Build ICO binary
const HEADER_SIZE = 6;
const DIR_ENTRY_SIZE = 16;
const headerAndDir = HEADER_SIZE + icoSizes.length * DIR_ENTRY_SIZE;

let offset = headerAndDir;
const offsets = pngs.map((buf) => {
  const o = offset;
  offset += buf.length;
  return o;
});

const icoBuffer = Buffer.alloc(offset);
// ICO header: reserved=0, type=1 (ICO), count=N
icoBuffer.writeUInt16LE(0, 0);
icoBuffer.writeUInt16LE(1, 2);
icoBuffer.writeUInt16LE(icoSizes.length, 4);

// Directory entries
for (let i = 0; i < icoSizes.length; i++) {
  const base = HEADER_SIZE + i * DIR_ENTRY_SIZE;
  icoBuffer.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], base);      // width (0=256)
  icoBuffer.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], base + 1);  // height
  icoBuffer.writeUInt8(0, base + 2);   // colour count (0 = no palette)
  icoBuffer.writeUInt8(0, base + 3);   // reserved
  icoBuffer.writeUInt16LE(1, base + 4); // colour planes
  icoBuffer.writeUInt16LE(32, base + 6); // bits per pixel
  icoBuffer.writeUInt32LE(pngs[i].length, base + 8); // image size
  icoBuffer.writeUInt32LE(offsets[i], base + 12);    // image offset
}

// Copy PNG data
for (let i = 0; i < pngs.length; i++) {
  pngs[i].copy(icoBuffer, offsets[i]);
}

writeFileSync(resolve(pub, "favicon.ico"), icoBuffer);
console.log("  ✓ favicon.ico (16+32+48 px)");

console.log("\nAll icons generated successfully.");
