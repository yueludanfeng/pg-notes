# Hugo Blowfish Markdown Design

## Goal

Convert the personal PostgreSQL site from a static HTML prototype into a Markdown-first Hugo blog using the Blowfish theme.

## Architecture

- Hugo generates the site.
- Blowfish provides theme layouts, search, dark mode, article lists, taxonomies, RSS, and code copy.
- All posts live in `content/posts/`.
- Categories and tags organize PostgreSQL topics such as cases, internals, optimization, high availability, and notes.
- The old static prototype is preserved in `legacy-static/`.

## Writing Flow

Create a new post with:

```bash
hugo new posts/my-post.md
```

Edit the Markdown file, set front matter fields, then preview with:

```bash
hugo server
```

## Deployment

The repository includes a GitHub Pages workflow at `.github/workflows/hugo.yaml`. It checks out the Blowfish submodule, builds Hugo, and deploys `public/` to Pages.
