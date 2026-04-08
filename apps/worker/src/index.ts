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
    return new Response("oaq-worker — see /health", {
      headers: { "content-type": "text/plain" },
    });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Phase 2 will implement: hourly refresh at "5 * * * *",
    // daily hierarchy refresh at "30 20 * * *".
    console.log("scheduled trigger", event.cron, "at", new Date(event.scheduledTime).toISOString());
  },
};
