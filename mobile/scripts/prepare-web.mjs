import { readdir, mkdir, rm, copyFile, readFile, writeFile, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = resolve(mobileDir, '..');
const destDir = resolve(mobileDir, 'www');
const excludeDirs = new Set(['.git', '.github', 'backend', 'mobile', 'qa', 'scripts', 'node_modules']);
const excludeFiles = new Set(['render.yaml', '.gitignore', 'package-lock.json']);
let copied = 0;
let pages = 0;

await rm(destDir, { recursive: true, force: true });
await mkdir(destDir, { recursive: true });

async function visit(dir) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const abs = join(dir, ent.name);
    const rel = relative(sourceDir, abs);
    if (ent.isDirectory()) {
      if (excludeDirs.has(ent.name)) continue;
      await visit(abs);
      continue;
    }
    if (!ent.isFile() || excludeFiles.has(ent.name)) continue;
    const out = join(destDir, rel);
    await mkdir(dirname(out), { recursive: true });
    if (extname(abs).toLowerCase() === '.html') {
      let html = await readFile(abs, 'utf8');
      if (!html.includes('</body>')) throw Error('HTML closing tag missing: ' + rel);
      html = html.replace('</body>', '<link rel="stylesheet" href="/horenova-native.css"><script type="module" src="/horenova-native.js"></script></body>');
      await writeFile(out, html, 'utf8');
      pages++;
    } else {
      await copyFile(abs, out);
    }
    copied++;
  }
}
await visit(sourceDir);
const home = await stat(join(destDir, 'index.html'));
if (!home.size || pages < 10) throw Error('Incomplete HORENOVA web export');
console.log(JSON.stringify({ status: 'web assets staged', copied, pages, dest: destDir }));
