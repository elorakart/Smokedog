const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const dir = path.join(__dirname, "../public/avatars/stitch-import");

async function main() {
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".png"))) {
    const m = await sharp(path.join(dir, f)).metadata();
    console.log(f, m.width, m.height);
  }
}

main();
