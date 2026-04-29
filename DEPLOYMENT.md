# Deployment

fluxionic.org runs on pebblestack — a single-folder PHP+SQLite app. Deploy by uploading the repo to a PHP 8.2+ host's webroot.

## Target deploy (pebblestack)

1. Upload the entire repo (including `vendor/`) to `public_html/` on any PHP 8.2+ shared host (Hostinger, Namecheap, Bluehost, …).
2. Visit `https://fluxionic.org/install.php` once. Pick site name + admin email + admin password.
3. Done. Public site at `/`, admin at `/admin`.

The first request after deploy auto-applies any pending SQL migrations from `data/migrations/`. The SQLite DB lives at `data/pebblestack.sqlite` (gitignored — back up by copying that file).

## What does NOT need to be on the server

- `.git/` — drop the repo, not the history
- `backups/` — local-only
- `.claude/`, `.planning/` — dev tooling
- `DESIGN_GUIDE.md`, `AGENTS.md`, `README.md`, `DEPLOYMENT.md`, `LICENSE` — `.htaccess` denies `.md` over HTTP, but you can omit them on upload to keep `public_html/` lean
- `composer.lock`, `composer.json` — not strictly required at runtime if `vendor/` is present, but harmless

## Production server (legacy slatestack)

The slatestack-era production server at `128.178.218.218` (Docker Compose with Fastify + Postgres) is **not affected by this branch**. Cutover to pebblestack on a new (or repurposed) host is a separate operation:

1. Provision PHP 8.2+ shared hosting (or install PHP/Apache on the existing server)
2. Stop the slatestack Docker stack
3. Export any content from the Postgres DB you want to keep (manual — slatestack and pebblestack schemas are unrelated)
4. Upload pebblestack repo, run `/install.php`
5. Recreate content via the admin (or write a one-off import script targeting `data/pebblestack.sqlite`)
6. Repoint DNS / proxy if the host changed

## Backup

A pebblestack backup is two things:

```sh
cp data/pebblestack.sqlite        backups/db-$(date +%F).sqlite
tar czf backups/uploads-$(date +%F).tgz uploads/
```

That's the entire site state. No DB dump tool, no Postgres pg_dump.
