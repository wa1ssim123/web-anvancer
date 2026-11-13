import { readFile, stat, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
const root = resolve('www');
const html = await readFile(join(root, 'index.html'), 'utf8');
const files = await readdir(root);
if (!html.includes('horenova-native.js')) throw Error('Native bridge missing in index.html');
if (!files.includes('horenova-native.js')) throw Error('Native bridge bundle missing');
if (!files.includes('horenova-native.css')) throw Error('Native CSS missing');
for (const path of ['jobs.html','shifts.html','shop.html','account.html','explore.html','academy.html','manifest.json','js/wix/client.js']) {
  const st = await stat(join(root,path));
  if (!st.isFile() || st.size === 0) throw Error('Missing '+path);
}
const config = JSON.parse(await readFile('capacitor.config.json','utf8'));
if (config.server?.url) throw Error('Do not publish a remote live-reload server.url in production');
if (config.appId !== 'com.horenova.mobile') throw Error('Unexpected application id');
console.log('Static packaging checks PASS; end-to-end authentication, native devices and store review remain unverified.');
