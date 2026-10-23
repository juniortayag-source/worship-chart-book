// Viewing is public by default (see index.html / api/whoami.js) — there's no
// gate on reading songs, charts, or Sunday logs. Only writes need checking,
// and this file checks them directly against APP_PASSWORD, by reading the
// browser's HTTP Basic Auth header on the request itself. (There's no
// middleware stamping a role onto requests anymore — see api/login.js for
// how the browser is made to prompt for that header in the first place.)
function passwordFromAuthHeader(auth) {
  if (!auth || !auth.startsWith("Basic ")) return null;
  try {
    const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
    const colonIndex = decoded.indexOf(":");
    return colonIndex === -1 ? decoded : decoded.slice(colonIndex + 1);
  } catch (e) {
    return null;
  }
}

// "editor" if the request carries the correct APP_PASSWORD via Basic Auth,
// or if no APP_PASSWORD has been set at all (nothing to check against, so
// everyone gets full access — same as before any password was configured).
// Otherwise "viewer".
function roleOf(req) {
  const editPassword = process.env.APP_PASSWORD;
  if (!editPassword) return "editor";
  const auth = req.headers && (req.headers["authorization"] || req.headers["Authorization"]);
  const password = passwordFromAuthHeader(auth);
  return password === editPassword ? "editor" : "viewer";
}
function isViewer(req) {
  return roleOf(req) !== "editor";
}
// Returns true if the request may proceed. On a view-only request it sends
// the 403 itself and returns false, so callers just do:
//   if (!requireEditor(req, res)) return;
function requireEditor(req, res) {
  if (isViewer(req)) {
    res.status(403).json({ error: "View-only access: changes aren't allowed." });
    return false;
  }
  return true;
}

module.exports = {
  roleOf: roleOf,
  isViewer: isViewer,
  requireEditor: requireEditor,
  passwordFromAuthHeader: passwordFromAuthHeader,
};
