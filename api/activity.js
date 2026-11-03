const { getPool } = require("./_db");
const { requireUser } = require("./_auth");
const { logActivity } = require("./_activity");

// The Activity Log: who did what (songs/Sunday sets added, edited, deleted;
// availability marked; logins), newest first — and clearing it out. Restricted to admin accounts
// (see api/_auth.js) — anyone else gets a 403 on either method, same as if
// the route didn't exist. Entries themselves are written by the other
// routes via api/_activity.js right after their own change succeeds;
// there's no way to add one directly here.
module.exports = async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  if (!user.isAdmin) {
    res.status(403).json({ error: "Not available for this account." });
    return;
  }
  let pool;
  try {
    pool = getPool();
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }

  if (req.method === "GET") {
    try {
      const { rows } = await pool.query(
        "SELECT id, data, created_at FROM activity_log ORDER BY created_at DESC LIMIT 300"
      );
      res.status(200).json(
        rows.map(function (r) {
          return Object.assign({ id: r.id, at: r.created_at }, r.data);
        })
      );
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  if (req.method === "DELETE") {
    try {
      await pool.query("DELETE FROM activity_log");
      // Leave one line behind saying the log was cleared, and by whom —
      // otherwise an empty log looks the same whether nothing ever
      // happened or someone just wiped the history.
      await logActivity(pool, user, "activity_log_cleared", null);
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
