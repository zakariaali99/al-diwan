# شركة الديوان للتفتيش والمطابقة — al-diwan.ly

Bilingual (AR/EN) company site for Al-Diwan Inspection & Conformity, with a
Django Admin backend, a staff dashboard for publishing, and a unified inbox
that replaces Gmail for customer correspondence.

## Stack

Single Django monolith, shaped by the production host (shared cPanel — no
Docker, no root, no Redis/Celery, no WebSockets):

- **Django 5.1**, MySQL via PyMySQL (no C-extension build needed)
- **django-parler** for translated content — adding a language is config, not a migration
- **django-unfold** theming Django Admin
- Server-rendered templates + hand-written CSS design tokens (no build step)
- **WhiteNoise** for static files, **gunicorn**/Passenger for serving

## Local development

```bash
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env          # defaults to SQLite + console email
.venv/bin/python manage.py migrate
.venv/bin/python manage.py setup_roles
.venv/bin/python manage.py seed_content     # Arabic copy from the live site
.venv/bin/python manage.py seed_english     # draft English translations
.venv/bin/python manage.py createsuperuser
.venv/bin/python manage.py runserver
```

Docker Compose (Django + MySQL) is provided for parity testing:

```bash
docker compose up
```

## Layout

| Path | Purpose |
|---|---|
| `config/` | settings (`base`/`dev`/`production`), URLs, sitemaps |
| `pages/` | home, about, services, contact + editable content blocks |
| `services/` | translated service catalogue powering the bento grid |
| `posts/` | blog with draft/scheduled/published workflow |
| `messaging/` | the unified inbox — threads, messages, IMAP intake |
| `dashboard/` | staff UI for posts and the inbox |
| `siteconfig/` | global site settings singleton |
| `api/` | DRF contact endpoint |

## Key URLs

| URL | What |
|---|---|
| `/ar/`, `/en/` | public site |
| `/ar/dashboard/` | staff dashboard (posts + inbox) |
| `/ar/admin/` | Django Admin |
| `/sitemap.xml`, `/robots.txt` | SEO |
| `/healthz/` | uptime check |

## Roles

Assigned via Django Groups (`python manage.py setup_roles`):

- **Admins** — Django Admin + full dashboard
- **Editors** — dashboard: posts only
- **Support** — dashboard: inbox only

## Unified inbox

- Contact-form submissions become threads directly.
- Staff replies send as real email with RFC-compliant threading headers.
- `fetch_inbound_mail` polls IMAP on a cron and matches replies back to their
  thread via `In-Reply-To`/`References`, falling back to subject + sender.

IMAP polling is deliberate: it needs **no MX/DNS change**, so it cannot disrupt
existing mail flow on the domain.

## Tests

```bash
.venv/bin/python manage.py test
```

31 tests covering message threading, role-based access, the contact form,
bilingual routing, and Arabic-slug URLs.

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full cPanel runbook, DNS/SPF/DKIM
setup, cron configuration, and the go-live checklist.

Two operational notes worth knowing up front:

- After any seed/management command, **restart the app** — parler caches
  translations per process, so a command run elsewhere won't invalidate the web
  process's cache.
- Compiled `.mo` translation files are committed, because the host has no gettext.
