const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const sourceDir = path.join(__dirname, "../public/avatars/source");
const outDir = path.join(__dirname, "../public/avatars");
const OUT_SIZE = 256;
const MANILA = [232, 220, 200];

const SHEETS = [
  { file: "sheet-01.png", cols: 3, rows: 2 },
  { file: "sheet-02.png", cols: 3, rows: 2 },
  { file: "sheet-03.png", cols: 3, rows: 2 },
  { file: "sheet-05.png", cols: 2, rows: 1 },
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
    const isCrimsonAccent =
      r > 110 && r > g * 1.35 && r > b * 1.35 && sat > 0.35;

    if (!isCrimsonAccent) {
      const lift = lum < 28 ? 0.78 : lum < 70 ? 0.58 : lum < 130 ? 0.4 : 0.18;
      r = Math.min(255, r + (255 - r) * lift + 26);
      g = Math.min(255, g + (255 - g) * lift + 22);
      b = Math.min(255, b + (255 - b) * lift + 14);

      if (lum < 165) {
        const t = (1 - lum / 165) * 0.5;
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
}

async function exportCell(input, left, top, size, outPath) {
  const { data, info } = await sharp(input)
    .extract({ left, top, width: size, height: size })
    .resize(OUT_SIZE, OUT_SIZE, { kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  lightenRaw(data);

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .webp({ quality: 92 })
    .toFile(outPath);
}

async function splitSheet(input, cols, rows, startIndex) {
  const meta = await sharp(input).metadata();
  const w = meta.width ?? 1024;
  const h = meta.height ?? 1024;
  const cellW = Math.floor(w / cols);
  const cellH = Math.floor(h / rows);
  let idx = startIndex;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const pad = Math.floor(Math.min(cellW, cellH) * 0.06);
      const size = Math.min(cellW, cellH) - pad * 2;
      const left = col * cellW + Math.floor((cellW - size) / 2);
      const top = row * cellH + Math.floor((cellH - size) / 2);
      const out = path.join(
        outDir,
        `avatar-${String(idx).padStart(2, "0")}.webp`
      );
      await exportCell(input, left, top, size, out);
      idx++;
    }
  }

  return idx;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const file of fs.readdirSync(outDir)) {
    if (
      (file.startsWith("avatar-") && file.endsWith(".webp")) ||
      file.startsWith("_preview-")
    ) {
      try {
        fs.unlinkSync(path.join(outDir, file));
      } catch {
        /* OneDrive lock — overwrite instead */
      }
    }
  }

  // Write to a staging folder first, then swap names to dodge OneDrive locks.
  const stageDir = path.join(outDir, `_stage_${Date.now()}`);
  fs.mkdirSync(stageDir, { recursive: true });

  let idx = 0;
  const staged = [];
  for (const sheet of SHEETS) {
    const meta = await sharp(path.join(sourceDir, sheet.file)).metadata();
    const w = meta.width ?? 1024;
    const h = meta.height ?? 1024;
    const cellW = Math.floor(w / sheet.cols);
    const cellH = Math.floor(h / sheet.rows);
    for (let row = 0; row < sheet.rows; row++) {
      for (let col = 0; col < sheet.cols; col++) {
        const pad = Math.floor(Math.min(cellW, cellH) * 0.06);
        const size = Math.min(cellW, cellH) - pad * 2;
        const left = col * cellW + Math.floor((cellW - size) / 2);
        const top = row * cellH + Math.floor((cellH - size) / 2);
        const name = `avatar-${String(idx).padStart(2, "0")}.webp`;
        const stagedPath = path.join(stageDir, name);
        await exportCell(
          path.join(sourceDir, sheet.file),
          left,
          top,
          size,
          stagedPath
        );
        staged.push(name);
        idx++;
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
  console.log(`Exported ${idx} lightened avatars`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
