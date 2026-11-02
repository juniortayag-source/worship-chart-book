// Named worship-team accounts. There is no view-only role anymore — every
// account that can log in can edit everything (songs, sets, chord charts).
// "Not logged in" is the only non-editor state, and unlike before, it no
// longer gets read access either: every route below checks this, including
// the GET ones (see api/songs.js, api/sundays.js), so the app is private to
// the team end to end.
//
// Passwords live here in plain text for simplicity — this is a small,
// trusted volunteer team's internal tool, not a public service, and the
// project already kept its one shared APP_PASSWORD this same way. To change
// a name or password without touching code (and without it sitting in git
// history), set an APP_USERS environment variable in Vercel to a JSON array
// in this same shape — [{"id":"junior","name":"Junior","password":"..."}]
// — and it's used instead of the list below.
//
// Each account's `id` is also the key its private set annotations are
// stored under (see index.html's annotationsByUser) — so when a name
// changes (Katrina -> Katreena below), the `id` stays put and only `name`
// changes, which keeps that person's existing notes attached to their
// account instead of orphaning them under an id nobody logs in as anymore.
var DEFAULT_USERS = [
  { id: "brian", name: "Brian", password: "MFBCworshipteam!!" },
  { id: "cristian", name: "Cristian", password: "MFBCworshipteam!!" },
  { id: "david", name: "David", password: "MFBCworshipteam!!" },
  { id: "janine", name: "Janine", password: "MFBCworshipteam!!" },
  { id: "jayronn", name: "Jayronn", password: "MFBCworshipteam!!" },
  { id: "junior", name: "Junior", password: "MFBCworshipteam!!" },
  { id: "katrina", name: "Katreena", password: "MFBCworshipteam!!" },
  { id: "kevin", name: "Kevin", password: "MFBCworshipteam!!" },
  { id: "kirsten", name: "Kirsten", password: "MFBCworshipteam!!" },
  { id: "kris", name: "Kris", password: "MFBCworshipteam!!" },
  { id: "liezl", name: "Liezl", password: "MFBCworshipteam!!" },
];

function loadUsers() {
  if (process.env.APP_USERS) {
    try {
      var parsed = JSON.parse(process.env.APP_USERS);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (e) {
      // Fall through to the default roster below if APP_USERS is malformed.
    }
  }
  return DEFAULT_USERS;
}

// Basic Auth carries "name:password" base64-encoded. Unlike the old single-
// password scheme, the username half now matters: it's how we tell the five
// accounts apart.
function credsFromAuthHeader(auth) {
  if (!auth || !auth.startsWith("Basic ")) return null;
  try {
    var decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
    var colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) return { name: decoded, password: "" };
    return { name: decoded.slice(0, colonIndex), password: decoded.slice(colonIndex + 1) };
  } catch (e) {
    return null;
  }
}

// Returns { id, name } for a request carrying valid credentials for one of
// the accounts above, or null otherwise. Never throws, never challenges —
// callers that need to enforce login use requireUser below.
function userOf(req) {
  var auth = req.headers && (req.headers["authorization"] || req.headers["Authorization"]);
  var creds = credsFromAuthHeader(auth);
  if (!creds || !creds.name) return null;
  var match = loadUsers().find(function (u) {
    return u.name.toLowerCase() === creds.name.toLowerCase() && u.password === creds.password;
  });
  return match ? { id: match.id, name: match.name } : null;
}

// Returns the logged-in user and lets the request proceed, or sends a 401
// (with the header that would make a browser's native auth prompt appear,
// for anything hitting these routes directly) and returns null so callers
// just do:
//   const user = requireUser(req, res);
//   if (!user) return;
function requireUser(req, res) {
  var user = userOf(req);
  if (!user) {
    res.setHeader("WWW-Authenticate", 'Basic realm="MFBC Worship Team", charset="UTF-8"');
    res.status(401).json({ error: "Please sign in." });
    return null;
  }
  return user;
}

module.exports = {
  userOf: userOf,
  requireUser: requireUser,
};
