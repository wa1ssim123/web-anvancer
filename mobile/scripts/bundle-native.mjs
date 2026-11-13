import { build } from 'esbuild';
await build({
  entryPoints: ['native-runtime.js'],
  outfile: 'www/horenova-native.js',
  bundle: true,
  minify: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  logLevel: 'info'
});
