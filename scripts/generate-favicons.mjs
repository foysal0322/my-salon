import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// High-contrast, recognizable salon scissors icon optimized for both small (16px) and large (512px) displays
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F766E" />
      <stop offset="50%" stop-color="#0D9488" />
      <stop offset="100%" stop-color="#042F2E" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
    <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Squircle Background -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />

  <!-- Subtle Inner Ring Highlight -->
  <circle cx="256" cy="256" r="218" fill="none" stroke="#FFFFFF" stroke-width="4" opacity="0.15" />

  <!-- Hairdresser Scissors Group -->
  <g filter="url(#shadow)">
    <!-- Right Scissor Half (Handle bottom-right, Blade top-left) -->
    <!-- Handle Ring -->
    <circle cx="340" cy="355" r="48" fill="none" stroke="url(#goldGrad)" stroke-width="22" />
    <!-- Handle to Pivot Shank -->
    <path d="M305 320 L256 256" stroke="url(#goldGrad)" stroke-width="20" stroke-linecap="round" />
    <!-- Blade (pivot to tip) -->
    <path d="M256 256 L150 120 Q145 115 152 110 L170 120 L256 240 Z" fill="url(#bladeGrad)" stroke="#CBD5E1" stroke-width="2" />

    <!-- Left Scissor Half (Handle bottom-left, Blade top-right) -->
    <!-- Handle Ring -->
    <circle cx="172" cy="355" r="48" fill="none" stroke="url(#goldGrad)" stroke-width="22" />
    <!-- Handle to Pivot Shank -->
    <path d="M207 320 L256 256" stroke="url(#goldGrad)" stroke-width="20" stroke-linecap="round" />
    <!-- Blade (pivot to tip) -->
    <path d="M256 256 L362 120 Q367 115 360 110 L342 120 L256 240 Z" fill="url(#bladeGrad)" stroke="#CBD5E1" stroke-width="2" />

    <!-- Pivot Screw / Rivet -->
    <circle cx="256" cy="256" r="14" fill="url(#goldGrad)" stroke="#FFFFFF" stroke-width="3" />
    <circle cx="256" cy="256" r="5" fill="#B45309" />
  </g>

  <!-- Sparkle Stars (Grooming / Salon Freshness) -->
  <g fill="#FDE68A" opacity="0.95">
    <!-- Star 1 (Top Right) -->
    <path d="M390 190 Q390 215 415 215 Q390 215 390 240 Q390 215 365 215 Q390 215 390 190 Z" />
    <!-- Star 2 (Small Left) -->
    <path d="M125 210 Q125 225 140 225 Q125 225 125 240 Q125 225 110 225 Q125 225 125 210 Z" transform="scale(0.7) translate(30, 40)" />
  </g>
</svg>`;

// Function to construct standard Windows ICO format from PNG buffers
function createIco(pngBuffers) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Image type (1 = icon)
  header.writeUInt16LE(pngBuffers.length, 4); // Number of images

  let offset = 6 + (16 * pngBuffers.length);
  const directoryEntries = [];
  const imageBuffers = [];

  for (const { width, height, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0); // Width
    entry.writeUInt8(height >= 256 ? 0 : height, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset of image data

    directoryEntries.push(entry);
    imageBuffers.push(buffer);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...directoryEntries, ...imageBuffers]);
}

async function run() {
  const rootDir = process.cwd();
  const svgBuffer = Buffer.from(svgIcon);

  // Generate PNG sizes
  console.log('Rendering crisp PNG icon sizes with sharp...');
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  const png180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  const png192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();

  // Multi-resolution ICO (16x16, 32x32, 48x48)
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 },
  ]);

  // Destination paths
  const paths = {
    srcFaviconIco: path.join(rootDir, 'src', 'app', 'favicon.ico'),
    srcIconSvg: path.join(rootDir, 'src', 'app', 'icon.svg'),
    srcAppleIcon: path.join(rootDir, 'src', 'app', 'apple-icon.png'),
    publicFaviconIco: path.join(rootDir, 'public', 'favicon.ico'),
    publicIconSvg: path.join(rootDir, 'public', 'icons', 'icon.svg'),
    publicIcon192: path.join(rootDir, 'public', 'icons', 'icon-192x192.png'),
    publicIcon512: path.join(rootDir, 'public', 'icons', 'icon-512x512.png'),
  };

  // Ensure directories exist
  fs.mkdirSync(path.join(rootDir, 'public', 'icons'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'src', 'app'), { recursive: true });

  // Write all icon files
  fs.writeFileSync(paths.srcFaviconIco, icoBuffer);
  fs.writeFileSync(paths.publicFaviconIco, icoBuffer);
  fs.writeFileSync(paths.srcIconSvg, svgIcon, 'utf-8');
  fs.writeFileSync(paths.publicIconSvg, svgIcon, 'utf-8');
  fs.writeFileSync(paths.srcAppleIcon, png180);
  fs.writeFileSync(paths.publicIcon192, png192);
  fs.writeFileSync(paths.publicIcon512, png512);

  console.log('✓ Successfully generated:');
  console.log('  - src/app/favicon.ico (Multi-size ICO: 16x16, 32x32, 48x48)');
  console.log('  - src/app/icon.svg (Vector tab favicon)');
  console.log('  - src/app/apple-icon.png (180x180 iOS touch icon)');
  console.log('  - public/favicon.ico (Root fallback ICO)');
  console.log('  - public/icons/icon.svg (512x512 vector master)');
  console.log('  - public/icons/icon-192x192.png (PWA icon)');
  console.log('  - public/icons/icon-512x512.png (PWA high-res icon)');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
