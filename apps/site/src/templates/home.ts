import type { Snapshot, NormalizedStation, CityGroup } from "../types";
import { BAND_LABELS } from "../types";
import { esc, fmtNum, formatUpdated, groupByCity } from "../util";
import { layout } from "./layout";
import { lifeYearsLost } from "../aqli";

// 5-bucket quantile scale computed once per build over all stations with a
// valid YLL value. Returns the 4 thresholds (20/40/60/80 percentiles) so
// every row can be classified in O(log n) or O(1).
function computeYllThresholds(stations: NormalizedStation[]): number[] {
  const vals = stations
    .map((s) => lifeYearsLost(s.pollutants.pm25))
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  if (vals.length === 0) return [0, 0, 0, 0];
  const q = (p: number) => vals[Math.min(vals.length - 1, Math.floor(vals.length * p))];
  return [q(0.2), q(0.4), q(0.6), q(0.8)];
}

function yllBucket(years: number, thresholds: number[]): 1 | 2 | 3 | 4 | 5 {
  if (years <= thresholds[0]) return 1;
  if (years <= thresholds[1]) return 2;
  if (years <= thresholds[2]) return 3;
  if (years <= thresholds[3]) return 4;
  return 5;
}

function yllCell(s: NormalizedStation, thresholds: number[]): string {
  const y = lifeYearsLost(s.pollutants.pm25);
  if (y === null) return `<td class="num"><span class="band unknown">—</span></td>`;
  const b = yllBucket(y, thresholds);
  return `<td class="num"><span class="yll yll-${b}">${y.toFixed(1)} yr</span></td>`;
}

function bandLabel(b: NormalizedStation["band"]): string {
  return BAND_LABELS[b];
}

function stationHref(s: NormalizedStation): string {
  return `/s/${encodeURIComponent(s.provider)}/${encodeURIComponent(s.raw_id)}`;
}

function rowNumbered(n: number, s: NormalizedStation, thresholds: number[]): string {
  return `<tr>
<td class="num">${n}</td>
<td><a href="${esc(stationHref(s))}">${esc(s.name)}</a></td>
<td>${esc(s.city)}</td>
<td class="num">${fmtNum(s.pollutants.pm25, 0)}</td>
<td class="num"><strong>${fmtNum(s.aqi, 0)}</strong></td>
<td><span class="band ${esc(s.band)}">${esc(bandLabel(s.band))}</span></td>
${yllCell(s, thresholds)}
</tr>`;
}

function row(s: NormalizedStation, thresholds: number[]): string {
  return `<tr>
<td><a href="${esc(stationHref(s))}">${esc(s.name)}</a></td>
<td>${esc(s.provider)}</td>
<td class="num">${fmtNum(s.pollutants.pm25, 0)}</td>
<td class="num"><strong>${fmtNum(s.aqi, 0)}</strong></td>
<td><span class="band ${esc(s.band)}">${esc(bandLabel(s.band))}</span></td>
${yllCell(s, thresholds)}
</tr>`;
}

function table(header: string, body: string): string {
  return `<table>
<thead><tr>${header}</tr></thead>
<tbody>${body}</tbody>
</table>`;
}

function cityDetails(g: CityGroup, open: boolean, thresholds: number[]): string {
  const rows = g.stations.map((s) => row(s, thresholds)).join("\n");
  const avg = g.avgAqi !== null ? `avg AQI ${g.avgAqi}` : "no AQI data";
  const stationWord = g.stations.length === 1 ? "station" : "stations";
  return `<details id="${esc(g.slug)}"${open ? " open" : ""}>
<summary><h3>${esc(g.name)} — ${g.stations.length} ${stationWord} · ${esc(avg)}</h3></summary>
${table(
    `<th>Station</th><th>Provider</th><th class="num">PM2.5</th><th class="num">AQI</th><th>Band</th><th class="num" title="Years of life expectancy lost if this PM2.5 level persisted annually (AQLI vs WHO 5 µg/m³ guideline)">Yrs lost</th>`,
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
  const yllThresholds = computeYllThresholds(snap.stations);

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

<p class="muted small">
  <strong>Yrs lost</strong> column = years of life expectancy lost if this station's PM2.5 level persisted as the annual average, per the
  <a href="https://aqli.epic.uchicago.edu/about/the-index/">Air Quality Life Index</a> (Greenstone et al., U Chicago EPIC; Ebenstein et al. 2017 PNAS)
  applied against the WHO 5 µg/m³ guideline.
  <a href="/docs/data-sources#health-impact">Methodology &amp; caveats →</a>
</p>

<section id="worst">
  <h2>Worst 50</h2>
  ${table(
    `<th class="num">#</th><th>Station</th><th>City</th><th class="num">PM2.5</th><th class="num">AQI</th><th>Band</th><th class="num" title="Years of life expectancy lost if this PM2.5 level persisted annually (AQLI vs WHO 5 µg/m³ guideline)">Yrs lost</th>`,
    worst.map((s, i) => rowNumbered(i + 1, s, yllThresholds)).join("\n"),
  )}
</section>

<section id="best">
  <h2>Best 50</h2>
  ${table(
    `<th class="num">#</th><th>Station</th><th>City</th><th class="num">PM2.5</th><th class="num">AQI</th><th>Band</th><th class="num" title="Years of life expectancy lost if this PM2.5 level persisted annually (AQLI vs WHO 5 µg/m³ guideline)">Yrs lost</th>`,
    best.map((s, i) => rowNumbered(i + 1, s, yllThresholds)).join("\n"),
  )}
</section>

<section id="all">
  <h2>All stations by city</h2>
  <p>
    <input type="search" id="city-filter" placeholder="search your city…  (try &quot;delhi&quot;, &quot;ghazi&quot;, &quot;bengal&quot;)" autocomplete="off" />
  </p>
  ${groups.map((g, i) => cityDetails(g, i < 5, yllThresholds)).join("\n")}
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
