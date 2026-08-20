/**
 * Lift noir portraits toward Ledger (manila paper) readability.
 * Re-run after regenerating splits from source sheets.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const outDir = path.join(__dirname, "../public/avatars");
const tmpDir = path.join(outDir, "_lightened");
const SIZE = 256;
const MANILA = [232, 220, 200];

async function lightenToBuffer(inputPath) {
  const { data, info } = await sharp(inputPath)
    .resize(SIZE, SIZE, { kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const isCrimsonAccent =
      r > 110 && r > g * 1.35 && r > b * 1.35 && sat > 0.35;

    if (!isCrimsonAccent) {
      const lift = lum < 28 ? 0.72 : lum < 70 ? 0.5 : lum < 120 ? 0.28 : 0.12;
      r = Math.min(255, r + (255 - r) * lift + 22);
      g = Math.min(255, g + (255 - g) * lift + 18);
      b = Math.min(255, b + (255 - b) * lift + 10);

      if (lum < 150) {
        const t = (1 - lum / 150) * 0.42;
        r = Math.round(r * (1 - t) + MANILA[0] * t);
        g = Math.round(g * (1 - t) + MANILA[1] * t);
        b = Math.round(b * (1 - t) + MANILA[2] * t);
      }
    } else {
      r = Math.min(255, r + 12);
      g = Math.min(255, g + 4);
      b = Math.min(255, b + 4);
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .webp({ quality: 92 })
    .toBuffer();
}

async function main() {
  fs.mkdirSync(tmpDir, { recursive: true });
  const files = fs
    .readdirSync(outDir)
    .filter((f) => /^avatar-\d+\.webp$/.test(f))
    .sort();

  for (const file of files) {
    const buf = await lightenToBuffer(path.join(outDir, file));
    fs.writeFileSync(path.join(tmpDir, file), buf);
    process.stdout.write(`lightened ${file}\n`);
  }

  for (const file of files) {
    fs.copyFileSync(path.join(tmpDir, file), path.join(outDir, file));
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`Done — ${files.length} avatars`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
