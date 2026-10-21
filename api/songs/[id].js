const { getPool, rowToDoc } = require("../_db");
const { deleteBlobs, pageUrls } = require("../_blob");

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
      const { rows } = await pool.query("SELECT data FROM songs WHERE id = $1", [id]);
      if (!rows.length) { res.status(404).json({ error: "Song not found" }); return; }
      const existing = rows[0].data;
      const merged = Object.assign({}, existing, req.body, { updatedAt: new Date().toISOString() });
      await pool.query("UPDATE songs SET data = $2::jsonb WHERE id = $1", [id, JSON.stringify(merged)]);
      // If this update replaced the page images (a PDF re-upload, or tags
      // saved from the chord tagger), clean up any blobs no longer used.
      if (Object.prototype.hasOwnProperty.call(req.body, "pages")) {
        const oldUrls = pageUrls(existing.pages);
        const newUrls = new Set(pageUrls(merged.pages));
        const orphaned = oldUrls.filter(function (u) { return !newUrls.has(u); });
        await deleteBlobs(orphaned);
      }
      res.status(200).json(Object.assign({ id: id }, merged));
      return;
    }

    if (req.method === "DELETE") {
      const { rows } = await pool.query("SELECT data FROM songs WHERE id = $1", [id]);
      await pool.query("DELETE FROM songs WHERE id = $1", [id]);
      if (rows.length) await deleteBlobs(pageUrls(rows[0].data && rows[0].data.pages));
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
