const { getPool, rowToDoc } = require("../_db");

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
      const merged = Object.assign({}, rows[0].data, req.body, { updatedAt: new Date().toISOString() });
      await pool.query("UPDATE songs SET data = $2::jsonb WHERE id = $1", [id, JSON.stringify(merged)]);
      res.status(200).json(Object.assign({ id: id }, merged));
      return;
    }

    if (req.method === "DELETE") {
      await pool.query("DELETE FROM songs WHERE id = $1", [id]);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
