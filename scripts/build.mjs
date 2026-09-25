// Builds two self-contained files from src/:
//   dist/index.html     a complete page you can open anywhere (or host on GitHub Pages)
//   dist/artifact.html  the same app as a page fragment, for publishing on claude.ai
import { build, transform } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => path.join(root, 'src', p);
const out = (p) => path.join(root, 'dist', p);

const js = await build({
  entryPoints: [src('js/main.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: ['es2020', 'safari14'],
  write: false,
  legalComments: 'none',
});
const script = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = (await transform(await readFile(src('css/app.css'), 'utf8'), { loader: 'css', minify: true })).code;

const page = await readFile(src('index.html'), 'utf8');
const standalone = page
  .replace(/<!-- build:css -->[\s\S]*?<!-- \/build:css -->/, () => `<style>${css}</style>`)
  .replace(/<!-- build:js -->[\s\S]*?<!-- \/build:js -->/, () => `<script>${script}</script>`);

// The claude.ai viewer supplies <html>, <head> and <body>; the fragment starts with its title.
const head = page.match(/<head>([\s\S]*?)<\/head>/)[1];
const title = head.match(/<title>[\s\S]*?<\/title>/)[0];
const fonts = head.match(/<link rel="preconnect"[^>]*>|<link rel="stylesheet" href="https:\/\/fonts[^>]*>/g).join('\n');
const artifact = `${title}\n<style>html,body{height:auto}${css}</style>\n${fonts}\n<div id="app-root"></div>\n<script>${script}</script>\n`;

await mkdir(out(''), { recursive: true });
await writeFile(out('index.html'), standalone);
await writeFile(out('artifact.html'), artifact);
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
console.log(`dist/index.html    ${kb(standalone)}\ndist/artifact.html ${kb(artifact)}`);
