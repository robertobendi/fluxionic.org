# fluxionic.org

The fluxionic.org website. Built on [pebblestack](https://github.com/robertobendi/pebblestack) — a small PHP+SQLite CMS by the same author.

## Stack

PHP 8.2 + SQLite + Twig. Drop-in deployable on any shared host. See pebblestack's [README](https://github.com/robertobendi/pebblestack#readme) and [`AGENTS.md`](AGENTS.md) for the framework's full story.

## Where to edit

| What you change | Where |
|---|---|
| Public theme (HTML/CSS) | `templates/theme/<theme-name>/` |
| Active theme name | `config/app.php` (`'theme' => '...'`) |
| Content shape (pages, posts, fellows, events, …) | `config/collections.php` |
| Site branding / partner logos / PI portraits | `assets/` |

Everything else (`src/`, `templates/admin/`, `vendor/`, `data/migrations/`) is framework — leave it alone unless you're upstreaming a fix to pebblestack.

## Local dev

```sh
php -S localhost:8000
# then visit http://localhost:8000/install.php once
```

PHP's built-in server reads `.htaccess` poorly — for full fidelity (rewrites, security headers) use Apache or LiteSpeed. SQLite + migrations are auto-applied on first request.

## Syncing pebblestack updates

The pebblestack repo is wired in as a git remote:

```sh
git fetch pebblestack-upstream
git diff HEAD pebblestack-upstream/main -- src/ templates/admin/ data/migrations/ vendor/
# cherry-pick or copy what you want; histories are intentionally unrelated.
```

Don't blindly merge — `assets/`, the active theme under `templates/theme/`, and `config/collections.php` are site-specific and should not be overwritten.

## Deploy

See [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Migration history

This repo was originally built on [slatestack](https://github.com/Labyrica/slatestack) (Node/Fastify/Postgres/React) and migrated to pebblestack on 2026-04-29. The slatestack history is preserved in git — see tag `pre-pebblestack-migration` for the last commit on that stack.

## License

MIT — see [LICENSE](LICENSE).
