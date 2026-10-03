import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
import C from './concepts.mjs';
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const shot = async (svgStr, size, file) => {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<body style="margin:0;background:transparent">${svgStr.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
    await p.screenshot({ path: file, omitBackground: true });
  };
  for (const [id, { fn }] of Object.entries(C)) {
    const d = path.join(OUT, id); fs.mkdirSync(d, { recursive: true });
    const main = fn(), small = fn({ small: true }), sq = fn({ square: true });
    fs.writeFileSync(`${d}/icon.svg`, main);
    fs.writeFileSync(`${d}/icon-small.svg`, small);
    fs.writeFileSync(`${d}/apple-icon.svg`, sq);
    await shot(main, 512, `${d}/icon-512.png`);
    await shot(main, 192, `${d}/icon-192.png`);
    await shot(sq, 180, `${d}/apple-icon.png`);
    for (const s of [16, 32, 48]) await shot(small, s, `${d}/_${s}.png`);
    execSync(`convert ${d}/_16.png ${d}/_32.png ${d}/_48.png ${d}/favicon.ico`);
    for (const s of [16, 32, 48]) fs.unlinkSync(`${d}/_${s}.png`);
  }
  await b.close();
})();
