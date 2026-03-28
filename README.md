# Jaime Chapinal Blog

A minimal standalone blog built with Astro and AstroPaper.

## Run locally

```bash
npm install
npm run dev
```

The local dev server starts at `http://localhost:4321`.

## Write a new post

Create a new Markdown file in `src/data/blog/`.

Example:

```md
---
title: "My first post"
description: "A short description of the post."
pubDatetime: 2026-03-28T10:00:00Z
draft: false
---

This is a normal paragraph in Markdown.
```

Notes:

- Posts are regular `.md` files.
- `.mdx` can be added later if you want it, but normal posts do not depend on MDX.
- `tags` is optional.
- Set `draft: true` to keep a post out of production.

## Important paths

- Posts: `src/data/blog/`
- Site metadata: `src/config.ts`
- Header and footer: `src/components/Header.astro`, `src/components/Footer.astro`
- Colors and base theme tokens: `src/styles/global.css`
- Post typography: `src/styles/typography.css`

## Build for production

```bash
npm run build
npm run preview
```
