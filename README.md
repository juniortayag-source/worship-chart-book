# MFBC Worship Team

A standalone, self-hosted version of the worship team chord chart library and
Sunday setlist tracker. No dependency on any third-party platform's storage —
your data lives in a Postgres database you control.

## What changed from the Claude-artifact version

- **The original PDF is never uploaded or stored — not even its text.** When
  you add or edit a song with a PDF, each page is rendered to a plain image
  (a JPEG snapshot) right there in your browser, using pdf.js. Only that
  rendered image is saved; the PDF file itself never leaves your browser.
  There's no "view original PDF" feature, since the original file is never
  kept anywhere.
- **Chords are pre-tagged automatically where possible.** While rendering
  each page, the app also scans the PDF's own text layer (still entirely in
  your browser, still discarded afterward) for anything shaped like a chord,
  and places a tag at that spot — so most charts need little or no manual
  tagging. A scanned or photographed PDF has no text layer to scan, so those
  come up blank and you tag them from scratch, same as before. Either way,
  right after saving you land on the tagger: drag a tag to reposition it,
  tap it to edit its text or use the A&minus;/A+ buttons to resize it, tap
  its &times; to remove it, or tap empty space to add one that was missed —
  that's what lets "Transpose" work on an image-based chart, since there's
  no extracted text to parse automatically at display time.
- You can still skip PDFs entirely and type a chart by hand (**Edit song →
  "type lyrics & chords by hand"**) — that path is unchanged and doesn't need
  any chord tagging, since you're typing the chords directly.
- **Storage is a Postgres database you provide**, instead of the built-in
  storage the Claude Artifacts platform provides. Two tables (`songs`,
  `sundays`) hold everything, each row just an id plus a JSON blob — see
  `schema.sql`. A song's rendered page images live in **Vercel Blob
  storage**; the database just stores their URLs and your chord tags.
- Everything else — transposition, the metronome, autoscroll, and the Sunday
  tracker — works the same as before.

## Project layout

```
index.html           the whole app (single page, no build step)
api/songs.js          GET (list) / POST (create) songs
api/songs/[id].js     PATCH (update) / DELETE a song (also cleans up its page images in Blob storage)
api/sundays.js        GET (list) / POST (create) Sunday logs
api/sundays/[id].js   PATCH (update) / DELETE a Sunday log
api/blob-upload.js    receives one rendered page image from the browser and stores it in Vercel Blob
api/_db.js            shared Postgres connection helper
api/_blob.js           shared Blob cleanup helper
api/_auth.js           the worship-team accounts and login check (see "Accounts & login" below)
api/_activity.js        records one Activity Log entry (called from the routes above)
api/activity.js         GET the Activity Log — admin accounts only (see "Activity Log" below)
api/login.js           checks the name/password the login screen submits
api/whoami.js           confirms a remembered login is still valid on page load
api/users.js            GET the team roster (id + name only) — used to build the Availability grid
api/availability.js     GET all availability / PATCH your own yes-or-no for one Sunday date
schema.sql            the tables to create before first use
```

## Deploying

### 1. Get a Postgres database

Any Postgres provider works — you just need a connection string
(`postgres://user:password@host:5432/dbname`). Easiest options:

- **Neon** (neon.tech) — has a free tier, and is also available directly from
  Vercel's own Storage/Marketplace tab when you create a project there.
- **Supabase** (supabase.com) — also has a free tier.
- Any other Postgres host you already use.

Once you have one, run the contents of `schema.sql` against it once (most
providers have a "SQL editor" in their dashboard where you can paste and run
it; or use `psql "<your connection string>" -f schema.sql` from a terminal
that has `psql` installed).

### 2. Push this project to GitHub

```
cd worship-chart-book
git init
git add .
git commit -m "Initial commit"
```

Create a new repository on GitHub and push to it (GitHub's "create a new
repository" page shows the exact commands for your repo name).

### 3. Import into Vercel

- Go to vercel.com, sign in, and click "Add New… → Project".
- Import the GitHub repository you just pushed.
- Vercel will auto-detect this as a plain static site with serverless
  functions in `/api` — no build command or framework needed.
- Before deploying, add an environment variable: `DATABASE_URL` set to your
  Postgres connection string from step 1.
- Click Deploy.

That's it for the database. Next, add Blob storage for the chord chart page
images:

- In the project on Vercel, go to the **Storage** tab → **Create Database**
  (or "Connect Store") → choose **Blob**.
- Create it and connect it to this project. Vercel automatically adds a
  `BLOB_READ_WRITE_TOKEN` environment variable for you — you don't need to
  copy anything by hand.
- Redeploy (Vercel will prompt you to, since a new environment variable was
  added) so the running app picks it up.

Vercel gives you a URL (e.g. `worship-chart-book.vercel.app`) that's your own,
standalone copy of the app.

If you ever see an error mentioning an unsupported Node.js version, go to
**Project Settings → General → Node.js Version** and set it to 20.x or newer.

### 4. Accounts & login

The whole app sits behind a login screen — there's no view-only or public
access anymore. Everyone picks their name from a dropdown, enters their
password, and from then on can add, edit, delete, tag chords, and log
Sundays; there's no separate viewer role. The built-in accounts are:

| Name     | Password            |
|----------|---------------------|
| Brian    | MFBCworshipteam!!   |
| Cristian | MFBCworshipteam!!   |
| David    | MFBCworshipteam!!   |
| Janine   | MFBCworshipteam!!   |
| Jayronn  | MFBCworshipteam!!   |
| Junior   | MFBCWorshipAdmin!   |
| Katreena | MFBCworshipteam!!   |
| Kevin    | MFBCworshipteam!!   |
| Kirsten  | MFBCworshipteam!!   |
| Kris     | MFBCworshipteam!!   |
| Liezl    | MFBCworshipteam!!   |

These are defined directly in `api/_auth.js`, so the app works with no
environment variables set. To change a name or password without touching
code (and without it sitting in your git history), go to **Project
Settings → Environment Variables** and add `APP_USERS` as a JSON array in
this same shape, then redeploy:

```json
[{"id":"brian","name":"Brian","password":"MFBCworshipteam!!"},{"id":"cristian","name":"Cristian","password":"MFBCworshipteam!!"},{"id":"david","name":"David","password":"MFBCworshipteam!!"},{"id":"janine","name":"Janine","password":"MFBCworshipteam!!"},{"id":"jayronn","name":"Jayronn","password":"MFBCworshipteam!!"},{"id":"junior","name":"Junior","password":"MFBCWorshipAdmin!","isAdmin":true},{"id":"katrina","name":"Katreena","password":"MFBCworshipteam!!"},{"id":"kevin","name":"Kevin","password":"MFBCworshipteam!!"},{"id":"kirsten","name":"Kirsten","password":"MFBCworshipteam!!"},{"id":"kris","name":"Kris","password":"MFBCworshipteam!!"},{"id":"liezl","name":"Liezl","password":"MFBCworshipteam!!"}]
```

If you add or rename someone this way, also update the `<option>` list in
`index.html`'s login screen (search for `id="loginName"`) so their name
shows up in the dropdown.

A login is remembered on that browser/device (via `localStorage`) until
"Log out" is clicked — closing the tab, the browser, or the whole app
doesn't sign you out, so there's no need to sign in again on
every reload. Each person's notes and drawings on a Sunday's set (the
Annotate bar: notes, shapes, arrows, and freehand drawing) are private to
them; everyone sees the same songs, setlists, and chord charts.

### 5. Activity Log

Junior's account has `isAdmin: true` in `api/_auth.js`, which shows an
"Activity Log" button in the top bar (hidden for everyone else) listing
what every account has done — songs and Sunday sets added, edited, or
deleted; availability marked; and logins — newest first. Nobody without `isAdmin: true` can see
it, even by calling the API directly (`api/activity.js` checks this
server-side, not just in the UI). To give another account the same
visibility, add `isAdmin: true` to their entry too (in `api/_auth.js`, or in
`APP_USERS` if you're using that instead).

This is a new table (`activity_log`), so if you already deployed this app
before this feature existed, re-run `schema.sql` against your database once
(same as the first-time setup in step 1) — it only adds what's missing, so
it's safe to run again.

### 6. Availability

A third tab, **Availability**, shows a grid of the next six Sundays against
everyone on the roster. Tap your own column to cycle through Yes &rarr; No
&rarr; (blank) for a given date — everyone can see everyone's answers (not
just their own), so whoever's about to build a set knows who's around, but
nobody can change anyone else's answer. "Build a set" (renamed from "Log a
Sunday" — same feature, same button, now available from both the Library
and Sunday Sets tabs) works independently of this: a date doesn't need a set
built for it before people can mark their availability.

This uses a new table (`availability`), so if you already deployed this app
before this feature existed, re-run `schema.sql` once more (safe to run
again, same as step 5 above). Marking yourself available/unavailable (or
clearing it) shows up in the Activity Log, same as everything else above.

### 7. Updating later

Any time you want to change the app, edit the files and push to GitHub again
— Vercel redeploys automatically on every push to your main branch.

## Local development (optional)

You can run this locally with the Vercel CLI:

```
npm install -g vercel
vercel dev
```

It will ask for the same `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN`
environment variables (you can put them in a `.env` file locally — see
`.env.example` — or run `vercel env pull .env` once the project is linked to
pull both from Vercel automatically).
