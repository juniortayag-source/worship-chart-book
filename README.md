# Worship Chart Book

A standalone, self-hosted version of the worship team chord chart library and
Sunday setlist tracker. No dependency on any third-party platform's storage —
your data lives in a Postgres database you control.

## What changed from the Claude-artifact version

- **PDFs are never uploaded or stored.** When you add or edit a song with a
  PDF, the file is read entirely in your browser (using pdf.js) to extract
  the chord chart text, and then discarded. Only the extracted chart text is
  saved. There's no "view original PDF" feature anymore, since the original
  file is never kept anywhere.
- **Storage is a Postgres database you provide**, instead of the built-in
  storage the Claude Artifacts platform provides. Two tables (`songs`,
  `sundays`) hold everything, each row just an id plus a JSON blob — see
  `schema.sql`.
- Everything else — the chord/lyric parser, 2-column PDF handling,
  transposition, manual chart entry, the metronome, and the Sunday tracker —
  works exactly the same as before.

## Project layout

```
index.html          the whole app (single page, no build step)
api/songs.js         GET (list) / POST (create) songs
api/songs/[id].js    PATCH (update) / DELETE a song
api/sundays.js        GET (list) / POST (create) Sunday logs
api/sundays/[id].js   PATCH (update) / DELETE a Sunday log
api/_db.js            shared Postgres connection helper
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

That's it — Vercel gives you a URL (e.g. `worship-chart-book.vercel.app`)
that's your own, standalone copy of the app.

### 4. Updating later

Any time you want to change the app, edit the files and push to GitHub again
— Vercel redeploys automatically on every push to your main branch.

## Local development (optional)

You can run this locally with the Vercel CLI:

```
npm install -g vercel
vercel dev
```

It will ask for the same `DATABASE_URL` environment variable (you can put it
in a `.env` file locally — see `.env.example`).
