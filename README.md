# jaeung.me

Personal website of **Jaeung Lee**, built with [Next.js](https://nextjs.org) +
[Nextra](https://nextra.site) (blog theme), TailwindCSS/daisyUI, and MDX.
Deployed on [Vercel](https://vercel.com).

## Tech stack

- **Next.js 16** (App Router) · **Nextra 4** (`nextra-theme-blog`) · MDX + KaTeX
- **TailwindCSS 4** + daisyUI · `next-themes` (light/dark)
- **pnpm** · TypeScript · ESLint + Prettier + Husky
- Content-as-data: `data/*.yml` → codegen (`generate-data.js`) → `@/data`
- Pagefind search · Giscus comments · Vercel OG/Analytics

## Requirements

- **Node.js ≥ 20** (see `.nvmrc`; `nvm use`)
- **pnpm** (`corepack enable`)

## Getting started

```bash
pnpm install
cp .env.example .env.local   # optional; edit as needed
pnpm dev                     # runs datagen + next dev
```

Open http://localhost:3000.

## Scripts

| Command        | Description                                         |
| -------------- | --------------------------------------------------- |
| `pnpm dev`     | Generate data + start dev server (watches YAML)     |
| `pnpm build`   | Generate data + production build (+ Pagefind index) |
| `pnpm start`   | Serve the production build                          |
| `pnpm lint`    | ESLint                                              |
| `pnpm format`  | Prettier                                            |
| `pnpm datagen` | Regenerate `data/*.ts` from `data/*.yml`            |

## Editing content

- **Identity / bio data** → `data/*.yml` (`meta`, `career`, `educations`,
  `publications`, `news`, `skills`, `misc`, `authors`, `sections`).
- **Home / About** → `content/index.mdx`.
- **Projects** → `content/projects/<slug>/index.mdx` (+ image).
- **Blog posts** → `content/blog/posts/*.mdx`.
- **Deploy / runtime config** (site URL, Analytics, Giscus) → env vars in
  `site.config.ts` — see `.env.example`.

## Deployment

Connected to Vercel via GitHub; pushes to `main` deploy to production and PRs
get preview deployments. Set the environment variables from `.env.example` in
the Vercel project, and pin the Node.js version to 20.x.
