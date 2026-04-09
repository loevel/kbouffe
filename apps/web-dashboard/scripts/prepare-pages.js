#!/usr/bin/env node
/**
 * Prépare le répertoire de déploiement Cloudflare Pages depuis la sortie OpenNext.
 *
 * Structure produite dans `pages-dist/` :
 *   _worker.js    ← worker SSR bundlé par wrangler (aliases @vercel/og appliqués)
 *   _routes.json  ← indique à Pages quelles URLs passer au worker
 *   **            ← assets statiques (depuis .open-next/assets/)
 *
 * Utilise wrangler.build.toml (config Workers) pour le bundling uniquement,
 * puis déploie vers Cloudflare Pages (limite 25 MiB, pas 3 MiB Workers).
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const OPEN_NEXT_DIR = ".open-next";
const BUNDLE_DIR = ".worker-bundle";
const DIST_DIR = "pages-dist";

// 1. Bundler le worker via wrangler Workers (dry-run) — applique les aliases
console.log("⚙️  Bundling du worker (aliases @vercel/og appliqués)…");
fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
execSync(
  `npx wrangler deploy --dry-run --outdir ${BUNDLE_DIR} --config wrangler.build.toml`,
  { stdio: "inherit" }
);

// 2. Préparer pages-dist
console.log("\n📁 Préparation du répertoire pages-dist…");
fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(DIST_DIR, { recursive: true });

// 3. Copier les assets statiques
fs.cpSync(path.join(OPEN_NEXT_DIR, "assets"), DIST_DIR, { recursive: true });
console.log(`   ✅ Assets copiés depuis ${OPEN_NEXT_DIR}/assets/`);

// 4. Copier le worker bundlé comme _worker.js
const workerSrc = path.join(BUNDLE_DIR, "worker.js");
const workerDst = path.join(DIST_DIR, "_worker.js");
fs.copyFileSync(workerSrc, workerDst);
const sizeMB = (fs.statSync(workerDst).size / 1024 / 1024).toFixed(1);
console.log(`   ✅ _worker.js : ${sizeMB} MB (limite Pages : 25 MiB)`);

// 5. Générer _routes.json
const routes = {
  version: 1,
  include: ["/*"],
  exclude: ["/_next/static/*", "/images/*", "/*.svg", "/*.png", "/*.ico", "/*.webp"],
};
fs.writeFileSync(
  path.join(DIST_DIR, "_routes.json"),
  JSON.stringify(routes, null, 2)
);
console.log("   ✅ _routes.json généré");

// 6. Nettoyage
fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });

console.log(`\n🚀 pages-dist prêt — déployez avec :\n   npx wrangler pages deploy pages-dist --project-name kbouffe-dashboard\n`);
