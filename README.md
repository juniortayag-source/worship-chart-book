# Worship Chart Book

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
middleware.js           optional password gate for the whole app (see "Require a password" below)
vercel.json            points Vercel at middleware.js
schema.sql            the two tables to create before first use
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

### 4. Require a password (optional)

By default the app is public to anyone with the URL. To require a password
before anyone can open it (or call any of its `/api` routes directly):

- Go to **Project Settings → Environment Variables** and add `APP_PASSWORD`
  set to whatever password you want your worship team to use.
- Redeploy (same as above, since a new environment variable was added).

From then on, visiting the site shows your browser's own built-in login
prompt — any username works, only the password is checked. Most browsers
remember it for the rest of that browsing session, so people won't be asked
again every time. Leave `APP_PASSWORD` unset (or delete it and redeploy) to
make the app public again.

**Optional: a view-only password.** Add a second environment variable,
`APP_VIEW_PASSWORD`, set to a different password. Anyone who logs in with it
can look through every song, chart, and Sunday log, but every button that
would change something (add, edit, delete, tag chords, log a Sunday) is
hidden for them — and blocked on the server even if someone tried to call
the API directly. Redeploy after adding it, same as above.

A "Login" button (top right) lets someone sign in again with a different
password — handy since the app has no accounts of its own, so a fresh visit
with no cached credentials typically lands in whichever mode the browser
last used (often view-only, if that's the password most people have).
Browsers don't offer a real "log out" for this kind of login prompt, so the
button uses the standard workaround of making one request with a
deliberately wrong password to clear what's cached, then reloads so the
prompt comes back. It works in most current browsers; the one guaranteed
fallback if a particular browser doesn't re-prompt is closing that tab (or
using a private/incognito window).

### 5. Updating later

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
