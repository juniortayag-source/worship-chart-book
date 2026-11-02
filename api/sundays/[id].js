const { getPool, rowToDoc } = require("../_db");
const { requireUser } = require("../_auth");

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
      const { rows } = await pool.query("SELECT data FROM sundays WHERE id = $1", [id]);
      if (!rows.length) { res.status(404).json({ error: "Sunday log not found" }); return; }
      const existing = rows[0].data;
      const merged = Object.assign({}, existing, req.body, { updatedAt: new Date().toISOString() });
      // Each account's annotations (notes/shapes/arrows/drawings on a set)
      // are private to them, stored as one slice per user under
      // annotationsByUser. A PATCH only ever carries the signed-in user's
      // own slice, so merge just that key in — the generic Object.assign
      // above would otherwise let one save silently replace (and wipe out)
      // every other user's notes on this same set.
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, "annotationsByUser")) {
        const mine = (req.body.annotationsByUser || {})[user.id];
        merged.annotationsByUser = Object.assign({}, existing.annotationsByUser || {});
        if (mine !== undefined) merged.annotationsByUser[user.id] = mine;
      }
      await pool.query("UPDATE sundays SET data = $2::jsonb WHERE id = $1", [id, JSON.stringify(merged)]);
      res.status(200).json(Object.assign({ id: id }, merged));
      return;
    }

    if (req.method === "DELETE") {
      if (!requireUser(req, res)) return;
      await pool.query("DELETE FROM sundays WHERE id = $1", [id]);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
