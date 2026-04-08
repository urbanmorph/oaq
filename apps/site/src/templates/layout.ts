import { esc } from "../util";

export interface LayoutOpts {
  title: string;
  description: string;
  canonical?: string;
  extraHead?: string;
  body: string;
  siteUrl: string;
  jsonLd?: object | object[];
  ogImage?: string;
}

export function layout(opts: LayoutOpts): string {
  const jsonLdTags = opts.jsonLd
    ? (Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd])
        .map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
        .join("\n")
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}" />
${opts.canonical ? `<link rel="canonical" href="${esc(opts.canonical)}" />` : ""}
<meta property="og:title" content="${esc(opts.title)}" />
<meta property="og:description" content="${esc(opts.description)}" />
<meta property="og:type" content="website" />
${opts.canonical ? `<meta property="og:url" content="${esc(opts.canonical)}" />` : ""}
${opts.ogImage ? `<meta property="og:image" content="${esc(opts.ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />` : ""}
<meta name="twitter:card" content="${opts.ogImage ? "summary_large_image" : "summary"}" />
${opts.ogImage ? `<meta name="twitter:image" content="${esc(opts.ogImage)}" />` : ""}
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="stylesheet" href="/oat.min.css" />
<link rel="stylesheet" href="/app.css" />
<script src="/oat.min.js" defer></script>
${opts.extraHead ?? ""}
${jsonLdTags}
</head>
<body>
<nav>
  <ul>
    <li><strong><a href="/">oaq</a></strong></li>
  </ul>
  <ul>
    <li><a href="/docs">docs</a></li>
    <li><a href="/docs/api">api</a></li>
    <li><a href="/about">about</a></li>
    <li><a href="https://github.com/urbanmorph/oaq">github</a></li>
  </ul>
</nav>

<main>
${opts.body}
</main>

<footer>
  <p>
    Unofficial mirror of <a href="https://oaq.notf.in">oaq.notf.in</a> — the Open Air Quality data broker. Data:
    <strong>CPCB</strong> (State &amp; Central Pollution Control Board, Government of India),
    <strong>Airnet</strong> (<a href="https://cstep.in">CSTEP</a>),
    <strong>Aurassure</strong> (University Clean Air Network).
  </p>
  <p>
    UI built on <a href="https://oat.ink">Oat</a> by <a href="https://github.com/knadh">Kailash Nadh</a>.
    Code <a href="https://github.com/urbanmorph/oaq/blob/main/LICENSE">MIT-licensed</a>.
    This site is not affiliated with OAQ, Oat, or any data provider.
  </p>
  <p>
    <a href="/llms.txt">llms.txt</a> · <a href="/sitemap.xml">sitemap</a> · <a href="/robots.txt">robots</a>
  </p>
</footer>
</body>
</html>
`;
}
