import type { NormalizedStation } from "../types";
import { BAND_LABELS } from "../types";
import { esc, fmtNum, formatUpdated } from "../util";
import { layout } from "./layout";

const POLLUTANT_META: { key: keyof NormalizedStation["pollutants"]; label: string; unit: string; digits: number }[] = [
  { key: "pm25", label: "PM2.5", unit: "µg/m³", digits: 1 },
  { key: "pm10", label: "PM10", unit: "µg/m³", digits: 1 },
  { key: "no2", label: "NO₂", unit: "µg/m³", digits: 1 },
  { key: "so2", label: "SO₂", unit: "µg/m³", digits: 1 },
  { key: "co", label: "CO", unit: "mg/m³", digits: 2 },
  { key: "o3", label: "O₃", unit: "µg/m³", digits: 1 },
  { key: "nh3", label: "NH₃", unit: "µg/m³", digits: 1 },
];

export function renderStation(s: NormalizedStation, generatedAt: string, siteUrl: string): string {
  const updated = formatUpdated(generatedAt);
  const rawId = s.id.split("-").slice(1).join("-");
  const canonical = `${siteUrl}/s/${s.provider}/${rawId}`;
  const bandLabel = BAND_LABELS[s.band];

  const rows = POLLUTANT_META.filter((m) => s.pollutants[m.key] !== undefined)
    .map(
      (m) =>
        `<tr><td>${m.label}</td><td class="num">${fmtNum(s.pollutants[m.key], m.digits)}</td><td class="muted">${m.unit}</td></tr>`,
    )
    .join("\n");

  const description = s.aqi !== null
    ? `${s.name}, ${s.city} — AQI ${s.aqi} (${bandLabel}), PM2.5 ${fmtNum(s.pollutants.pm25, 0)} µg/m³ as of ${updated.absolute}. Live air quality from ${s.provider.toUpperCase()} via OAQ.`
    : `${s.name}, ${s.city} — air quality readings from ${s.provider.toUpperCase()} via OAQ. Updated ${updated.absolute}.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": `${s.name}, ${s.city} — live air quality`,
    "description": description,
    "creator": {
      "@type": "Organization",
      "name":
        s.provider === "cpcb"
          ? "Central Pollution Control Board, Government of India"
          : s.provider === "airnet"
          ? "Center for Study of Science, Technology and Policy (CSTEP)"
          : "Aurassure University Clean Air Network",
    },
    "spatialCoverage": s.lat !== null && s.lon !== null
      ? {
          "@type": "Place",
          "geo": { "@type": "GeoCoordinates", "latitude": s.lat, "longitude": s.lon },
          "name": `${s.name}, ${s.city}`,
        }
      : undefined,
    "dateModified": generatedAt,
    "distribution": [
      { "@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": `${canonical}.json` },
      { "@type": "DataDownload", "encodingFormat": "text/markdown", "contentUrl": `${canonical}.md` },
    ],
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "isBasedOn": "https://oaq.notf.in",
  };

  const body = `
<p><a href="/">← Back to leaderboard</a></p>

<header>
  <h1>${esc(s.name)}</h1>
  <p class="muted">${esc(s.city)}${s.state ? `, ${esc(s.state)}` : ""} · ${esc(s.provider.toUpperCase())} · station #${esc(rawId)}</p>
</header>

<section class="aqi-hero">
  <div class="aqi-big">${s.aqi !== null ? fmtNum(s.aqi, 0) : "—"}</div>
  <div>
    <span class="band ${esc(s.band)}">${esc(bandLabel)}</span>
    <p class="muted">as of ${esc(updated.absolute)} · ${esc(updated.relative)}</p>
  </div>
</section>

<section>
  <h2>Pollutants</h2>
  <table>
    <thead><tr><th>Pollutant</th><th>Value</th><th>Unit</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="3" class="muted">No pollutant data available.</td></tr>`}</tbody>
  </table>
</section>

<section>
  <h2>Metadata</h2>
  <dl>
    ${s.lat !== null && s.lon !== null ? `<dt>Coordinates</dt><dd>${s.lat.toFixed(4)}° N, ${s.lon.toFixed(4)}° E</dd>` : ""}
    <dt>Source</dt><dd>${esc(s.provider.toUpperCase())} via <a href="https://oaq.notf.in">OAQ Data Broker</a></dd>
    <dt>Snapshot time</dt><dd>${esc(updated.absolute)}</dd>
  </dl>
</section>

<section>
  <h2>Data formats</h2>
  <ul>
    <li><a href="${esc(canonical)}.json">JSON</a></li>
    <li><a href="${esc(canonical)}.md">Markdown</a> — LLM-friendly</li>
    <li><a href="/docs/api">API reference</a></li>
  </ul>
</section>
`;

  return layout({
    title: `${s.name}, ${s.city} — Air Quality${s.aqi !== null ? ` AQI ${s.aqi} (${bandLabel})` : ""} | oaq`,
    description,
    canonical,
    siteUrl,
    body,
    jsonLd,
  });
}
