import { refreshLatest } from "./refresh";
import { getSignature } from "./handshake";

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

    if (url.pathname === "/health") {
      return Response.json({ ok: true, ts: new Date().toISOString() });
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
