const { randomUUID } = require("crypto");
const { getPool, rowToDoc } = require("./_db");
const { requireEditor } = require("./_auth");

module.exports = async (req, res) => {
  let pool;
  try {
    pool = getPool();
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }

  try {
    if (req.method === "GET") {
      const { rows } = await pool.query("SELECT id, data FROM songs");
      res.status(200).json(rows.map(rowToDoc));
      return;
    }

    if (req.method === "POST") {
      if (!requireEditor(req, res)) return;
      const id = randomUUID();
      const data = Object.assign({}, req.body, { addedAt: new Date().toISOString() });
      await pool.query("INSERT INTO songs (id, data) VALUES ($1, $2::jsonb)", [id, JSON.stringify(data)]);
      res.status(200).json(Object.assign({ id: id }, data));
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
