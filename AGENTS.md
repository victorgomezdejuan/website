## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Project context and content workflow

- Public site: https://victorgomezdejuan.com
- The domain is currently managed through Arsys, while the site is hosted and deployed on Cloudflare Pages.
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
6. Create a descriptive commit and push it to GitHub automatically so Cloudflare Pages can deploy it, unless the user explicitly asks not to. Report the resulting commit hash and link.

### Current published content

- “Cómo empezar a usar GitHub Copilot en un equipo de desarrollo de software (sin alardes)” is published in `src/content/blog/empezar-github-copilot-equipo.md`.
- Its local images are in `src/assets/copilot-team/`.
- Publication commit: `212b96c`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
