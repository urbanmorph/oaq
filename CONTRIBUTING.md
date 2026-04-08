# Contributing

Thanks for your interest. This is a small project; contributions welcome.

## Setup

```bash
pnpm install
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# fill in OAQ_API_KEY and CLOUDFLARE_API_TOKEN
pnpm dev:worker   # runs wrangler dev
pnpm dev:site     # builds dist/ and watches
```

## Ground rules
- Zero client-side JavaScript beyond the ~1 KB Oat base and the tiny filter script.
- No frameworks on the site (Astro/Next/Svelte/React). It's a `build.ts` that renders templates.
- Semantic HTML first. Classes only where Oat doesn't cover the need.
- Conventional commits encouraged (`feat:`, `fix:`, `docs:`, `chore:`).

## Before opening a PR
- `pnpm -r typecheck` passes.
- `pnpm build:site` produces a valid `dist/`.
- Lighthouse scores don't regress (CI enforces this).
