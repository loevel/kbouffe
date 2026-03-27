#!/usr/bin/env node
/**
 * Generate mobile app icon PNGs from the Kbouffe brand SVG.
 *
 * Creates:
 *   - icon.png           (1024×1024, iOS app icon)
 *   - favicon.png        (48×48, web favicon)
 *   - splash-icon.png    (200×200, splash icon)
 *   - android-icon-foreground.png (108dp * 4 = 432, adaptive icon foreground)
 *   - android-icon-background.png (432×432, solid brand orange)
 *   - android-icon-monochrome.png (432×432, white on transparent)
 *
 * Requires: npm install sharp  (run from mobile-client dir)
 */

const fs = require("fs");
const path = require("path");

async function main() {
    let sharp;
    try {
        sharp = require("sharp");
    } catch {
        console.error("sharp not found. Install it with:\n  npm install --save-dev sharp");
        process.exit(1);
    }

    const outDir = path.join(__dirname, "..", "assets", "images");

    // ── SVG icon parts ────────────────────────────────────────────────────
    const brand = "#f97316";
    const white = "#ffffff";
    const dark = "#0f172a";

    // Full icon SVG (orange background, white fork-knife K)
    const mainIconSvg = `
<svg width="1024" height="1024" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="120" rx="26" fill="${brand}"/>
  <!-- Fork (K vertical) -->
  <rect x="30" y="24" width="8" height="72" rx="4" fill="${white}"/>
  <rect x="24" y="24" width="4" height="20" rx="2" fill="${white}" opacity="0.85"/>
  <rect x="33" y="24" width="4" height="20" rx="2" fill="${white}" opacity="0.85"/>
  <rect x="42" y="24" width="4" height="20" rx="2" fill="${white}" opacity="0.85"/>
  <rect x="24" y="42" width="22" height="5" rx="2.5" fill="${white}" opacity="0.7"/>
  <!-- Knife (K diagonals) -->
  <path d="M44 60 L82 28 C84 26 88 26 90 28 L92 30 C94 32 94 36 92 38 L50 60" fill="${white}" opacity="0.95"/>
  <path d="M44 62 L86 94 C88 96 88 100 86 102 L84 104 C82 106 78 106 76 104 L44 68" fill="${white}" opacity="0.9"/>
  <!-- Steam -->
  <path d="M58 18 C58 12 64 8 64 2" stroke="${white}" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
  <path d="M68 20 C68 14 74 10 74 4" stroke="${white}" stroke-width="2" stroke-linecap="round" opacity="0.35"/>
</svg>`;

    // Foreground only (transparent bg, centered icon with safe zone padding)
    const foregroundSvg = `
<svg width="432" height="432" viewBox="0 0 432 432" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(108, 108) scale(1.8)">
    <rect x="30" y="24" width="8" height="72" rx="4" fill="${white}"/>
    <rect x="24" y="24" width="4" height="20" rx="2" fill="${white}" opacity="0.85"/>
    <rect x="33" y="24" width="4" height="20" rx="2" fill="${white}" opacity="0.85"/>
    <rect x="42" y="24" width="4" height="20" rx="2" fill="${white}" opacity="0.85"/>
    <rect x="24" y="42" width="22" height="5" rx="2.5" fill="${white}" opacity="0.7"/>
    <path d="M44 60 L82 28 C84 26 88 26 90 28 L92 30 C94 32 94 36 92 38 L50 60" fill="${white}" opacity="0.95"/>
    <path d="M44 62 L86 94 C88 96 88 100 86 102 L84 104 C82 106 78 106 76 104 L44 68" fill="${white}" opacity="0.9"/>
    <path d="M58 18 C58 12 64 8 64 2" stroke="${white}" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
    <path d="M68 20 C68 14 74 10 74 4" stroke="${white}" stroke-width="2" stroke-linecap="round" opacity="0.35"/>
  </g>
</svg>`;

    // Background: solid brand color
    const backgroundSvg = `
<svg width="432" height="432" xmlns="http://www.w3.org/2000/svg">
  <rect width="432" height="432" fill="${brand}"/>
</svg>`;

    // Monochrome: dark icon on transparent
    const monochromeSvg = `
<svg width="432" height="432" viewBox="0 0 432 432" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(108, 108) scale(1.8)">
    <rect x="30" y="24" width="8" height="72" rx="4" fill="${dark}"/>
    <rect x="24" y="24" width="4" height="20" rx="2" fill="${dark}" opacity="0.85"/>
    <rect x="33" y="24" width="4" height="20" rx="2" fill="${dark}" opacity="0.85"/>
    <rect x="42" y="24" width="4" height="20" rx="2" fill="${dark}" opacity="0.85"/>
    <rect x="24" y="42" width="22" height="5" rx="2.5" fill="${dark}" opacity="0.7"/>
    <path d="M44 60 L82 28 C84 26 88 26 90 28 L92 30 C94 32 94 36 92 38 L50 60" fill="${dark}" opacity="0.95"/>
    <path d="M44 62 L86 94 C88 96 88 100 86 102 L84 104 C82 106 78 106 76 104 L44 68" fill="${dark}" opacity="0.9"/>
  </g>
</svg>`;

    // Splash icon (transparent bg, brand colored icon)
    const splashSvg = `
<svg width="200" height="200" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <rect x="30" y="24" width="8" height="72" rx="4" fill="${white}"/>
  <rect x="24" y="24" width="4" height="20" rx="2" fill="${white}" opacity="0.85"/>
  <rect x="33" y="24" width="4" height="20" rx="2" fill="${white}" opacity="0.85"/>
  <rect x="42" y="24" width="4" height="20" rx="2" fill="${white}" opacity="0.85"/>
  <rect x="24" y="42" width="22" height="5" rx="2.5" fill="${white}" opacity="0.7"/>
  <path d="M44 60 L82 28 C84 26 88 26 90 28 L92 30 C94 32 94 36 92 38 L50 60" fill="${white}" opacity="0.95"/>
  <path d="M44 62 L86 94 C88 96 88 100 86 102 L84 104 C82 106 78 106 76 104 L44 68" fill="${white}" opacity="0.9"/>
  <path d="M58 18 C58 12 64 8 64 2" stroke="${white}" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
  <path d="M68 20 C68 14 74 10 74 4" stroke="${white}" stroke-width="2" stroke-linecap="round" opacity="0.35"/>
</svg>`;

    const specs = [
        { name: "icon.png", svg: mainIconSvg, width: 1024, height: 1024 },
        { name: "favicon.png", svg: mainIconSvg, width: 48, height: 48 },
        { name: "splash-icon.png", svg: splashSvg, width: 200, height: 200 },
        { name: "android-icon-foreground.png", svg: foregroundSvg, width: 432, height: 432 },
        { name: "android-icon-background.png", svg: backgroundSvg, width: 432, height: 432 },
        { name: "android-icon-monochrome.png", svg: monochromeSvg, width: 432, height: 432 },
    ];

    for (const spec of specs) {
        const buf = Buffer.from(spec.svg);
        await sharp(buf)
            .resize(spec.width, spec.height)
            .png()
            .toFile(path.join(outDir, spec.name));
        console.log(`✓ ${spec.name} (${spec.width}×${spec.height})`);
    }

    console.log("\nDone! All icons generated in assets/images/");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
