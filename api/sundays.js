const { randomUUID } = require("crypto");
const { getPool, rowToDoc } = require("./_db");

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
      const { rows } = await pool.query("SELECT id, data FROM sundays");
      res.status(200).json(rows.map(rowToDoc));
      return;
    }

    if (req.method === "POST") {
      const id = randomUUID();
      const data = Object.assign({}, req.body, { createdAt: new Date().toISOString() });
      await pool.query("INSERT INTO sundays (id, data) VALUES ($1, $2::jsonb)", [id, JSON.stringify(data)]);
      res.status(200).json(Object.assign({ id: id }, data));
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
