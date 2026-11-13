import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('..', 'assets', 'horenova-icon-512.png');
const output = resolve('assets');
await mkdir(output, { recursive: true });
const logo = await sharp(source).resize(660, 660, { fit: 'contain' }).png().toBuffer();
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#090a0e' } })
  .composite([{ input: logo, gravity: 'centre' }]).png().toFile(resolve(output, 'icon-only.png'));
const logoSplash = await sharp(source).resize(1100, 1100, { fit: 'contain' }).png().toBuffer();
await sharp({ create: { width: 2732, height: 2732, channels: 4, background: '#090a0e' } })
  .composite([{ input: logoSplash, gravity: 'centre' }]).png().toFile(resolve(output, 'splash.png'));
await sharp({ create: { width: 2732, height: 2732, channels: 4, background: '#090a0e' } })
  .composite([{ input: logoSplash, gravity: 'centre' }]).png().toFile(resolve(output, 'splash-dark.png'));
console.log('App icon and dark splash source images prepared from HORENOVA logo');
