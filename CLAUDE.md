## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Deployment (Cloudflare Workers)

- Public site: https://www.victorgomezdejuan.com
- Hosted on **Cloudflare Workers** (not Cloudflare Pages), via a git-connected "Workers Builds" project named `website`. Build command: `npm run build`. Deploy command: `npx wrangler deploy`.
- `astro.config.mjs` has no adapter — the site builds as plain static output (`output: "static"`), and `wrangler.jsonc` deploys `dist/` as static assets only (`assets.directory`, no `main` entrypoint). Do not add `@astrojs/cloudflare` or a `main` entrypoint to `wrangler.jsonc` unless you deliberately intend to move the whole site to SSR.
- **Critical gotcha (bit us on 2026-07-25):** if `wrangler.jsonc` is ever missing from the repo, `npx wrangler deploy` auto-detects "Framework: Astro" and, in non-interactive CI, silently answers "yes" to running `astro add cloudflare`. That installs the `@astrojs/cloudflare` SSR adapter and switches image handling to a "Cloudflare Images" binding — which isn't provisioned on this account, so every image on the site 404s via Astro's `/_image` endpoint. This happens on *every* deploy that lacks the config file; it is not tied to any git branch or build cache. Keep `wrangler.jsonc` committed and do not delete it.
- A bot (`cloudflare-workers-and-pages[bot]`) periodically recreates a branch `cloudflare/workers-autoconfig` and opens a PR that adds the SSR adapter + its own `wrangler.jsonc` (with a `main` entrypoint). **Do not merge that PR** — it reintroduces the broken image pipeline described above. If images break again in production, check first whether that branch got auto-deployed: in the Cloudflare dashboard, Workers & Pages → `website` → Settings → Build → Branch control has a "Builds for non-production branches" toggle; if it's enabled, that bot branch can build and deploy straight to production (this project has no preview/production environment separation), silently overwriting the working static deploy. Disable that toggle if this keeps recurring.
- Local `astro build` succeeding does **not** prove production is correct — `wrangler deploy` can transform the build (see gotcha above). When diagnosing a production-only issue, pull the actual build log from Cloudflare (Workers & Pages → `website` → Deployments → the deployment → "View build") rather than trusting a local rebuild.
- `astro.config.mjs`'s `site` must stay `https://www.victorgomezdejuan.com` (it was wrongly `https://example.com` until 2026-07-25, which broke canonical URLs and `og:url` on every page).

## Project context and content workflow

- The domain is managed through Arsys, DNS/hosting through Cloudflare.
- This is an Astro blog. Its source of truth is the GitHub repository `victorgomezdejuan/website`; Notion is the source of truth for article drafts.
- The project uses Astro Content Collections. Before modifying content, always inspect the actual collection structure, frontmatter schema, image paths, and existing project conventions. Do not assume them.
- Files under `sources/` are reference-only: never edit or remove them.

### Publishing an article from Notion

When asked to publish an article:

1. Read the specified Notion page in full, including every image.
2. Only remove test posts when explicitly instructed to do so.
3. Convert the content to the exact format expected by the project's Astro Content Collection.
4. Download every article image into the repository and use local paths; do not leave temporary Notion image URLs. Preserve relevant external links.
5. Build the project, resolve conversion-related errors, and report the modified files and build result.
6. Create a descriptive commit and push it to GitHub automatically so Cloudflare can deploy it, unless the user explicitly asks not to. Report the resulting commit hash and link. Note: a green local build is not enough — see the deployment gotchas above before declaring a publish "done".

### Current published content

- "Cómo empezar a usar GitHub Copilot en un equipo de desarrollo de software (sin alardes)" is published in `src/content/blog/empezar-github-copilot-equipo.md`.
- Its local images are in `src/assets/copilot-team/`.
- Publication commit: `212b96c`.

## Site branding — known gaps

`src/components/Header.astro` and `Footer.astro` originally shipped with the unmodified Astro starter's social links (Mastodon/Twitter/GitHub pointing at Astro's own accounts) and "Your name here" in the footer; fixed on 2026-07-25 to show only GitHub, linking to https://github.com/victorgomezdejuan. Two things from the same starter template are still unfixed and need Víctor's input rather than invented copy:

- `src/consts.ts` — `SITE_TITLE`/`SITE_DESCRIPTION` are real copy now ("Víctor Gómez de Juan" / a short tagline) but double-check the wording still matches how he wants to present the site.
- `src/pages/about.astro` — still Lorem Ipsum placeholder text and a stock placeholder image. Needs an actual bio before it's presentable.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
- [Cloudflare Workers static assets](https://developers.cloudflare.com/workers/static-assets/) — read this before touching `wrangler.jsonc`.
