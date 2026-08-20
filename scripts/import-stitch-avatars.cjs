/**
 * Import Stitch light-dossier avatar sheets into public/avatars/avatar-XX.webp
 *
 * Sheets (from stitch project 7822900312632106893):
 *   light-01..03 → 3×2 grids (18 portraits)
 *   dark-pair    → 2×1 (2 portraits, lightly lifted for Ledger)
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const importDir = path.join(__dirname, "../public/avatars/stitch-import");
const sourceDir = path.join(__dirname, "../public/avatars/source");
const outDir = path.join(__dirname, "../public/avatars");
const OUT_SIZE = 256;
const MANILA = [232, 220, 200];

const SHEETS = [
  { file: "light-01.png", cols: 3, rows: 2, labelPadTop: 0.12, labelPadBottom: 0.34 },
  { file: "light-02.png", cols: 3, rows: 2, labelPadTop: 0.18, labelPadBottom: 0.30 },
  { file: "light-03.png", cols: 3, rows: 2, labelPadTop: 0.12, labelPadBottom: 0.34 },
  { file: "dark-pair.png", cols: 2, rows: 1, labelPadTop: 0.06, labelPadBottom: 0.06, lighten: true },
];

function lightenRaw(data) {
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const isCrimson =
      r > 110 && r > g * 1.35 && r > b * 1.35 && sat > 0.35;
    if (!isCrimson) {
      const lift = lum < 28 ? 0.7 : lum < 70 ? 0.48 : lum < 130 ? 0.32 : 0.12;
      r = Math.min(255, r + (255 - r) * lift + 20);
      g = Math.min(255, g + (255 - g) * lift + 16);
      b = Math.min(255, b + (255 - b) * lift + 10);
      if (lum < 160) {
        const t = (1 - lum / 160) * 0.45;
        r = Math.round(r * (1 - t) + MANILA[0] * t);
        g = Math.round(g * (1 - t) + MANILA[1] * t);
        b = Math.round(b * (1 - t) + MANILA[2] * t);
      }
    }
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

async function exportCell(input, left, top, size, outPath, lighten) {
  let pipeline = sharp(input)
    .extract({ left, top, width: size, height: size })
    .resize(OUT_SIZE, OUT_SIZE, { kernel: "lanczos3" })
    .ensureAlpha();

  if (lighten) {
    const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
    lightenRaw(data);
    await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .webp({ quality: 92 })
      .toFile(outPath);
    return;
  }

  await pipeline.webp({ quality: 92 }).toFile(outPath);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(sourceDir, { recursive: true });

  // Stage to avoid OneDrive locks on overwrite.
  const stageDir = path.join(outDir, `_stage_${Date.now()}`);
  fs.mkdirSync(stageDir, { recursive: true });

  let idx = 0;
  const staged = [];

  for (const sheet of SHEETS) {
    const srcPath = path.join(importDir, sheet.file);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing sheet: ${srcPath}`);
    }
    // Keep a copy under source/ for future regenerations.
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
        const padX = Math.floor(cellW * 0.08);
        const availW = cellW - padX * 2;
        const availH = cellH - padTop - padBottom;
        const size = Math.min(availW, availH);
        const left = col * cellW + Math.floor((cellW - size) / 2);
        const top = row * cellH + padTop + Math.floor((availH - size) / 2);
        const name = `avatar-${String(idx).padStart(2, "0")}.webp`;
        const stagedPath = path.join(stageDir, name);
        await exportCell(srcPath, left, top, size, stagedPath, !!sheet.lighten);
        staged.push(name);
        idx++;
      }
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
  console.log(`Imported ${idx} Stitch avatars`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
