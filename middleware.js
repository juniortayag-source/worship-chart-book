const { next } = require("@vercel/functions");

// Password-gates the whole app (every page and every /api request) using
// plain HTTP Basic Auth, so the browser's own built-in login prompt handles
// it — no custom login page or session/cookie code needed. Any username
// works; only the password is checked.
//
// Two passwords are supported: APP_PASSWORD (full access) and
// APP_VIEW_PASSWORD (view-only — can look at everything but can't save
// changes). Whichever one matches sets an x-app-role request header
// ("editor" or "viewer") that the API routes check before any write (see
// api/_auth.js) — so view-only access is enforced on the server, not just
// hidden in the UI.
function unauthorized() {
  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Worship Chart Book", charset="UTF-8"',
    },
  });
}

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

module.exports = function middleware(request) {
  const editPassword = process.env.APP_PASSWORD;
  const viewPassword = process.env.APP_VIEW_PASSWORD;
  // If neither password has been set yet, don't lock everyone out of a
  // freshly deployed app — let requests through.
  if (!editPassword && !viewPassword) return next();

  const password = passwordFromAuthHeader(request.headers.get("authorization"));
  if (password == null) return unauthorized();

  let role = null;
  if (editPassword && password === editPassword) role = "editor";
  else if (viewPassword && password === viewPassword) role = "viewer";
  if (!role) return unauthorized();

  const headers = new Headers(request.headers);
  headers.set("x-app-role", role);
  return next({ request: { headers: headers } });
};
