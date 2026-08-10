# شركة الديوان للتفتيش والمطابقة — al-diwan.ly

Bilingual (AR/EN) company site for Al-Diwan Inspection & Conformity, with a
Django Admin backend, a staff dashboard for publishing, and a unified inbox
that replaces Gmail for customer correspondence.

## Stack

Decoupled frontend and backend, deployed together on one origin.

**Backend — Django, API only**
- **Django 5.1** + **DRF**, MySQL via PyMySQL (no C-extension build needed)
- **django-parler** for translated content — adding a language is config, not a migration
- **django-unfold** theming Django Admin
- Session + CSRF auth (same-origin, so no tokens and no CORS)

**Frontend — React SPA**
- **Vite + React 18 + TypeScript + Tailwind CSS**
- React Router (`/:lang/…` routes), TanStack Query, React Hook Form + zod
- **Framer Motion** for the animated hero and scroll reveals

Node is a **build-time** tool only. `npm run build` emits static files that
Django serves via **django-vite** + **WhiteNoise**, so the cPanel host never
runs Node.

## Local development

```bash
# Backend
python3.12 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
cp backend/.env.example backend/.env          # defaults to SQLite + console email
.venv/bin/python backend/manage.py migrate
.venv/bin/python backend/manage.py setup_roles
.venv/bin/python backend/manage.py seed_content     # Arabic copy from the live site
.venv/bin/python backend/manage.py seed_english     # draft English translations
.venv/bin/python backend/manage.py createsuperuser

# Frontend (build once, then Django serves it at http://127.0.0.1:8000/)
cd frontend && npm install && npm run build && cd ..

.venv/bin/python backend/manage.py runserver
```

For frontend work with hot reload, run Vite alongside Django and set
`VITE_DEV_MODE=True` in `backend/.env`:

```bash
cd frontend && npm run dev     # :5173, proxies /api and /admin to :8000
```

Docker Compose (Django + MySQL) is provided for parity testing:

```bash
docker compose up
```

## Layout

| Path | Purpose |
|---|---|
| `backend/config/` | settings (`base`/`dev`/`production`), URLs, sitemaps |
| `backend/pages/` | home, about, services, contact + editable content blocks |
| `backend/services/` | translated service catalogue powering the bento grid |
| `backend/posts/` | blog with draft/scheduled/published workflow |
| `backend/messaging/` | the unified inbox — threads, messages, IMAP intake |
| `backend/siteconfig/` | global site settings singleton |
| `backend/api/` | the whole REST API + auth + language middleware |
| `frontend/` | React app (`src/pages`, `src/dashboard`, `src/components`, `src/lib`) |
| `brand-assets/` | original logo/photos pulled from the live site |

## Key URLs

| URL | What |
|---|---|
| `/ar/`, `/en/` | public site |
| `/ar/dashboard/` | staff dashboard (posts + inbox) |
| `/admin/` | Django Admin |
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

33 tests covering message threading, role-based API access, the contact form,
per-language post editing, Arabic-slug URLs, and the SPA catch-all route.

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full cPanel runbook, DNS/SPF/DKIM
setup, cron configuration, and the go-live checklist, and
**[COMMANDS.md](COMMANDS.md)** for the day-to-day terminal commands.

Three operational notes worth knowing up front:

- **Rebuild the frontend before every deploy** (`cd frontend && npm run build`).
  `frontend/dist/` is committed on purpose — the host has no Node.
- After any seed/management command, **restart the app** — parler caches
  translations per process, so a command run elsewhere won't invalidate the web
  process's cache.
- Compiled `.mo` translation files are committed, because the host has no gettext.
