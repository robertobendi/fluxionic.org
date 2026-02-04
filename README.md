# Slatestack

A lightweight, self-hosted headless CMS: admin panel for collections and content, REST APIs for frontends, local media, privacy-friendly metrics. Built for small teams who want content management without a platform.

**Stack:** Node + Fastify + Drizzle + PostgreSQL + React (admin) + Vite.

---

## Use this repository as a template

This repo is intended to be used as a **template**. To allow others to create new repos from it on GitHub:

1. Open **Settings** → **General**.
2. Under "Template repository", check **Template repository**.

Then anyone can click **Use this template** → **Create a new repository** to start a new project from Slatestack.

To create a new repo locally and use this project’s git init template (optional `description` and `info/exclude`):

```bash
mkdir my-project && cd my-project
git init --template=/path/to/slatestack/git-template
# then copy or clone the rest of the Slatestack files you need
```

---

## Quick start

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
2. `pnpm install` (or `npm install`) at the repo root and in `admin/`.
3. Run migrations and seed: see `package.json` scripts.
4. Start: `pnpm dev` (API) and from `admin/`: `pnpm dev` (admin UI).
5. Docker: `docker compose up` for full stack.

See `.planning/PROJECT.md` for full scope and `DESIGN_GUIDE.md` for architecture.
