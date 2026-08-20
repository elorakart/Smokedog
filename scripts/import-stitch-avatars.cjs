/**
 * Import Stitch circular mugshots into public/avatars/avatar-XX.webp
 *
 * Source (stitch project 16728949405283163881):
 *   public/avatars/stitch-import/circles/circle-00.png … circle-19.png
 *   Each is a 512×512 square with one centered circular portrait on cream.
 *
 * Exports are circle-masked WebPs: opaque circular mugshot + transparent outside.
 * Do not leave parchment/cream corners baked into the bitmap.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const importDir = path.join(__dirname, "../public/avatars/stitch-import/circles");
const sourceDir = path.join(__dirname, "../public/avatars/source");
const outDir = path.join(__dirname, "../public/avatars");
const OUT_SIZE = 256;
const EXPECTED = 20;

function isCream(r, g, b, corner) {
  const dr = r - corner[0];
  const dg = g - corner[1];
  const db = b - corner[2];
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return dist < 48 && lum > 140;
}

/**
 * Find outer radius of the ink ring by scanning inward from the four edge midpoints.
 */
function detectCircleRadius(data, width, height) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const corner = [data[0], data[1], data[2]];

  const sample = (x, y) => {
    const ix = Math.max(0, Math.min(width - 1, Math.round(x)));
    const iy = Math.max(0, Math.min(height - 1, Math.round(y)));
    const i = (iy * width + ix) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const scanInward = (sx, sy, dx, dy, maxSteps) => {
    for (let step = 0; step < maxSteps; step++) {
      const x = sx + dx * step;
      const y = sy + dy * step;
      const [r, g, b] = sample(x, y);
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (!isCream(r, g, b, corner) && lum < 100) {
        return Math.hypot(x - cx, y - cy);
      }
    }
    return null;
  };

  const maxSteps = Math.ceil(Math.min(width, height) / 2);
  const hits = [
    scanInward(cx, 0, 0, 1, maxSteps),
    scanInward(cx, height - 1, 0, -1, maxSteps),
    scanInward(0, cy, 1, 0, maxSteps),
    scanInward(width - 1, cy, -1, 0, maxSteps),
  ].filter((v) => v != null && v > 8);

  if (hits.length === 0) {
    return Math.min(width, height) / 2 - 4;
  }
  hits.sort((a, b) => a - b);
  return hits[Math.floor(hits.length / 2)];
}

async function exportCircle(inputPath, outPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ringR = detectCircleRadius(data, info.width, info.height);
  const pad = 2;
  const cropR = Math.min(ringR + pad, info.width / 2, info.height / 2);
  const cropSize = Math.max(8, Math.floor(cropR * 2));
  const cropLeft = Math.max(0, Math.round((info.width - cropSize) / 2));
  const cropTop = Math.max(0, Math.round((info.height - cropSize) / 2));
  const finalSize = Math.min(cropSize, info.width - cropLeft, info.height - cropTop);

  const cropped = Buffer.alloc(finalSize * finalSize * 4);
  for (let y = 0; y < finalSize; y++) {
    for (let x = 0; x < finalSize; x++) {
      const si = ((cropTop + y) * info.width + (cropLeft + x)) * 4;
      const di = (y * finalSize + x) * 4;
      cropped[di] = data[si];
      cropped[di + 1] = data[si + 1];
      cropped[di + 2] = data[si + 2];
      cropped[di + 3] = data[si + 3];
    }
  }

  const cx = (finalSize - 1) / 2;
  const cy = (finalSize - 1) / 2;
  const r = finalSize / 2 - 0.5;
  for (let y = 0; y < finalSize; y++) {
    for (let x = 0; x < finalSize; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      const i = (y * finalSize + x) * 4;
      if (dist > r) {
        cropped[i + 3] = 0;
      } else if (dist > r - 1.25) {
        const a = Math.max(0, Math.min(1, r - dist));
        cropped[i + 3] = Math.round(cropped[i + 3] * a);
      }
    }
  }

  await sharp(cropped, {
    raw: { width: finalSize, height: finalSize, channels: 4 },
  })
    .resize(OUT_SIZE, OUT_SIZE, { kernel: "lanczos3", fit: "fill" })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(outPath);

  return { ringR, finalSize };
}

async function main() {
  if (!fs.existsSync(importDir)) {
    throw new Error(`Missing import dir: ${importDir}`);
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(sourceDir, { recursive: true });

  const stageDir = path.join(outDir, `_stage_${Date.now()}`);
  fs.mkdirSync(stageDir, { recursive: true });

  const files = [];
  for (let i = 0; i < EXPECTED; i++) {
    const name = `circle-${String(i).padStart(2, "0")}.png`;
    const srcPath = path.join(importDir, name);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing circle: ${srcPath}`);
    }
    files.push({ idx: i, srcPath, name });
  }

  const staged = [];
  for (const f of files) {
    const destName = `avatar-${String(f.idx).padStart(2, "0")}.webp`;
    const stagedPath = path.join(stageDir, destName);
    const stats = await exportCircle(f.srcPath, stagedPath);
    fs.copyFileSync(f.srcPath, path.join(sourceDir, `stitch-circle-${String(f.idx).padStart(2, "0")}.png`));
    staged.push(destName);
    console.log(
      `${destName} ringR=${stats.ringR.toFixed(1)} crop=${stats.finalSize}`
    );
  }

  // Drop obsolete light-sheet sources from the previous project import.
  for (const obsolete of [
    "stitch-light-01.png",
    "stitch-light-02.png",
    "stitch-light-03.png",
    "stitch-light-pair.png",
    "stitch-dark-pair.png",
  ]) {
    const p = path.join(sourceDir, obsolete);
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch {
        /* OneDrive lock */
      }
    }
  }

  for (const name of staged) {
    const dest = path.join(outDir, name);
    const src = path.join(stageDir, name);
    try {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    } catch {
      /* overwrite via write */
    }
    fs.writeFileSync(dest, fs.readFileSync(src));
  }
  fs.rmSync(stageDir, { recursive: true, force: true });
  console.log(`Imported ${staged.length} Stitch circular mugshots (project 16728949405283163881)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
