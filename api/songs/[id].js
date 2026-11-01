const { getPool, rowToDoc } = require("../_db");
const { deleteBlobs, allPageUrls } = require("../_blob");
const { requireEditor } = require("../_auth");

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
      if (!requireEditor(req, res)) return;
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
      res.status(200).json(Object.assign({ id: id }, merged));
      return;
    }

    if (req.method === "DELETE") {
      if (!requireEditor(req, res)) return;
      const { rows } = await pool.query("SELECT data FROM songs WHERE id = $1", [id]);
      await pool.query("DELETE FROM songs WHERE id = $1", [id]);
      if (rows.length) await deleteBlobs(allPageUrls(rows[0].data));
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
