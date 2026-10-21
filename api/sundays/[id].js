const { getPool, rowToDoc } = require("../_db");
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
      const { rows } = await pool.query("SELECT data FROM sundays WHERE id = $1", [id]);
      if (!rows.length) { res.status(404).json({ error: "Sunday log not found" }); return; }
      const merged = Object.assign({}, rows[0].data, req.body, { updatedAt: new Date().toISOString() });
      await pool.query("UPDATE sundays SET data = $2::jsonb WHERE id = $1", [id, JSON.stringify(merged)]);
      res.status(200).json(Object.assign({ id: id }, merged));
      return;
    }

    if (req.method === "DELETE") {
      if (!requireEditor(req, res)) return;
      await pool.query("DELETE FROM sundays WHERE id = $1", [id]);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
