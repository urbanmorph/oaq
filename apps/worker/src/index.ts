import { refreshLatest } from "./refresh";
import { getSignature } from "./handshake";
import { renderSnapshotMarkdown, renderStationMarkdown } from "./formats";
import type { Snapshot, NormalizedStation } from "./types";

export interface Env {
  OAQ_KV: KVNamespace;
  OAQ_R2: R2Bucket;
  OAQ_API_KEY: string;
  OAQ_BROKER_URL: string;
  OAQ_BASE_URL: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    const SITE_URL = "https://oaq.pages.dev"; // TODO: wire via env at Phase 5

    if (url.pathname === "/health") {
      return Response.json({ ok: true, ts: new Date().toISOString() });
    }

    // Cached snapshot loader — used by /index.{json,md} and /s/*.json|.md.
    async function loadSnapshot(): Promise<Snapshot | null> {
      const obj = await env.OAQ_R2.get("data/latest.json");
      if (!obj) return null;
      return (await obj.json()) as Snapshot;
    }

    // Leaderboard JSON.
    if (url.pathname === "/index.json") {
      const snap = await loadSnapshot();
      if (!snap) return new Response("no snapshot yet", { status: 503 });
      return new Response(JSON.stringify(snap), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, s-maxage=900, stale-while-revalidate=3600",
          "access-control-allow-origin": "*",
        },
      });
    }

    // Leaderboard Markdown.
    if (url.pathname === "/index.md") {
      const snap = await loadSnapshot();
      if (!snap) return new Response("no snapshot yet", { status: 503 });
      return new Response(renderSnapshotMarkdown(snap, SITE_URL), {
        headers: {
          "content-type": "text/markdown; charset=utf-8",
          "cache-control": "public, s-maxage=900, stale-while-revalidate=3600",
          "access-control-allow-origin": "*",
        },
      });
    }

    // Per-station JSON / Markdown: /s/{provider}/{raw_id}.{json,md}
    const stationMatch = url.pathname.match(/^\/s\/([^/]+)\/([^/.]+)\.(json|md)$/);
    if (stationMatch) {
      const [, provider, rawId, ext] = stationMatch;
      const snap = await loadSnapshot();
      if (!snap) return new Response("no snapshot yet", { status: 503 });
      const station = snap.stations.find(
        (s: NormalizedStation) => s.provider === provider && s.raw_id === rawId,
      );
      if (!station) return new Response("station not found", { status: 404 });
      if (ext === "json") {
        return new Response(
          JSON.stringify({ generated_at: snap.generated_at, station }),
          {
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "public, s-maxage=900, stale-while-revalidate=3600",
              "access-control-allow-origin": "*",
            },
          },
        );
      }
      return new Response(renderStationMarkdown(station, snap.generated_at, SITE_URL), {
        headers: {
          "content-type": "text/markdown; charset=utf-8",
          "cache-control": "public, s-maxage=900, stale-while-revalidate=3600",
          "access-control-allow-origin": "*",
        },
      });
    }

    // Public R2 proxy for dev and for the build script. In production we'll
    // front R2 with a custom domain and skip this hop, but during local dev
    // the build script fetches http://127.0.0.1:8787/data/latest.json.
    if (url.pathname.startsWith("/data/")) {
      const key = url.pathname.slice(1); // "data/latest.json"
      const obj = await env.OAQ_R2.get(key);
      if (!obj) return new Response("not found", { status: 404 });
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set("cache-control", "public, max-age=60");
      return new Response(obj.body, { headers });
    }

    // Manual trigger for local dev & smoke tests: /refresh?key=OAQ_API_KEY.
    if (url.pathname === "/refresh") {
      const key = url.searchParams.get("key");
      if (key !== env.OAQ_API_KEY) return new Response("unauthorized", { status: 401 });
      try {
        const snap = await refreshLatest(env);
        return Response.json({
          ok: true,
          generated_at: snap.generated_at,
          station_count: snap.station_count,
          providers: snap.providers,
          sample: snap.stations.slice(0, 3),
        });
      } catch (e) {
        return Response.json({ ok: false, error: String(e) }, { status: 500 });
      }
    }

    // Debug: peek at the current signature without exposing it.
    if (url.pathname === "/sig") {
      const key = url.searchParams.get("key");
      if (key !== env.OAQ_API_KEY) return new Response("unauthorized", { status: 401 });
      const sig = await getSignature(env);
      return Response.json({
        baseUrl: sig.baseUrl,
        expires: sig.expires,
        expires_iso: new Date(sig.expires * 1000).toISOString(),
        signature_prefix: sig.signature.slice(0, 24) + "…",
      });
    }

    return new Response("oaq-worker — /health, /refresh, /sig", {
      headers: { "content-type": "text/plain" },
    });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log("[scheduled]", event.cron, new Date(event.scheduledTime).toISOString());
    // Hourly refresh.
    if (event.cron === "5 * * * *") {
      ctx.waitUntil(
        refreshLatest(env).then(
          (snap) => console.log(`[refresh] ${snap.station_count} stations`),
          (e) => console.error("[refresh] failed:", e),
        ),
      );
    }
    // Daily hierarchy refresh lands in a follow-up commit (Phase 2.1).
  },
};
