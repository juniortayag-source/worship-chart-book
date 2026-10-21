// The middleware (see middleware.js) resolves which password was used and
// stamps the request with an x-app-role header before it ever reaches these
// functions. "viewer" can read everything but must not be able to change
// anything, even by calling an API route directly — so every write handler
// checks this, not just the front-end UI.
function roleOf(req) {
  return (req.headers && req.headers["x-app-role"]) || "editor";
}
function isViewer(req) {
  return roleOf(req) === "viewer";
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

module.exports = { roleOf: roleOf, isViewer: isViewer, requireEditor: requireEditor };
