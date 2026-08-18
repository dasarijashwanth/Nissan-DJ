import sharp from "sharp";
import { mkdirSync } from "fs";

const OUT_DIR = "public/icons";
mkdirSync(OUT_DIR, { recursive: true });

function svg(size) {
  const fontSize = Math.round(size * 0.42);
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#4f46e5" />
  <text x="50%" y="50%" dy="0.35em" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="${fontSize}" fill="#ffffff">ST</text>
</svg>`;
}

async function run() {
  for (const size of [192, 512]) {
    await sharp(Buffer.from(svg(size))).png().toFile(`${OUT_DIR}/icon-${size}.png`);
    console.log(`Generated icon-${size}.png`);
  }
}

run();
