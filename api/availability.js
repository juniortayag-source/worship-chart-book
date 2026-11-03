const { getPool, rowToDoc } = require("./_db");
const { requireUser } = require("./_auth");

// Each row is keyed by the Sunday's date itself (e.g. "2026-11-08"), not a
// random id, so everyone's answer for that date lives in one place:
// { id: "2026-11-08", responses: { [userId]: "yes" | "no" } }. This table is
// independent of `sundays` — a date can have availability marked before
// anyone has built a set for it (or even if no set ever gets built).
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
      if (!requireUser(req, res)) return;
      const { rows } = await pool.query("SELECT id, data FROM availability");
      res.status(200).json(rows.map(rowToDoc));
      return;
    }

    if (req.method === "PATCH") {
      const user = requireUser(req, res);
      if (!user) return;
      const date = req.body && req.body.date;
      if (!date) {
        res.status(400).json({ error: "A date is required." });
        return;
      }
      // The status is always written under the signed-in user's own account
      // id, no matter what the request body claims — nobody can mark
      // someone else available or unavailable. Same guard rail as the
      // per-user annotation merge on PATCH /api/sundays/[id].
      const status = req.body.status === "yes" || req.body.status === "no" ? req.body.status : null;
      const { rows } = await pool.query("SELECT data FROM availability WHERE id = $1", [date]);
      const existing = rows.length ? rows[0].data : { date: date, responses: {} };
      const responses = Object.assign({}, existing.responses || {});
      if (status) {
        responses[user.id] = status;
      } else {
        delete responses[user.id];
      }
      const data = { date: date, responses: responses, updatedAt: new Date().toISOString() };
      await pool.query(
        "INSERT INTO availability (id, data) VALUES ($1, $2::jsonb) " +
          "ON CONFLICT (id) DO UPDATE SET data = $2::jsonb",
        [date, JSON.stringify(data)]
      );
      res.status(200).json(Object.assign({ id: date }, data));
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
