// Mirrors apps/worker/src/types.ts — kept local so the site has no runtime dep on the worker.
export type ProviderId = "cpcb" | "airnet" | "aurassure";
export type Band = "good" | "satisfactory" | "moderate" | "poor" | "vpoor" | "severe" | "unknown";

export interface NormalizedStation {
  id: string;
  raw_id: string;
  provider: ProviderId;
  name: string;
  city: string;
  state: string;
  lat: number | null;
  lon: number | null;
  pollutants: {
    pm25?: number;
    pm10?: number;
    no2?: number;
    so2?: number;
    co?: number;
    o3?: number;
    nh3?: number;
  };
  aqi: number | null;
  band: Band;
  ts: string | null;
}

export interface Snapshot {
  generated_at: string;
  station_count: number;
  providers: ProviderId[];
  stations: NormalizedStation[];
}

export interface CityGroup {
  slug: string;
  name: string;
  stations: NormalizedStation[];
  avgAqi: number | null;
  worstAqi: number | null;
}

export const BAND_LABELS: Record<Band, string> = {
  good: "Good",
  satisfactory: "Satisfactory",
  moderate: "Moderate",
  poor: "Poor",
  vpoor: "Very Poor",
  severe: "Severe",
  unknown: "—",
};
