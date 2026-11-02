const { randomUUID } = require("crypto");

// Records one line in the Activity Log (see api/activity.js for reading it
// back) — who did what, and a short human-readable detail. Called from the
// write routes (songs, sundays, login) right after their own change
// succeeds. Deliberately best-effort: a logging failure is swallowed rather
// than thrown, so a hiccup here never breaks the real operation it's
// attached to, and callers never need to wrap this in their own try/catch.
function logActivity(pool, user, action, detail) {
  if (!pool || !user) return Promise.resolve();
  var data = { userId: user.id, userName: user.name, action: action, detail: detail || null };
  return pool.query(
    "INSERT INTO activity_log (id, data) VALUES ($1, $2::jsonb)",
    [randomUUID(), JSON.stringify(data)]
  ).catch(function () {});
}

module.exports = { logActivity: logActivity };
