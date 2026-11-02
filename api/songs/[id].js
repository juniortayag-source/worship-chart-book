const { getPool, rowToDoc } = require("../_db");
const { deleteBlobs, allPageUrls } = require("../_blob");
const { requireUser } = require("../_auth");
const { logActivity } = require("../_activity");

// Metronome BPM and reference-track loop points save automatically on every
// little adjustment (not just an explicit "Save"), so a PATCH carrying only
// these is too frequent and too low-signal to belong in the Activity Log —
// everything else about a song (title/details, chart, chords, key versions)
// still gets logged.
const QUIET_SONG_PATCH_KEYS = { bpm: 1, loopStart: 1, loopEnd: 1 };
function isQuietSongPatch(body) {
  const keys = Object.keys(body || {});
  return keys.length > 0 && keys.every(function (k) { return QUIET_SONG_PATCH_KEYS[k]; });
}

module.exports = async (req, res) => {
  let pool;
  try {
    pool = getPool();
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }

  const id = req.query.id;

  try {
    if (req.method === "PATCH") {
      const user = requireUser(req, res);
      if (!user) return;
      const { rows } = await pool.query("SELECT data FROM songs WHERE id = $1", [id]);
      if (!rows.length) { res.status(404).json({ error: "Song not found" }); return; }
      const existing = rows[0].data;
      const merged = Object.assign({}, existing, req.body, { updatedAt: new Date().toISOString() });
      await pool.query("UPDATE songs SET data = $2::jsonb WHERE id = $1", [id, JSON.stringify(merged)]);
      // If this update replaced the page images — a PDF re-upload, tags
      // saved from the chord tagger (default chart or one of this song's
      // other key versions), or a key version added/removed/replaced in the
      // song editor — clean up any blobs no longer used by either the
      // default chart or any key version.
      if (Object.prototype.hasOwnProperty.call(req.body, "pages") || Object.prototype.hasOwnProperty.call(req.body, "variants")) {
        const oldUrls = allPageUrls(existing);
        const newUrls = new Set(allPageUrls(merged));
        const orphaned = oldUrls.filter(function (u) { return !newUrls.has(u); });
        await deleteBlobs(orphaned);
      }
      if (!isQuietSongPatch(req.body)) await logActivity(pool, user, "song_updated", merged.title || "Untitled");
      res.status(200).json(Object.assign({ id: id }, merged));
      return;
    }

    if (req.method === "DELETE") {
      const user = requireUser(req, res);
      if (!user) return;
      const { rows } = await pool.query("SELECT data FROM songs WHERE id = $1", [id]);
      await pool.query("DELETE FROM songs WHERE id = $1", [id]);
      if (rows.length) await deleteBlobs(allPageUrls(rows[0].data));
      await logActivity(pool, user, "song_deleted", (rows.length && rows[0].data.title) || "Untitled");
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
