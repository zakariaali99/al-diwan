# Deployment runbook — al-diwan.ly

Target: **shared cPanel hosting** (no Docker, no root, no Redis/Celery, no
WebSockets). Everything below is designed around those limits.

Steps marked **[you]** need cPanel or DNS access and must be done by the
account owner.

---

## 0. Prerequisites

| Item | Needed for | Notes |
|---|---|---|
| cPanel account with **Setup Python App** | running Django | Confirm Python 3.10+ is offered; the app is developed on 3.12 |
| MySQL database + user | data | Created in cPanel → MySQL® Databases |
| DNS control for `al-diwan.ly` | domain + email auth | Confirmed available |
| Transactional email account | outbound replies | Brevo / Mailgun / Postmark — free tiers are sufficient at this volume |
| IMAP mailbox (e.g. `info@al-diwan.ly`) | inbound replies | The existing cPanel mailbox works; no MX change needed |

---

## 1. Database **[you]**

1. cPanel → **MySQL® Databases** → create database `USERNAME_aldiwan`.
2. Create a user, give it **All Privileges** on that database.
3. Record the database name, user, and password — they go into the env vars in step 3.

---

## 2. Python app **[you]**

cPanel → **Setup Python App** → *Create Application*:

| Field | Value |
|---|---|
| Python version | 3.12 (or the highest 3.10+ available) |
| Application root | `al-diwan.ly` |
| Application URL | `al-diwan.ly` |
| Application startup file | `config/wsgi.py` |
| Application Entry point | `application` |

Click **Create**. cPanel prints the command to enter the virtualenv — keep it,
it is needed for the manual commands later.

---

## 3. Environment variables **[you]**

Still in *Setup Python App*, add these under **Environment variables**. They are
read by `python-decouple` in `config/settings/base.py`.

```
DJANGO_SETTINGS_MODULE=config.settings.production
DJANGO_SECRET_KEY=<paste a fresh 50-char random string>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=al-diwan.ly,www.al-diwan.ly
DJANGO_CSRF_TRUSTED_ORIGINS=https://al-diwan.ly,https://www.al-diwan.ly

DATABASE_ENGINE=mysql
DATABASE_NAME=USERNAME_aldiwan
DATABASE_USER=USERNAME_aldiwan
DATABASE_PASSWORD=<db password>
DATABASE_HOST=localhost
DATABASE_PORT=3306

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=<provider smtp host>
EMAIL_PORT=587
EMAIL_HOST_USER=<provider smtp user>
EMAIL_HOST_PASSWORD=<provider smtp key>
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=info@al-diwan.ly

IMAP_HOST=mail.al-diwan.ly
IMAP_PORT=993
IMAP_USER=info@al-diwan.ly
IMAP_PASSWORD=<mailbox password>
IMAP_MAILBOX=INBOX

INBOX_NOTIFY_EMAILS=info@al-diwan.ly
```

Generate the secret key with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

> **Never** commit these values. `.env` is git-ignored; `.env.example` documents
> the names only.

---

## 3b. Build the frontend (on your machine, before every deploy)

The React app is compiled to static files. **Node is a build-time tool only** —
the cPanel host never runs it.

```bash
cd frontend && npm install && npm run build
```

That writes `frontend/dist/` (including `.vite/manifest.json`, which Django
reads to find the hashed asset filenames). **`dist/` is committed to git on
purpose** so the built assets ship with the repo.

So the full release loop is:

```bash
cd frontend && npm run build && cd .. && git add -A && git commit -m "..." && git push
```

Then deploy in cPanel (next step). Forgetting the rebuild is the most likely
mistake: the site would keep serving the previous build.

---

## 4. Deploy the code **[you]**

cPanel → **Git™ Version Control** → *Create*:

- Clone URL: `https://github.com/zakariaali99/al-diwan.git`
- Repository path: `/home/USERNAME/repositories/al-diwan`

Then edit `.cpanel.yml` in the repo, replacing `USERNAME` with the cPanel
account name and confirming the Python version in the `VENV` path matches what
*Setup Python App* created. Commit and push, then use **Manage → Update from
Remote → Deploy HEAD Commit**.

The deploy hook installs requirements, runs `migrate`, runs `collectstatic`,
and touches `tmp/restart.txt` to reload the app.

---

## 5. First-run setup

From the virtualenv (the command cPanel gave in step 2), in the app directory:

```bash
python manage.py migrate
python manage.py setup_roles
python manage.py createsuperuser
python manage.py seed_content
python manage.py seed_english
python manage.py collectstatic --noinput
```

- `setup_roles` creates the **Admins / Editors / Support** groups.
- `seed_content` loads the current site's Arabic copy.
- `seed_english` loads **draft** English translations — have the company review
  them in `/ar/admin/` before launch.

> After running any seed command, **restart the app** (touch `tmp/restart.txt`).
> Parler caches translations in each process's memory, so a management command
> run in a separate process will not invalidate the web process's cache — the
> site will keep serving the old language until it restarts.

---

## 6. Email

### Outbound (staff replies)

1. Create an account with the transactional provider and verify the domain.
2. **[you]** Add the SPF/DKIM records the provider gives you. These are
   *additive* — they do not change where mail is delivered:
   - SPF: merge into the existing record, e.g.
     `v=spf1 include:<provider> +mx ~all` (only ever **one** SPF record)
   - DKIM: the `CNAME`/`TXT` records from the provider
   - DMARC (recommended): `v=DMARC1; p=none; rua=mailto:info@al-diwan.ly`
3. Put the SMTP credentials into the env vars from step 3.

Verify:

```bash
python manage.py shell -c "from django.core.mail import send_mail; send_mail('test','body','info@al-diwan.ly',['your@email.com'])"
```

### Inbound (customer replies land in the dashboard)

A cron job polls the mailbox over IMAP and folds replies into the right thread.
Deliberately **not** an inbound webhook: that would require repointing MX and
risk disrupting existing mail.

**[you]** cPanel → **Cron Jobs** → every 5 minutes:

```
*/5 * * * * /home/USERNAME/virtualenv/al-diwan.ly/3.12/bin/python /home/USERNAME/al-diwan.ly/manage.py fetch_inbound_mail >> /home/USERNAME/logs/inbound-mail.log 2>&1
```

The command exits cleanly with a message if `IMAP_HOST` is unset, so it is safe
to schedule before the mailbox is configured.

---

## 7. Domain, SSL, and static files **[you]**

1. Point `al-diwan.ly` (and `www`) at the hosting account's IP via an `A` record.
2. cPanel → **SSL/TLS Status** → run *AutoSSL* for both names.
2b. **After** confirming HTTPS works on every hostname, enable HSTS by setting
   `DJANGO_HSTS_SECONDS=3600`, then raising it to `86400` and finally
   `31536000`. It is off by default on purpose: once a browser has seen the
   header it refuses plain HTTP for the full max-age, which is not something
   you can quickly undo if a subdomain is still HTTP-only.
3. Static files are served by WhiteNoise from inside the app — no Apache alias
   needed. `collectstatic` writes hashed filenames, so set long cache headers
   only on `/static/` if you add a CDN later.

---

## 8. Go-live checklist

**Security**
- [ ] `DJANGO_DEBUG=False` and a unique `DJANGO_SECRET_KEY` in production
- [ ] `DJANGO_ALLOWED_HOSTS` lists only the real domains
- [ ] HTTPS works and redirects (`SECURE_SSL_REDIRECT` is on by default)
- [ ] `python manage.py check --deploy` reports nothing critical
- [ ] Superuser password is strong; the dev-only `admin` account does **not** exist in production

**Content**
- [ ] English draft translations reviewed by the company in `/admin/`
- [ ] Real phone, email, address, and social links set in **Site settings**
- [ ] Trust figures on the home page reflect reality (currently "9 fields", "4 stages")
- [ ] ISO certificates uploaded (currently stated as text only — see below)

**Function**
- [ ] Contact form creates a thread in the dashboard
- [ ] Staff reply arrives as real email, not spam (check SPF/DKIM alignment)
- [ ] Replying to that email lands back in the same thread within ~5 minutes
- [ ] Editor account sees only Posts; Support account sees only Messages
- [ ] `/sitemap.xml` and `/robots.txt` resolve on the live domain

**Quality**
- [ ] Lighthouse run on the live URL (target: LCP < 2.5s, CLS < 0.1, INP < 200ms)
- [ ] Both languages checked on a real phone
- [ ] Submit the sitemap in Google Search Console

---

## 9. Routine operations

| Task | Command |
|---|---|
| Deploy a change | push to `main`, then *Deploy HEAD Commit* in cPanel |
| Restart the app | `touch ~/al-diwan.ly/tmp/restart.txt` |
| Add a staff member | `/admin/` → Users → add, then assign the Editors or Support group |
| Back up the database | cPanel → phpMyAdmin → Export, or `mysqldump` |
| Check inbound mail | `tail ~/logs/inbound-mail.log` |

### Adding a language

Translations live in two places, and a new language needs both. The content
models use django-parler, so nothing here is a migration:

1. **Settings.** Add the code to `LANGUAGES` and `PARLER_LANGUAGES` in
   `config/settings/base.py`.
2. **UI strings.** Add the short URL code to `LANGS` and a `LANG_META` entry in
   `frontend/src/lib/i18n.ts`, then fill in the new key on every string in that
   file. `Entry` is `Record<Lang, string>`, so `tsc` fails until all of them are
   translated — that is the completeness check. Add the `hreflang` link to
   `templates/index.html` too.
3. **Database content.** Either translate each record in `/admin/`, or add the
   language to `pages/management/commands/seed_translations.py` and run it:

   ```
   python manage.py seed_translations --lang <code>
   ```

   Check coverage afterwards — parler falls back to Arabic silently, so missing
   translations look like a working page in the wrong language rather than an
   error.

There is no gettext step. The Django templates that `makemessages` used to scan
were removed in the React rebuild, and no `gettext()` calls remain in the Python
code, so `locale/` is vestigial — `locale/en/LC_MESSAGES/django.po` still points
at `templates/base.html` and other deleted files. It can be deleted.

---

## Known follow-ups

These are deliberate, documented gaps rather than oversights:

1. **ISO certificates are text only.** The strategy doc recommends verifiable,
   downloadable certificates; add the PDFs and link them from the About page.
2. **Trust figures are structural, not operational.** They count service areas
   and process stages. Real operational numbers (inspections completed, countries
   covered, years of experience) would be stronger — they need to come from the company.
3. **English content is machine-drafted.** Reviewed wording should replace it
   before the English site is promoted.
4. **Social links** in the footer come from Site settings; Instagram and X are
   blank until real accounts exist (the old site linked to the bare platform
   homepages, which is worse than omitting them).
