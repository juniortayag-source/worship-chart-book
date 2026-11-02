const { getPool } = require("./_db");
const { userOf } = require("./_auth");
const { logActivity } = require("./_activity");

// Called by the login screen with the name/password the person just typed,
// sent as HTTP Basic Auth (so the credential-checking logic stays in one
// place, _auth.js, shared with every other route). Returns the matched
// account on success, or a 401 the login screen shows as "incorrect name or
// password" on failure. The front end holds onto the Authorization value
// itself (in this tab's sessionStorage) and attaches it to every request
// from here on — there's no server-side session to manage.
module.exports = async (req, res) => {
  const user = userOf(req);
  if (!user) {
    res.setHeader("WWW-Authenticate", 'Basic realm="MFBC Worship Team", charset="UTF-8"');
    res.status(401).json({ error: "Incorrect name or password." });
    return;
  }
  try {
    await logActivity(getPool(), user, "logged_in", null);
  } catch (e) {
    // Logging is best-effort (and getPool() throws if DATABASE_URL isn't
    // set yet) — never block a successful login over it.
  }
  res.status(200).json({ user: user });
};
