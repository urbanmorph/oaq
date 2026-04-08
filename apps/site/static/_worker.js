// Cloudflare Pages advanced mode: single worker that handles dynamic routes
// by proxying to the oaq-worker, and serves all other paths as static assets.
//
// Pages' _redirects does not support 200 (proxy) with external destinations,
// so we use this tiny worker instead. Everything stays on a single origin
// (oaq.pages.dev), which is what crawlers and LLM agents want.

const WORKER = "https://oaq-worker.knerav.workers.dev";

const DYNAMIC = [
  /^\/index\.(json|md)$/,
  /^\/s\/[^/]+\/[^/.]+\.(json|md)$/,
  /^\/og\/s\/[^/]+\/[^/.]+\.png$/,
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (DYNAMIC.some((re) => re.test(url.pathname))) {
      return fetch(WORKER + url.pathname + url.search, {
        method: request.method,
        headers: request.headers,
        body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      });
    }
    return env.ASSETS.fetch(request);
  },
};
