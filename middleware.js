const { next } = require("@vercel/functions");

// Password-gates the whole app (every page and every /api request) using
// plain HTTP Basic Auth, so the browser's own built-in login prompt handles
// it — no custom login page or session/cookie code needed. Any username
// works; only the password is checked against the APP_PASSWORD environment
// variable. Once entered, the browser remembers it for the rest of that
// browser session and sends it automatically with the app's own API calls.
function unauthorized() {
  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Worship Chart Book", charset="UTF-8"',
    },
  });
}

module.exports = function middleware(request) {
  const expected = process.env.APP_PASSWORD;
  // If no password has been set yet, don't lock everyone out of a freshly
  // deployed app — let requests through. Set APP_PASSWORD to turn this on.
  if (!expected) return next();

  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Basic ")) return unauthorized();

  let decoded;
  try {
    decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
  } catch (e) {
    return unauthorized();
  }
  const colonIndex = decoded.indexOf(":");
  const password = colonIndex === -1 ? decoded : decoded.slice(colonIndex + 1);
  if (password !== expected) return unauthorized();

  return next();
};
