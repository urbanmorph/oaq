// Phase 1: minimal hello-world build. Phase 3 will implement the real leaderboard.
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");

mkdirSync(dist, { recursive: true });

// Copy Oat assets from node_modules.
const oatDir = join(here, "node_modules", "@knadh", "oat");
for (const f of ["oat.min.css", "oat.min.js"]) {
  const src = join(oatDir, f);
  if (existsSync(src)) copyFileSync(src, join(dist, f));
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>oaq — India air quality leaderboard</title>
<meta name="description" content="Unofficial mirror of oaq.notf.in. India air quality, ranked." />
<link rel="stylesheet" href="/oat.min.css" />
<script src="/oat.min.js" defer></script>
</head>
<body>
<main>
  <h1>oaq</h1>
  <p>Phase 1 skeleton. The real leaderboard lands in Phase 3.</p>
</main>
<footer>
  <p>Unofficial mirror of <a href="https://oaq.notf.in">oaq.notf.in</a>. UI built on
  <a href="https://oat.ink">Oat</a>. MIT.</p>
</footer>
</body>
</html>
`;

writeFileSync(join(dist, "index.html"), html);
console.log("built dist/index.html");
