import { layout } from "./layout";

export function renderDocsIndex(siteUrl: string): string {
  return layout({
    title: "Documentation | oaq",
    description:
      "Documentation for the oaq mirror — API reference, AI agent guide, data sources, and attribution.",
    canonical: `${siteUrl}/docs`,
    siteUrl,
    body: `
<header>
  <h1>Documentation</h1>
  <p class="muted">
    This site mirrors the OAQ Data Broker for India as a plain-text leaderboard.
    Open. Read it, fork it, build on it.
  </p>
</header>

<section>
  <h2>Pages</h2>
  <ul>
    <li><a href="/docs/api">API reference</a> — 4 endpoints, OpenAPI 3.1 spec.</li>
    <li><a href="/docs/ai-agents">AI agents</a> — how to ingest this site with ChatGPT, Claude, Perplexity.</li>
    <li><a href="/docs/data-sources">Data sources</a> — CPCB, Airnet, Aurassure attribution and licenses.</li>
    <li><a href="/about">About</a> — why this exists, how it works.</li>
  </ul>
</section>

<section>
  <h2>Quick links</h2>
  <ul>
    <li><a href="/">Leaderboard (HTML)</a></li>
    <li><a href="/index.json">Leaderboard (JSON)</a></li>
    <li><a href="/index.md">Leaderboard (Markdown)</a></li>
    <li><a href="/openapi.yaml">OpenAPI spec</a></li>
    <li><a href="/llms.txt">llms.txt</a></li>
    <li><a href="/sitemap.xml">Sitemap</a></li>
    <li><a href="https://github.com/urbanmorph/oaq">GitHub</a></li>
  </ul>
</section>
`,
  });
}

export function renderApiDocs(siteUrl: string): string {
  // Scalar is loaded from CDN — static script tag, ~70 KB, renders openapi.yaml.
  return layout({
    title: "API Reference | oaq",
    description:
      "OpenAPI 3.1 reference for the oaq mirror. 4 read-only endpoints: leaderboard and per-station in JSON and Markdown.",
    canonical: `${siteUrl}/docs/api`,
    siteUrl,
    extraHead: `
<style>
  #api-reference { margin-block: 1rem; }
</style>
`,
    body: `
<header>
  <h1>API Reference</h1>
  <p class="muted">
    Mirror of the OAQ Data Broker for India. Open. No API key required for any
    of these endpoints — the upstream handshake is handled server-side.
  </p>
  <p>
    Raw spec: <a href="/openapi.yaml">/openapi.yaml</a>
  </p>
</header>

<div id="api-reference" data-url="/openapi.yaml"></div>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
`,
  });
}

export function renderAiAgents(siteUrl: string): string {
  return layout({
    title: "AI Agents | oaq",
    description:
      "How to ingest the oaq mirror with ChatGPT, Claude, Perplexity, and other LLM agents. JSON and Markdown variants of every page.",
    canonical: `${siteUrl}/docs/ai-agents`,
    siteUrl,
    body: `
<header>
  <h1>AI Agents</h1>
  <p class="muted">
    This site is built for crawlers and LLMs as much as humans. Every page has
    three formats.
  </p>
</header>

<section>
  <h2>Formats</h2>
  <table>
    <thead><tr><th>Format</th><th>Leaderboard</th><th>Per station</th></tr></thead>
    <tbody>
      <tr><td>HTML</td><td><a href="/">/</a></td><td><code>/s/{provider}/{id}</code></td></tr>
      <tr><td>JSON</td><td><a href="/index.json">/index.json</a></td><td><code>/s/{provider}/{id}.json</code></td></tr>
      <tr><td>Markdown</td><td><a href="/index.md">/index.md</a></td><td><code>/s/{provider}/{id}.md</code></td></tr>
    </tbody>
  </table>
</section>

<section>
  <h2>Structured entry points</h2>
  <ul>
    <li><a href="/llms.txt">/llms.txt</a> — plain-text manifest</li>
    <li><a href="/sitemap.xml">/sitemap.xml</a> — all ~650 station URLs</li>
    <li><a href="/openapi.yaml">/openapi.yaml</a> — machine-readable API spec</li>
    <li><a href="/robots.txt">/robots.txt</a> — explicitly allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended</li>
  </ul>
</section>

<section>
  <h2>Example agent prompts</h2>
  <pre><code>Fetch ${siteUrl}/index.md and list the 5 worst stations in India right now.</code></pre>
  <pre><code>Fetch ${siteUrl}/s/cpcb/1420.md and summarize the air quality at this station.</code></pre>
</section>

<section>
  <h2>Rate limits</h2>
  <p>None for read endpoints. Be reasonable. Identify your bot in <code>User-Agent</code>. We log nothing personal.</p>
</section>
`,
  });
}

export function renderDataSources(siteUrl: string): string {
  return layout({
    title: "Data Sources | oaq",
    description:
      "Attribution and licensing for the three air quality providers mirrored by oaq: CPCB, Airnet (CSTEP), and Aurassure.",
    canonical: `${siteUrl}/docs/data-sources`,
    siteUrl,
    body: `
<header>
  <h1>Data Sources</h1>
  <p class="muted">
    All data on this site comes from three public providers, mirrored via
    <a href="https://oaq.notf.in">oaq.notf.in</a>.
  </p>
</header>

<section>
  <h2>Providers</h2>
  <dl>
    <dt>CPCB <code>cpcb</code></dt>
    <dd>
      <strong>Central Pollution Control Board</strong>, Government of India, and State Pollution Control Boards.
      The authoritative source for regulatory air quality monitoring in India. ~580 stations across 250+ cities.
      <a href="https://cpcb.nic.in">cpcb.nic.in</a>
    </dd>
    <dt>Airnet <code>airnet</code></dt>
    <dd>
      <strong>Center for Study of Science, Technology and Policy (CSTEP)</strong>. Dense low-cost sensor network, primarily in Bengaluru.
      <a href="https://cstep.in">cstep.in</a>
    </dd>
    <dt>Aurassure <code>aurassure</code></dt>
    <dd>
      <strong>Aurassure University Clean Air Network</strong>. University-hosted low-cost sensors.
      <a href="https://aurassure.com">aurassure.com</a>
    </dd>
  </dl>
</section>

<section>
  <h2>How this site gets the data</h2>
  <ol>
    <li>A Cloudflare Worker performs the OAQ broker handshake once per day and caches the signature.</li>
    <li>Every hour, the Worker fetches <code>all_stations_latest.json</code> for each of the three providers in a single bulk request.</li>
    <li>Stations are normalized, CPCB AQI is computed from raw pollutants, and a merged snapshot is written to Cloudflare R2.</li>
    <li>The static site is rebuilt from that snapshot — no client-side API calls, no API key in the browser.</li>
  </ol>
  <p>
    Total upstream requests: <strong>~80 per day</strong>. Well inside any reasonable rate limit.
  </p>
</section>

<section>
  <h2>Licensing</h2>
  <p>
    Upstream data is published as open air quality data, typically under
    <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
    This site does not relicense the data; all original attribution and license
    terms apply to the upstream sources.
  </p>
  <p>
    The site code is <a href="https://github.com/urbanmorph/oaq/blob/main/LICENSE">MIT-licensed</a>.
  </p>
</section>

<section>
  <h2>Update cadence</h2>
  <ul>
    <li>Snapshot refresh: every hour on the 5-minute mark.</li>
    <li>Station metadata (names, coordinates) refresh: daily at 02:00 IST.</li>
    <li>Upstream CPCB data itself updates ~hourly, so polling faster would return identical data.</li>
  </ul>
</section>
`,
  });
}

export function renderAbout(siteUrl: string): string {
  return layout({
    title: "About | oaq",
    description:
      "About the oaq mirror — why it exists, how it's built, and how it differs from oaq.notf.in.",
    canonical: `${siteUrl}/about`,
    siteUrl,
    body: `
<header>
  <h1>About</h1>
</header>

<section>
  <h2>What this is</h2>
  <p>
    An unofficial, open-source, single-page mirror of <a href="https://oaq.notf.in">oaq.notf.in</a>.
    Same data, rendered as a plain-text leaderboard: Worst 50, Best 50, and every
    city's full station list as collapsible sections.
  </p>
  <p>
    Built for humans who want a fast page and for AI agents who want a
    machine-readable one. Every station has HTML, JSON, and Markdown variants.
  </p>
</section>

<section>
  <h2>Why</h2>
  <p>
    oaq.notf.in is a great data broker, but its UI is a client-rendered SPA —
    empty HTML shell, 1.3 MB JS bundle, zero server-rendered content. Search engines
    and LLM crawlers see a blank page. This mirror is the opposite: server-rendered
    HTML, ~26 KB total page weight, fully indexable.
  </p>
</section>

<section>
  <h2>Stack</h2>
  <ul>
    <li>Static HTML generated by a 200-line TypeScript build script. No framework.</li>
    <li>CSS + JS base: <a href="https://oat.ink">Oat</a> by Kailash Nadh — ~8 KB, zero dependencies.</li>
    <li>Hosted on <a href="https://pages.cloudflare.com/">Cloudflare Pages</a>. Refresh cron on Cloudflare Workers. Snapshot cache in R2. Free tier.</li>
  </ul>
</section>

<section>
  <h2>Acknowledgements</h2>
  <ul>
    <li><strong>Data</strong> — <a href="https://oaq.notf.in">oaq.notf.in</a>, the Open Air Quality data broker.</li>
    <li><strong>Upstream sources</strong> — CPCB (Government of India), Airnet (<a href="https://cstep.in">CSTEP</a>), Aurassure.</li>
    <li><strong>UI library</strong> — <a href="https://oat.ink">Oat</a> by <a href="https://github.com/knadh">Kailash Nadh</a>.</li>
    <li><strong>Map tiles</strong> — not used. This site is text-only.</li>
  </ul>
</section>

<section>
  <h2>Not affiliated</h2>
  <p>
    This project is not affiliated with OAQ, Oat, CPCB, CSTEP, or Aurassure.
    All trademarks belong to their respective owners.
  </p>
</section>

<section>
  <h2>Source code</h2>
  <p>
    <a href="https://github.com/urbanmorph/oaq">github.com/urbanmorph/oaq</a> — MIT license.
  </p>
</section>
`,
  });
}
