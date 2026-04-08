export type ProviderId = "cpcb" | "airnet" | "aurassure";

export const PROVIDERS: ProviderId[] = ["cpcb", "airnet", "aurassure"];

export interface Signature {
  baseUrl: string;   // "https://oaq.notf.in/v1/"
  signature: string; // "URLPrefix=…&Expires=…&KeyName=…&Signature=…"
  expires: number;   // unix seconds
}

// Shape of OAQ's upstream all_stations_latest.json (best-effort; fields are
// defensively optional because the API is undocumented).
export interface UpstreamStation {
  id?: string | number;
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  pollutants?: Record<string, number | null | undefined>;
  readings?: Record<string, number | null | undefined>;
  timestamp?: string;
  last_updated?: string;
  [k: string]: unknown;
}

export interface NormalizedStation {
  id: string;            // "{provider}-{raw_id}" — globally unique
  raw_id: string;        // upstream id, as-is (may contain hyphens)
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
  band: "good" | "satisfactory" | "moderate" | "poor" | "vpoor" | "severe" | "unknown";
  ts: string | null;
}

export interface Snapshot {
  generated_at: string;
  station_count: number;
  providers: ProviderId[];
  stations: NormalizedStation[];
}
