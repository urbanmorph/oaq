import type { NormalizedStation, Snapshot, ProviderId } from "./types";

const PROVIDER_NAMES: Record<ProviderId, string> = {
  cpcb: "Central Pollution Control Board, Government of India",
  airnet: "Center for Study of Science, Technology and Policy (CSTEP)",
  aurassure: "Aurassure University Clean Air Network",
};

const BAND_LABELS: Record<NormalizedStation["band"], string> = {
  good: "Good",
  satisfactory: "Satisfactory",
  moderate: "Moderate",
  poor: "Poor",
  vpoor: "Very Poor",
  severe: "Severe",
  unknown: "—",
};

function n(v: number | undefined | null): string {
  return v === undefined || v === null || !Number.isFinite(v) ? "—" : String(v);
}

function row(s: NormalizedStation, rank: number): string {
  const c = [
    String(rank),
    s.name.replace(/\|/g, "\\|"),
    s.city.replace(/\|/g, "\\|"),
    s.provider,
    n(s.pollutants.pm25),
    n(s.aqi),
    BAND_LABELS[s.band],
  ];
  return `| ${c.join(" | ")} |`;
}

/**
 * Render the full leaderboard snapshot as Markdown. Designed to be read by
 * LLM crawlers — short frontmatter, three clearly-labeled sections, pipe tables.
 */
export function renderSnapshotMarkdown(snap: Snapshot, siteUrl: string): string {
  const withAqi = snap.stations.filter((s) => s.aqi !== null);
  const worst = withAqi.slice(0, 50);
  const best = [...withAqi].sort((a, b) => (a.aqi! - b.aqi!)).slice(0, 50);

  const byCity = new Map<string, NormalizedStation[]>();
  for (const s of snap.stations) {
    const key = s.city.trim() || "Unknown";
    const arr = byCity.get(key) ?? [];
    arr.push(s);
    byCity.set(key, arr);
  }
  const cities = [...byCity.entries()]
    .map(([name, arr]) => {
      const valid = arr.filter((s) => s.aqi !== null);
      const avg = valid.length
        ? Math.round(valid.reduce((a, s) => a + (s.aqi as number), 0) / valid.length)
        : null;
      return { name, arr, avg };
    })
    .sort((a, b) => {
      if (a.avg === null && b.avg === null) return a.name.localeCompare(b.name);
      if (a.avg === null) return 1;
      if (b.avg === null) return -1;
      return b.avg - a.avg;
    });

  const head = [
    "---",
    `generated_at: ${snap.generated_at}`,
    `station_count: ${snap.station_count}`,
    `source: https://oaq.notf.in`,
    `mirror: ${siteUrl}`,
    `providers:`,
    ...snap.providers.map((p) => `  - ${p}: ${PROVIDER_NAMES[p]}`),
    "---",
    "",
    "# India Air Quality Leaderboard",
    "",
    `Updated ${snap.generated_at}. ${snap.station_count} stations ranked by CPCB AQI (worst first). Mirrored hourly from [oaq.notf.in](https://oaq.notf.in).`,
    "",
    "## Worst 50",
    "",
    "| Rank | Station | City | Provider | PM2.5 µg/m³ | AQI | Band |",
    "|---|---|---|---|---|---|---|",
    ...worst.map((s, i) => row(s, i + 1)),
    "",
    "## Best 50",
    "",
    "| Rank | Station | City | Provider | PM2.5 µg/m³ | AQI | Band |",
    "|---|---|---|---|---|---|---|",
    ...best.map((s, i) => row(s, i + 1)),
    "",
    "## By city",
    "",
  ].join("\n");

  const cityBlocks = cities
    .map(({ name, arr, avg }) => {
      return [
        `### ${name} — ${arr.length} stations${avg !== null ? `, avg AQI ${avg}` : ""}`,
        "",
        "| Station | Provider | PM2.5 | AQI | Band |",
        "|---|---|---|---|---|",
        ...arr.map(
          (s) =>
            `| ${s.name.replace(/\|/g, "\\|")} | ${s.provider} | ${n(s.pollutants.pm25)} | ${n(
              s.aqi,
            )} | ${BAND_LABELS[s.band]} |`,
        ),
        "",
      ].join("\n");
    })
    .join("\n");

  const foot = [
    "## Source",
    "",
    `Data from CPCB, Airnet (CSTEP), and Aurassure via the OAQ Data Broker (https://oaq.notf.in). Mirrored hourly. Licensed CC BY 4.0.`,
    "",
    `This document is an open-source mirror — see ${siteUrl}/about.`,
    "",
  ].join("\n");

  return head + cityBlocks + "\n" + foot;
}

/**
 * Render a single station page as Markdown with YAML frontmatter.
 */
export function renderStationMarkdown(
  s: NormalizedStation,
  generatedAt: string,
  siteUrl: string,
): string {
  const bandLabel = BAND_LABELS[s.band];
  const lines = [
    "---",
    `station_id: ${s.id}`,
    `raw_id: ${s.raw_id}`,
    `name: ${JSON.stringify(s.name)}`,
    `city: ${JSON.stringify(s.city)}`,
    `state: ${JSON.stringify(s.state)}`,
    `country: India`,
    `provider: ${s.provider}`,
    `provider_name: ${JSON.stringify(PROVIDER_NAMES[s.provider])}`,
    `lat: ${s.lat ?? "null"}`,
    `lon: ${s.lon ?? "null"}`,
    `aqi: ${s.aqi ?? "null"}`,
    `band: ${s.band}`,
    `updated: ${generatedAt}`,
    `source: https://oaq.notf.in`,
    `mirror: ${siteUrl}/s/${s.provider}/${s.raw_id}`,
    "---",
    "",
    `# ${s.name} — Air Quality`,
    "",
    s.aqi !== null
      ? `Current AQI: **${s.aqi} (${bandLabel})** as of ${generatedAt}.`
      : `No AQI available as of ${generatedAt}.`,
    "",
    `Located in ${s.city || "—"}${s.state ? `, ${s.state}` : ""}, India. Source: **${PROVIDER_NAMES[s.provider]}** via OAQ.`,
    "",
    "## Pollutants",
    "",
    "| Pollutant | Value | Unit |",
    "|---|---|---|",
    ...Object.entries(s.pollutants)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => {
        const unit = k === "co" ? "mg/m³" : "µg/m³";
        const label =
          k === "pm25" ? "PM2.5" : k === "pm10" ? "PM10" : k === "no2" ? "NO₂" : k === "so2" ? "SO₂" : k === "nh3" ? "NH₃" : k.toUpperCase();
        return `| ${label} | ${v} | ${unit} |`;
      }),
    "",
    "## Location",
    "",
    s.lat !== null && s.lon !== null
      ? `- Coordinates: ${s.lat.toFixed(4)}° N, ${s.lon.toFixed(4)}° E`
      : "- Coordinates: not available",
    "",
    "## Source",
    "",
    `Data from ${PROVIDER_NAMES[s.provider]} via OAQ Data Broker (https://oaq.notf.in). Mirrored hourly. Licensed CC BY 4.0.`,
    "",
    `Part of an open-source mirror — see ${siteUrl}/about.`,
    "",
  ];
  return lines.join("\n");
}
