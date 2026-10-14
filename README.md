# In development!

# [Puregarnet's Journal](https://kimfooburn001.github.io/Kim/)

colours
--text: #f6f0e5;
--background: #2f3b2f;
--primary: #5b6b54;
--secondary: #c9b89e;
--accent: #cd4756;


Source for [Puregarnet's Journal]([https://kimfooburn001.github.io/Kim/])) — Puregarnet's
personal site. Books, reviews, blog posts.

The site is a static build produced by **Astro v5** with **Svelte 5**
islands for the interactive bits (reviews explorer, mobile
menu). It deploys to GitHub Pages from `master`
via `.github/workflows/gh-pages.yml`. Original developer is https://github.com/Samreay/Samreay.

It used to be a Hugo site. The migration is documented under [`plans/`](plans/).

## To use the default GitHub URL, you need to add/modify your repository name to the links:
- in file src/config.ts and src/styles/config.css to add the repository name and github username to the links. Maybe CNAME file too

## Quick start

```bash
make install   # installs casks, node deps, python deps via uv
make blog      # `npm run dev` — local Astro dev server with HMR
make prod      # clean build into `dist/`
```

## Layout

- `src/content/` — Astro content collections (`reviews/`, `blogs/`).
- `src/pages/` — routes; dynamic `[...slug].astro` files render collection items.
- `src/components/` — Astro components, with Svelte islands under `components/islands/`.
- `src/data/` — typed YAML-replacement data files (books, …).
- `src/lib/` — shared helpers (covers, content sorting, types, the `fancy-card` 3-D effect).
- `src/styles/` — Tailwind v4 entrypoint plus plain-CSS partials, all imported from `main.css`. The CSS-first `@theme` block in `main.css` replaces what used to live in `tailwind.config.cjs`.
- `src/assets/` — images and SVGs that go through `astro:assets` for hashing/optimisation.
- `astro-public/` — verbatim static files (favicons, podcast thumbnails).
- `content/` — markdown sources.
- `plans/` — phase-by-phase migration plan, kept around for context.
- `skills/` — authoritative operational playbooks (book reviews, humanizer, …). `make install` symlinks these into `.claude/skills/` and `.cursor/skills/`.

## Operational playbooks

- Drafting a new review — see `skills/book-review/`.
- Refreshing the cover-artist database from r/ProgressionFantasy — see `skills/find-artists/`.
- Editing review prose without sounding AI-generated — see `skills/humanizer/`.
