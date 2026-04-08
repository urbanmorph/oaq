// Post-build sanity check. Reads dist/index.html, extracts every /s/ link,
// and confirms the corresponding dist/s/{provider}/{id}/index.html exists.
// Also checks a handful of required meta tags and the filter script.
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");

function fail(msg: string): never {
  console.error(`[verify] ✘ ${msg}`);
  process.exit(1);
}

function ok(msg: string) {
  console.log(`[verify] ✓ ${msg}`);
}

if (!existsSync(join(dist, "index.html"))) fail("dist/index.html missing — run build first");

const home = readFileSync(join(dist, "index.html"), "utf8");

// 1. Required meta tags
for (const tag of [
  '<meta name="viewport"',
  '<meta name="color-scheme"',
  '<meta name="description"',
  '<link rel="canonical"',
  '<meta property="og:title"',
  '<script type="application/ld+json">',
]) {
  if (!home.includes(tag)) fail(`home missing: ${tag}`);
}
ok("home meta tags present");

// 2. Filter script
if (!home.includes('src="/filter.js"')) fail("home missing filter.js reference");
if (!existsSync(join(dist, "filter.js"))) fail("dist/filter.js missing");
ok("filter.js referenced and present");

// 3. Oat assets
for (const f of ["oat.min.css", "oat.min.js", "app.css"]) {
  if (!existsSync(join(dist, f))) fail(`dist/${f} missing`);
}
ok("oat + app assets present");

// 4. Every station link in home points to a file that exists on disk
const hrefRe = /href="\/s\/([^/]+)\/([^"#?]+)"/g;
const links = new Set<string>();
let m: RegExpExecArray | null;
while ((m = hrefRe.exec(home)) !== null) {
  links.add(`${decodeURIComponent(m[1])}/${decodeURIComponent(m[2])}`);
}
if (links.size === 0) fail("no station links found in home");

let missing = 0;
for (const key of links) {
  const p = join(dist, "s", key, "index.html");
  if (!existsSync(p)) {
    console.error(`[verify]   ✘ missing ${p}`);
    missing++;
  }
}
if (missing) fail(`${missing}/${links.size} station links have no file on disk`);
ok(`all ${links.size} home station links resolve to files`);

// 5. Every station file is reachable from sitemap
const sitemap = readFileSync(join(dist, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const stationUrls = urls.filter((u) => u.includes("/s/"));
if (stationUrls.length < links.size) {
  fail(`sitemap has ${stationUrls.length} station URLs but home references ${links.size}`);
}
ok(`sitemap has ${stationUrls.length} station URLs`);

// 6. JSON-LD parses
const ldRe = /<script type="application\/ld\+json">([^<]+)<\/script>/g;
let ldCount = 0;
while ((m = ldRe.exec(home)) !== null) {
  try {
    JSON.parse(m[1]);
    ldCount++;
  } catch (e) {
    fail(`invalid JSON-LD in home: ${(e as Error).message}`);
  }
}
if (ldCount === 0) fail("no JSON-LD blocks parsed");
ok(`${ldCount} JSON-LD block(s) valid on home`);

// 7. Sample a station page
const sampleKey = [...links][0];
const samplePath = join(dist, "s", sampleKey, "index.html");
const sample = readFileSync(samplePath, "utf8");
for (const tag of [
  '<meta name="color-scheme"',
  '<link rel="canonical"',
  '"@type":"Dataset"',
  "← Back to leaderboard",
]) {
  if (!sample.includes(tag)) fail(`sample station (${sampleKey}) missing: ${tag}`);
}
// Parse sample JSON-LD
const sampleLdRe = /<script type="application\/ld\+json">([^<]+)<\/script>/g;
while ((m = sampleLdRe.exec(sample)) !== null) {
  JSON.parse(m[1]); // throws on failure
}
ok(`sample station page (${sampleKey}) passes checks`);

// 8. Byte-size report
const sizes: Record<string, number> = {};
for (const f of ["index.html", "oat.min.css", "oat.min.js", "app.css", "filter.js"]) {
  sizes[f] = statSync(join(dist, f)).size;
}
ok(`sizes (raw bytes): ${JSON.stringify(sizes)}`);

console.log("[verify] all checks passed");
