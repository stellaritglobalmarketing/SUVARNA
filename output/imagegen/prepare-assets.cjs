const fs = require('node:fs');
const path = require('node:path');
const sharp = require('../../frontend/node_modules/sharp');

async function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'ingredient-prompts.json'), 'utf8'));
  const previews = [];
  for (const [index, asset] of manifest.entries()) {
    const target = path.resolve(__dirname, '../../frontend/public', asset.destination);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    await sharp(asset.source).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toFile(target);
    const metadata = await sharp(target).metadata();
    if (metadata.width !== metadata.height) throw new Error(`Non-square image: ${asset.slug}`);
    previews.push({ input: await sharp(target).resize(240, 240).toBuffer(), left: (index % 4) * 240, top: Math.floor(index / 4) * 240 });
    console.log(`${asset.slug}: ${Math.round(fs.statSync(target).size / 1024)} KB`);
  }
  await sharp({ create: { width: 960, height: 720, channels: 3, background: '#faf5ed' } }).composite(previews).jpeg().toFile(path.join(__dirname, 'ingredient-contact-sheet.jpg'));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
