/**
 * scripts/generate-favicons.mjs
 * Génère toutes les tailles de favicon à partir de public/favicon.png
 * Usage : node scripts/generate-favicons.mjs
 */

import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __dir = dirname(fileURLToPath(import.meta.url));
const pub   = join(__dir, "..", "public");
const src   = join(pub, "favicon.png");

if (!existsSync(src)) {
  console.error("❌ public/favicon.png introuvable");
  process.exit(1);
}

const sizes = [
  { file: "favicon-16x16.png",           size: 16  },
  { file: "favicon-32x32.png",           size: 32  },
  { file: "apple-touch-icon.png",        size: 180 },
  { file: "android-chrome-192x192.png",  size: 192 },
  { file: "android-chrome-512x512.png",  size: 512 },
];

for (const { file, size } of sizes) {
  await sharp(src)
    .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(join(pub, file));
  console.log(`✅ ${file} (${size}x${size})`);
}

// favicon.ico = 32x32 PNG renommé (les navigateurs modernes acceptent un PNG)
await sharp(src)
  .resize(32, 32, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toFile(join(__dir, "..", "app", "favicon.ico"));
console.log("✅ app/favicon.ico (32x32)");

console.log("\n🎉 Favicons générés avec succès !");
