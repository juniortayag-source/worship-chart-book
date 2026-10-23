const { passwordFromAuthHeader } = require("./_auth");

// The only endpoint that ever issues an HTTP Basic Auth challenge. Viewing
// the app and its data never does (see api/whoami.js, and every other
// route) — this one exists purely so the "Login" button has something to
// call that makes the browser pop its native username/password dialog.
//
// With no Authorization header (or the wrong password), it replies 401 with
// a WWW-Authenticate header, which is what triggers that dialog, same as it
// would for a page the browser is denied straight out. Once the visitor
// enters the right password, the browser retries this same request with it
// attached, gets a 200 back, and then keeps sending that password on every
// later same-origin request for the rest of the browsing session — which is
// what lets the actual write routes (api/songs.js etc.) check it too.
module.exports = async (req, res) => {
  const editPassword = process.env.APP_PASSWORD;
  if (!editPassword) {
    // Nothing configured to log in with — just report full access.
    res.status(200).json({ role: "editor" });
    return;
  }
  const auth = req.headers["authorization"];
  const password = passwordFromAuthHeader(auth);
  if (password !== editPassword) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Worship Chart Book", charset="UTF-8"');
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  res.status(200).json({ role: "editor" });
};
