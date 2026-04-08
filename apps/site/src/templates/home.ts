import type { Snapshot, NormalizedStation, CityGroup } from "../types";
import { BAND_LABELS } from "../types";
import { esc, fmtNum, formatUpdated, groupByCity } from "../util";
import { layout } from "./layout";

function bandLabel(b: NormalizedStation["band"]): string {
  return BAND_LABELS[b];
}

function stationHref(s: NormalizedStation): string {
  return `/s/${encodeURIComponent(s.provider)}/${encodeURIComponent(s.raw_id)}`;
}

function rowNumbered(n: number, s: NormalizedStation): string {
  return `<tr>
<td class="num">${n}</td>
<td><a href="${esc(stationHref(s))}">${esc(s.name)}</a></td>
<td>${esc(s.city)}</td>
<td class="num">${fmtNum(s.pollutants.pm25, 0)}</td>
<td class="num"><strong>${fmtNum(s.aqi, 0)}</strong></td>
<td><span class="band ${esc(s.band)}">${esc(bandLabel(s.band))}</span></td>
</tr>`;
}

function row(s: NormalizedStation): string {
  return `<tr>
<td><a href="${esc(stationHref(s))}">${esc(s.name)}</a></td>
<td>${esc(s.provider)}</td>
<td class="num">${fmtNum(s.pollutants.pm25, 0)}</td>
<td class="num"><strong>${fmtNum(s.aqi, 0)}</strong></td>
<td><span class="band ${esc(s.band)}">${esc(bandLabel(s.band))}</span></td>
</tr>`;
}

function table(header: string, body: string): string {
  return `<table>
<thead><tr>${header}</tr></thead>
<tbody>${body}</tbody>
</table>`;
}

function cityDetails(g: CityGroup, open: boolean): string {
  const rows = g.stations.map(row).join("\n");
  const avg = g.avgAqi !== null ? `avg AQI ${g.avgAqi}` : "no AQI data";
  const stationWord = g.stations.length === 1 ? "station" : "stations";
  return `<details id="${esc(g.slug)}"${open ? " open" : ""}>
<summary><h3>${esc(g.name)} — ${g.stations.length} ${stationWord} · ${esc(avg)}</h3></summary>
${table(
    `<th>Station</th><th>Provider</th><th class="num">PM2.5</th><th class="num">AQI</th><th>Band</th>`,
    rows,
  )}
</details>`;
}

export function renderHome(snap: Snapshot, siteUrl: string): string {
  const groups = groupByCity(snap.stations);
  const withAqi = snap.stations.filter((s) => s.aqi !== null) as (NormalizedStation & { aqi: number })[];
  const worst = withAqi.slice(0, 50); // already sorted worst first
  const best = [...withAqi].sort((a, b) => a.aqi - b.aqi).slice(0, 50);
  const updated = formatUpdated(snap.generated_at);

  const top5Worst = worst.slice(0, 5);
  const description = `India air quality leaderboard. ${snap.station_count} stations ranked live. Worst right now: ${
    top5Worst.map((s) => `${s.name}, ${s.city} (AQI ${s.aqi})`).join("; ") || "—"
  }. Updated ${updated.absolute}.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "India air quality — worst 50 stations",
    "dateModified": snap.generated_at,
    "numberOfItems": worst.length,
    "itemListElement": worst.map((s, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": `${s.name}, ${s.city}`,
      "url": `${siteUrl}/s/${s.provider}/${s.raw_id}`,
      "description": `AQI ${s.aqi} (${BAND_LABELS[s.band]}) · PM2.5 ${s.pollutants.pm25 ?? "—"} µg/m³`,
    })),
  };

  const body = `
<header class="hero">
  <h1>India air quality, ranked.</h1>
  <p class="muted">
    ${snap.station_count} stations · ${snap.providers.join(" · ")}<br />
    Updated ${esc(updated.absolute)} · ${esc(updated.relative)}
  </p>
  <p class="muted">
    Formats: <a href="/index.json">/index.json</a> · <a href="/index.md">/index.md</a>
  </p>
</header>

<section id="worst">
  <h2>Worst 50</h2>
  ${table(
    `<th class="num">#</th><th>Station</th><th>City</th><th class="num">PM2.5</th><th class="num">AQI</th><th>Band</th>`,
    worst.map((s, i) => rowNumbered(i + 1, s)).join("\n"),
  )}
</section>

<section id="best">
  <h2>Best 50</h2>
  ${table(
    `<th class="num">#</th><th>Station</th><th>City</th><th class="num">PM2.5</th><th class="num">AQI</th><th>Band</th>`,
    best.map((s, i) => rowNumbered(i + 1, s)).join("\n"),
  )}
</section>

<section id="all">
  <h2>All stations by city</h2>
  <p>
    <input type="search" id="city-filter" placeholder="search your city…  (try &quot;delhi&quot;, &quot;ghazi&quot;, &quot;bengal&quot;)" autocomplete="off" />
  </p>
  ${groups.map((g, i) => cityDetails(g, i < 5)).join("\n")}
</section>

<script src="/filter.js" defer></script>
`;

  return layout({
    title: `India Air Quality Leaderboard — ${snap.station_count} stations ranked live | oaq`,
    description,
    canonical: siteUrl + "/",
    siteUrl,
    body,
    jsonLd,
  });
}
