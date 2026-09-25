// Renders every figure pose to one HTML page for visual review.
// Usage: node scripts/contact-sheet.mjs [out.html] [filter]
import { writeFileSync } from 'node:fs';
import { POSES } from '../src/js/figure/poses.js';
import { figureSVG, prepareFigure } from '../src/js/figure/rig.js';

const out = process.argv[2] || 'dist/poses.html';
const filter = process.argv[3] ? new RegExp(process.argv[3]) : null;
const cells = [];
for (const [id, spec] of Object.entries(POSES)) {
  if (filter && !filter.test(id)) continue;
  const fig = prepareFigure(spec);
  const variants = [['final', figureSVG(spec, { mode: 'still' })]];
  if (spec.frames.length > 1) {
    const first = { ...spec, frames: [spec.frames[0]] };
    variants.unshift(['frame 1', figureSVG(first, { mode: 'still', glow: false })]);
  }
  cells.push(`<div class="cell"><h3>${id} <small>${spec.view || 'side'} · scale ${fig.scale.toFixed(2)}</small></h3><div class="row">${variants.map(([l, s]) => `<figure>${s}<figcaption>${l}</figcaption></figure>`).join('')}</div></div>`);
}
const css = `
body{font:13px system-ui;background:#EEF1ED;margin:16px;color:#12211E}
.grid{display:grid;grid-template-columns:repeat(var(--cols,3),1fr);gap:12px}
.cell{background:#fff;border-radius:10px;padding:8px}
.row{display:flex;gap:6px}
figure{margin:0;flex:1}
figcaption{font-size:11px;color:#667}
h3{margin:0 0 4px;font-size:13px}
small{color:#889;font-weight:400}
svg.fig{width:100%;height:auto;display:block;background:#F7F8F6;border-radius:6px}
.fg-body{fill:#1A2B28}.fg-far{fill:#8FA39D}.fg-hair{fill:#0B1513}
.fg-torso{stroke:#1A2B28;stroke-linejoin:round}
.fg-mat{fill:#0F5F57}.fg-floor{fill:#E3E8E3}.fg-block{fill:#D4A36C;stroke:#B98651;stroke-width:.8}
.fg-cushion{fill:#B9C7E8}.fg-wall{fill:#DCE2DC}.fg-chair{fill:#9AA6A0}
.fg-strap{stroke:#FF6F3C;stroke-width:2.2;fill:none;stroke-linecap:round}
.fg-glow{fill:#FF6F3C;opacity:.45}
`;
writeFileSync(out, `<!doctype html><meta charset="utf-8"><style>${css}</style><div class="grid">${cells.join('')}</div>`);
console.log('wrote', out, cells.length, 'figures');
