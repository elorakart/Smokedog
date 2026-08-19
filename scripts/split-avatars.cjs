const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const sourceDir = path.join(__dirname, "../public/avatars/source");
const outDir = path.join(__dirname, "../public/avatars");

const SHEETS = [
  { file: "sheet-01.png", cols: 3, rows: 2 },
  { file: "sheet-02.png", cols: 3, rows: 2 },
  { file: "sheet-03.png", cols: 3, rows: 2 },
  { file: "sheet-05.png", cols: 2, rows: 1 },
];

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
      const out = path.join(outDir, `avatar-${String(idx).padStart(2, "0")}.webp`);

      await sharp(input)
        .extract({ left, top, width: size, height: size })
        .webp({ quality: 88 })
        .toFile(out);

      idx++;
    }
  }

  return idx;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const file of fs.readdirSync(outDir)) {
    if (file.startsWith("avatar-") && file.endsWith(".webp")) {
      fs.unlinkSync(path.join(outDir, file));
    }
  }

  let idx = 0;
  for (const sheet of SHEETS) {
    idx = await splitSheet(path.join(sourceDir, sheet.file), sheet.cols, sheet.rows, idx);
  }
  console.log(`Exported ${idx} avatars`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
