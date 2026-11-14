import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const creationsDir = path.resolve(__dirname, '..', 'uploads', 'creations');

if (!fs.existsSync(creationsDir)) {
  fs.mkdirSync(creationsDir, { recursive: true });
}

const STYLE_PALETTES = {
  Editorial: [
    ['#0f172a', '#1e293b', '#3b82f6', '#f59e0b', '#ec4899'],
    ['#18181b', '#27272a', '#ef4444', '#f97316', '#fbbf24'],
    ['#09090b', '#1c1917', '#10b981', '#06b6d4', '#6366f1'],
    ['#111827', '#374151', '#e11d48', '#be185d', '#fda4af'],
  ],
  Minimal: [
    ['#0a0a0a', '#171717', '#e5e5e5', '#a3a3a3', '#fafafa'],
    ['#0f172a', '#1e293b', '#64748b', '#cbd5e1', '#f8fafc'],
    ['#1c1917', '#292524', '#78716c', '#d6d3d1', '#f5f5f4'],
  ],
  Architectural: [
    ['#080c14', '#152238', '#0ea5e9', '#38bdf8', '#e2e8f0'],
    ['#09090b', '#27272a', '#d97706', '#f59e0b', '#fef3c7'],
    ['#171923', '#2d3748', '#4fd1c5', '#81e6d9', '#e6fffa'],
  ],
  Monochrome: [
    ['#000000', '#18181b', '#3f3f46', '#a1a1aa', '#ffffff'],
    ['#050505', '#262626', '#525252', '#d4d4d4', '#fafafa'],
  ],
};

function pseudoRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateArtisticSvg({
  id,
  prompt,
  style = 'Editorial',
  aspectRatio = '1:1',
  mode = 'image',
  motion = 'Static',
  seed = 42,
}) {
  const prng = pseudoRandom(seed);
  const palettes = STYLE_PALETTES[style] || STYLE_PALETTES.Editorial;
  const palette = palettes[Math.floor(prng() * palettes.length)];

  let width = 1200;
  let height = 1200;
  if (aspectRatio === '16:9') {
    width = 1600;
    height = 900;
  } else if (aspectRatio === '9:16') {
    width = 900;
    height = 1600;
  } else if (aspectRatio === '4:5') {
    width = 1080;
    height = 1350;
  }

  const primary = palette[0];
  const secondary = palette[1];
  const accent1 = palette[2];
  const accent2 = palette[3] || palette[2];
  const highlight = palette[4] || '#ffffff';

  const isVideo = mode === 'video';
  const animationDuration = motion === 'Orbit' ? '12s' : motion === 'Lateral Pan' ? '8s' : '10s';

  const circles = Array.from({ length: 6 }).map((_, i) => {
    const cx = Math.floor(prng() * width);
    const cy = Math.floor(prng() * height);
    const r = Math.floor(prng() * (width * 0.4) + 60);
    const color = palette[Math.floor(prng() * (palette.length - 1)) + 1];
    const opacity = (0.2 + prng() * 0.5).toFixed(2);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}" filter="url(#blur-glow)">
      ${isVideo ? `<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="${animationDuration}" repeatCount="indefinite" />` : ''}
    </circle>`;
  });

  const curves = Array.from({ length: 4 }).map((_, i) => {
    const startY = Math.floor(prng() * height);
    const cp1x = Math.floor(prng() * width);
    const cp1y = Math.floor(prng() * height);
    const cp2x = Math.floor(prng() * width);
    const cp2y = Math.floor(prng() * height);
    const endY = Math.floor(prng() * height);
    const stroke = palette[Math.floor(prng() * palette.length)];
    const widthStroke = Math.floor(prng() * 12) + 2;
    return `<path d="M 0 ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${width} ${endY}" fill="none" stroke="${stroke}" stroke-width="${widthStroke}" stroke-linecap="round" opacity="0.6"/>`;
  });

  // Architectural / geometric elements
  const grids = Array.from({ length: 8 }).map((_, i) => {
    const x = Math.floor(prng() * (width - 200)) + 100;
    const y = Math.floor(prng() * (height - 200)) + 100;
    const w = Math.floor(prng() * 260) + 40;
    const h = Math.floor(prng() * 260) + 40;
    const stroke = palette[Math.floor(prng() * palette.length)];
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="4 6" opacity="0.45" />`;
  });

  const escapedPrompt = prompt
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 70);

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg-grad-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}" />
      <stop offset="60%" stop-color="${secondary}" />
      <stop offset="100%" stop-color="${accent1}" stop-opacity="0.8" />
    </linearGradient>

    <linearGradient id="acc-grad-${id}" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${accent2}" />
      <stop offset="100%" stop-color="${highlight}" />
    </linearGradient>

    <filter id="blur-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="80" result="blur" />
    </filter>

    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.07 0" />
      <feComposite in2="SourceGraphic" in="gl" operator="in" />
    </filter>
  </defs>

  <!-- Deep Canvas Background -->
  <rect width="${width}" height="${height}" fill="url(#bg-grad-${id})" />

  <!-- Abstract Generative Circles -->
  <g>
    ${circles.join('\n    ')}
  </g>

  <!-- Fluid Ribbon Curves -->
  <g>
    ${curves.join('\n    ')}
  </g>

  <!-- Architectural Grids -->
  <g>
    ${grids.join('\n    ')}
  </g>

  <!-- Grain Texture Overlay -->
  <rect width="${width}" height="${height}" filter="url(#noise)" opacity="0.9" pointer-events="none" />

  <!-- Minimal Typographic Watermark -->
  <g transform="translate(60, ${height - 60})" opacity="0.85">
    <text x="0" y="0" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="600" fill="${highlight}" letter-spacing="1">
      FORMA STUDIO // SEED ${seed}
    </text>
    <text x="0" y="26" font-family="'Inter', sans-serif" font-size="14" fill="#a1a1aa" letter-spacing="0.5">
      ${style.toUpperCase()} • ${aspectRatio} • ${escapedPrompt}
    </text>
  </g>

  ${isVideo ? `
  <g transform="translate(${width - 120}, 60)" opacity="0.85">
    <circle cx="20" cy="20" r="16" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" stroke-width="2" />
    <circle cx="20" cy="20" r="6" fill="#ef4444">
      <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
    </circle>
  </g>` : ''}
</svg>`;

  const fileName = `gen-${id}.svg`;
  const filePath = path.join(creationsDir, fileName);
  fs.writeFileSync(filePath, svgContent, 'utf8');

  return {
    filePath,
    mediaUrl: `/uploads/creations/${fileName}`,
  };
}

