/**
 * Import Stitch light-dossier avatar sheets into public/avatars/avatar-XX.webp
 *
 * Sheets (from stitch project 7822900312632106893):
 *   light-01..03 → 3×2 grids (18 portraits)
 *   light-pair   → 2 large circular portraits (avatars 18–19)
 *
 * Each export is a square crop of the Stitch circular portrait art
 * (circle frame is part of the bitmap). UI should scale with object-contain,
 * not CSS-mask/cover-crop into a second circle.
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

async function exportSquare(input, left, top, size, outPath) {
  const meta = await sharp(input).metadata();
  const w = meta.width ?? size;
  const h = meta.height ?? size;
  const safeLeft = Math.max(0, Math.min(left, w - 1));
  const safeTop = Math.max(0, Math.min(top, h - 1));
  const safeSize = Math.min(size, w - safeLeft, h - safeTop);
  await sharp(input)
    .extract({ left: safeLeft, top: safeTop, width: safeSize, height: safeSize })
    .resize(OUT_SIZE, OUT_SIZE, { kernel: "lanczos3", fit: "fill" })
    .ensureAlpha()
    .webp({ quality: 92 })
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
        await exportSquare(srcPath, left, top, size, stagedPath);
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
    await exportSquare(pairPath, left, top, size, stagedPath);
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
  console.log(`Imported ${idx} Stitch light-dossier avatars`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
