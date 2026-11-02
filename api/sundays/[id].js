const { getPool, rowToDoc } = require("../_db");
const { requireUser } = require("../_auth");
const { logActivity } = require("../_activity");

// Spacing drags between songs and each account's own private annotations
// both auto-save on every little change, so a PATCH carrying only these
// isn't worth a line in the Activity Log — everything else about a Sunday
// (its date, leader, song list/order) still gets logged.
const QUIET_SUNDAY_PATCH_KEYS = { gaps: 1, annotationsByUser: 1 };
function isQuietSundayPatch(body) {
  const keys = Object.keys(body || {});
  return keys.length > 0 && keys.every(function (k) { return QUIET_SUNDAY_PATCH_KEYS[k]; });
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
      if (!isQuietSundayPatch(req.body)) await logActivity(pool, user, "sunday_updated", merged.date || "");
      res.status(200).json(Object.assign({ id: id }, merged));
      return;
    }

    if (req.method === "DELETE") {
      const user = requireUser(req, res);
      if (!user) return;
      const { rows } = await pool.query("SELECT data FROM sundays WHERE id = $1", [id]);
      await pool.query("DELETE FROM sundays WHERE id = $1", [id]);
      await logActivity(pool, user, "sunday_deleted", (rows.length && rows[0].data.date) || "");
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
