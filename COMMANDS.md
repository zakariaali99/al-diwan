# Terminal commands — cPanel shared host

Quick reference for running this project from **cPanel → Terminal** (or SSH).
The full setup walkthrough is in [DEPLOYMENT.md](DEPLOYMENT.md); this file is
the day-to-day command list.

Replace `USERNAME` with your cPanel account name everywhere below.

---

## The one thing to understand first

**Node never runs on the server.** Your shared host runs Python only. The React
app is compiled to plain files **on your Mac**, committed to git, and the server
just serves them.

So the split is:

| Where | What runs |
|---|---|
| **Your Mac** | `npm run build` → produces `frontend/dist/` |
| **The server** | Python/Django only — serves the API and the already-built files |

If you ever run `npm` on the server, something has gone wrong.

---

## A. On your Mac — before every deploy

```bash
cd ~/projects/Claude/al-diwan/frontend && npm run build
```

Then commit and push the built files:

```bash
cd ~/projects/Claude/al-diwan && git add -A && git commit -m "update site" && git push
```

> Forgetting the build is the most common mistake — the site would keep serving
> the previous version. If your change doesn't appear after deploying, this is
> almost always why.

---

## B. On the server — entering the environment

Every Python command must run **inside the virtualenv**. cPanel gives you the
exact command in **Setup Python App** — it looks like this:

```bash
source /home/USERNAME/virtualenv/al-diwan.ly/3.12/bin/activate && cd /home/USERNAME/al-diwan.ly
```

Run that first, every time you open Terminal. Your prompt will change to show
the environment is active.

---

## C. On the server — deploying

In cPanel, **Git Version Control → Manage → Update from Remote → Deploy HEAD
Commit** does everything automatically (it runs `.cpanel.yml`).

To do the same by hand:

```bash
cd /home/USERNAME/repositories/al-diwan && git pull
```

```bash
source /home/USERNAME/virtualenv/al-diwan.ly/3.12/bin/activate && cd /home/USERNAME/al-diwan.ly && python manage.py migrate --noinput && python manage.py collectstatic --noinput && touch tmp/restart.txt
```

`touch tmp/restart.txt` is what restarts the Python app — there is no
"restart server" button you need beyond this.

---

## D. Where the files go (public_html)

This matters on cPanel, so it's worth being precise.

**The React app does not get copied into `public_html` as loose files.** Django
serves it. The flow is:

1. `collectstatic` gathers everything (React build + fonts + images + admin
   assets) into `staticfiles/`
2. WhiteNoise, inside the Django app, serves those at `/static/...`
3. Passenger routes web requests to the Django app

`public_html` only needs the small Passenger entry file that cPanel creates for
you when you set up the Python App. You do not manually copy `dist/` anywhere.

If your setup instead points the domain's document root straight at
`public_html`, and you want the built files physically there, this is the
command — but only do it if the Passenger setup isn't handling it:

```bash
cp -r /home/USERNAME/al-diwan.ly/staticfiles/. /home/USERNAME/public_html/static/
```

> Check with `ls /home/USERNAME/public_html` first. If you see a `passenger_wsgi.py`
> there, cPanel is handling routing and you should **not** copy files in manually.

---

## E. First-time setup (once only)

```bash
source /home/USERNAME/virtualenv/al-diwan.ly/3.12/bin/activate && cd /home/USERNAME/al-diwan.ly && pip install -r requirements.txt
```

```bash
python manage.py migrate && python manage.py setup_roles && python manage.py createsuperuser
```

Load the site content (Arabic, then the English drafts):

```bash
python manage.py seed_content && python manage.py seed_english && touch tmp/restart.txt
```

> The `touch tmp/restart.txt` matters here: translations are cached per process,
> so without a restart the site keeps serving the old text.

---

## F. Everyday tasks

**Add a staff member** — create the user, then assign a group in
`/admin/` (Editors = posts only, Support = inbox only):

```bash
python manage.py createsuperuser
```

**Check inbound mail is arriving:**

```bash
tail -n 50 /home/USERNAME/logs/inbound-mail.log
```

**Run the mail fetch manually** (the cron does this every 5 minutes):

```bash
python manage.py fetch_inbound_mail
```

**Check the app for problems:**

```bash
python manage.py check --deploy
```

**Restart after any change:**

```bash
touch /home/USERNAME/al-diwan.ly/tmp/restart.txt
```

---

## G. If something breaks

**Site shows a 500 error** — read the log:

```bash
tail -n 100 /home/USERNAME/logs/al-diwan.ly.error.log
```

**Site shows old content after deploying** — you almost certainly skipped the
build on your Mac (section A), or the app needs a restart:

```bash
touch /home/USERNAME/al-diwan.ly/tmp/restart.txt
```

**Styles or images missing** — `collectstatic` didn't run:

```bash
source /home/USERNAME/virtualenv/al-diwan.ly/3.12/bin/activate && cd /home/USERNAME/al-diwan.ly && python manage.py collectstatic --noinput && touch tmp/restart.txt
```

**"No module named ..."** — you're outside the virtualenv. Re-run the
`source .../activate` command from section B.

---

## Quick reference

| Task | Where | Command |
|---|---|---|
| Build the frontend | Mac | `cd frontend && npm run build` |
| Ship changes | Mac | `git add -A && git commit -m "..." && git push` |
| Deploy | cPanel UI | Git Version Control → Deploy HEAD Commit |
| Enter environment | Server | `source /home/USERNAME/virtualenv/al-diwan.ly/3.12/bin/activate` |
| Apply DB changes | Server | `python manage.py migrate` |
| Refresh static files | Server | `python manage.py collectstatic --noinput` |
| Restart the app | Server | `touch tmp/restart.txt` |
