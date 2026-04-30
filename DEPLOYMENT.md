# Deployment

fluxionic.org runs on pebblestack (PHP 8.2 + SQLite + Twig) on the EPFL host
`128.178.218.218`. Apache 2 with `mod_php8.2` serves the site directly — no
Docker, no reverse proxy. The old slatestack Fastify+Postgres Docker stack
was retired on 2026-05-01.

## Production layout

| Item | Value |
|---|---|
| Host | `128.178.218.218` (`vpaavpvm0045.epfl.ch`) |
| OS | Ubuntu 22.04 |
| Web server | Apache 2 with `mod_php8.2` (`libapache2-mod-php8.2`) |
| Document root | `/var/www/fluxionic-pebblestack` |
| Vhost | `/etc/apache2/sites-available/fluxionic-pebblestack.conf` |
| TLS | Let's Encrypt SAN cert at `/etc/letsencrypt/live/alpha.lhumos.org/` (covers `fluxionic.org` + `www.fluxionic.org` alongside other domains) |
| DNS | Apex via Gandi (217.70.184.55) → 301 to `www`; `www.fluxionic.org` → `128.178.218.218` |
| Logs | `${APACHE_LOG_DIR}/fluxionic2.log` |

## Deploying an update

```sh
ssh root@128.178.218.218
cd /var/www/fluxionic-pebblestack
git pull origin migrate-to-pebblestack   # or main, once merged
chown -R www-data:www-data data uploads
# Migrations auto-apply on the next request. Apache reload is only needed
# if you've changed Apache config or the .htaccess.
```

That's it. No build step, no service restart.

## Other services on the same host

The fluxionic vhost shares the host with several unrelated services. **Do not
touch any of these** unless you know what you're doing:

- Apache vhosts: `alpha.lhumos.org`, `asesma.org`, `backend2.lhumos.org`, `lhumos.org`, `monklist.cecam.org`, `vpaavpvm0045.epfl.ch`
- Docker stacks: `asesma-*`, `docker-*` (Clowder bundle: clowder, mongo, elasticsearch, rabbitmq, minio, selenium, portainer, extractors), `listmonk_*`, `mongodb`
- Compose stack roots: `/opt/asesma/`

## Initial install (already done)

Run only once. After running, `/install` redirects to `/admin/login`.

```sh
# Visit https://www.fluxionic.org/install in a browser, fill in:
#   email, password, your name, site name = "FLUXIONIC"
# It runs migrations, creates the admin user, sets the site_name setting.
```

## Seeding content from the spreadsheet

```sh
ssh root@128.178.218.218
cd /var/www/fluxionic-pebblestack
php scripts/seed-fluxionic.php          # idempotent — wipes & reseeds
chown -R www-data:www-data data
```

Drop fellow photos at `/var/www/fluxionic-pebblestack/assets/fellows/<slug>.jpg`
and re-run the seed (it only emits `photo_url` for files that exist on disk).

## Backup

```sh
cp data/pebblestack.sqlite        backups/db-$(date +%F).sqlite
tar czf backups/uploads-$(date +%F).tgz uploads/
```

That's the entire site state.

## Rollback to slatestack (window: until `/opt/fluxionic-app/` is removed)

If something goes wrong with pebblestack and the slatestack containers haven't
been deleted yet, this brings the old site back in seconds:

```sh
ssh root@128.178.218.218
a2dissite fluxionic-pebblestack
a2ensite fluxionic2          # the old reverse-proxy vhost is still on disk
systemctl reload apache2
cd /opt/fluxionic-app && docker compose up -d   # restart the old containers
```

The old Postgres dump is at `/root/backups/fluxionic-cutover-2026-05-01/slatestack-postgres.dump`.
The Docker volumes `fluxionic-app_postgres_data` and `fluxionic-app_uploads_data`
were preserved during cutover (we used `docker compose stop`, not `down -v`).

After ~1–2 weeks of stable pebblestack operation, the rollback path can be
purged with `docker compose down` (no `-v`) and `rm -rf /opt/fluxionic-app/`.
