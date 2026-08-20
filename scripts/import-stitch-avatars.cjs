/**
 * Import Stitch light-dossier avatar sheets into public/avatars/avatar-XX.webp
 *
 * Sheets (from stitch project 7822900312632106893):
 *   light-01..03 → 3×2 grids (18 portraits)
 *   light-pair   → 2 large circular portraits (avatars 18–19)
 *
 * Exports are circle-masked WebPs: opaque circular mugshot + transparent outside.
 * Do not leave parchment corners baked into the bitmap.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const importDir = path.join(__dirname, "../public/avatars/stitch-import");
const sourceDir = path.join(__dirname, "../public/avatars/source");
const outDir = path.join(__dirname, "../public/avatars");
const OUT_SIZE = 256;

/** 3×2 labeled grids: pad away dossier labels, keep full circular frame. */
const GRID_SHEETS = [
  { file: "light-01.png", cols: 3, rows: 2, labelPadTop: 0.10, labelPadBottom: 0.32 },
  { file: "light-02.png", cols: 3, rows: 2, labelPadTop: 0.16, labelPadBottom: 0.28 },
  { file: "light-03.png", cols: 3, rows: 2, labelPadTop: 0.10, labelPadBottom: 0.32 },
];

/**
 * Large pair on light-pair.png (dossier portfolio 19/20).
 * Centers/radii from ring detection; pad keeps the black frame intact.
 */
const LIGHT_PAIR = {
  file: "light-pair.png",
  portraits: [
    { cx: 354, cy: 268, rad: 136 },
    { cx: 664, cy: 268, rad: 135 },
  ],
  /** Keep ring intact but stay above dossier labels under the circles. */
  pad: 6,
};

function isParchment(r, g, b, corner) {
  const dr = r - corner[0];
  const dg = g - corner[1];
  const db = b - corner[2];
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return dist < 42 && lum > 150;
}

/**
 * Find outer radius of the ink ring by scanning inward from the four edge midpoints.
 * Returns radius in pixels from image center to outer edge of the circle art.
 */
function detectCircleRadius(data, width, height) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const corner = [
    data[0],
    data[1],
    data[2],
  ];

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
      // Hit ink ring (or dark silhouette at the rim)
      if (!isParchment(r, g, b, corner) && lum < 90) {
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
    return Math.min(width, height) / 2;
  }
  // Prefer the tightest reliable ring (exclude outliers from labels/seals)
  hits.sort((a, b) => a - b);
  const median = hits[Math.floor(hits.length / 2)];
  return median;
}

async function exportCircle(input, left, top, size, outPath) {
  const meta = await sharp(input).metadata();
  const w = meta.width ?? size;
  const h = meta.height ?? size;
  const safeLeft = Math.max(0, Math.min(left, w - 1));
  const safeTop = Math.max(0, Math.min(top, h - 1));
  const safeSize = Math.min(size, w - safeLeft, h - safeTop);

  const { data, info } = await sharp(input)
    .extract({ left: safeLeft, top: safeTop, width: safeSize, height: safeSize })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ringR = detectCircleRadius(data, info.width, info.height);
  // Tight square around the circle, keep 2px of ring edge
  const pad = 2;
  const cropR = Math.min(
    ringR + pad,
    info.width / 2,
    info.height / 2
  );
  const cropSize = Math.max(8, Math.floor(cropR * 2));
  const cropLeft = Math.max(0, Math.round((info.width - cropSize) / 2));
  const cropTop = Math.max(0, Math.round((info.height - cropSize) / 2));
  const finalSize = Math.min(cropSize, info.width - cropLeft, info.height - cropTop);

  // Build tight RGBA crop then circular soft mask
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
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(sourceDir, { recursive: true });

  // Stage to avoid OneDrive locks on overwrite.
  const stageDir = path.join(outDir, `_stage_${Date.now()}`);
  fs.mkdirSync(stageDir, { recursive: true });

  let idx = 0;
  const staged = [];

  for (const sheet of GRID_SHEETS) {
    const srcPath = path.join(importDir, sheet.file);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing sheet: ${srcPath}`);
    }
    fs.copyFileSync(srcPath, path.join(sourceDir, `stitch-${sheet.file}`));

    const meta = await sharp(srcPath).metadata();
    const w = meta.width ?? 1024;
    const h = meta.height ?? 1024;
    const cellW = Math.floor(w / sheet.cols);
    const cellH = Math.floor(h / sheet.rows);

    for (let row = 0; row < sheet.rows; row++) {
      for (let col = 0; col < sheet.cols; col++) {
        const padTop = Math.floor(cellH * sheet.labelPadTop);
        const padBottom = Math.floor(cellH * sheet.labelPadBottom);
        const padX = Math.floor(cellW * 0.06);
        const availW = cellW - padX * 2;
        const availH = cellH - padTop - padBottom;
        const size = Math.min(availW, availH);
        const left = col * cellW + Math.floor((cellW - size) / 2);
        const top = row * cellH + padTop + Math.floor((availH - size) / 2);
        const name = `avatar-${String(idx).padStart(2, "0")}.webp`;
        const stagedPath = path.join(stageDir, name);
        await exportCircle(srcPath, left, top, size, stagedPath);
        staged.push(name);
        idx++;
      }
    }
  }

  const pairPath = path.join(importDir, LIGHT_PAIR.file);
  if (!fs.existsSync(pairPath)) {
    throw new Error(`Missing sheet: ${pairPath}`);
  }
  fs.copyFileSync(pairPath, path.join(sourceDir, "stitch-light-pair.png"));

  for (const p of LIGHT_PAIR.portraits) {
    const size = Math.round((p.rad + LIGHT_PAIR.pad) * 2);
    const left = Math.round(p.cx - size / 2);
    const top = Math.round(p.cy - size / 2);
    const name = `avatar-${String(idx).padStart(2, "0")}.webp`;
    const stagedPath = path.join(stageDir, name);
    await exportCircle(pairPath, left, top, size, stagedPath);
    staged.push(name);
    idx++;
  }

  // Remove obsolete dark-pair source if present.
  const darkSrc = path.join(sourceDir, "stitch-dark-pair.png");
  if (fs.existsSync(darkSrc)) {
    try {
      fs.unlinkSync(darkSrc);
    } catch {
      /* ignore OneDrive lock */
    }
  }

  if (idx !== 20) {
    console.warn(`Expected 20 avatars, got ${idx}`);
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
  console.log(`Imported ${idx} Stitch light-dossier circle avatars`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
