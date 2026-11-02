const { userOf } = require("./_auth");

// Passively reports who (if anyone) the credentials this browser tab is
// sending belong to — used on page load to confirm a remembered login from
// sessionStorage is still good (e.g. a password wasn't changed since). Never
// challenges for credentials itself (see api/login.js for that), so it's
// safe to call before the app knows whether anyone is logged in at all.
module.exports = async (req, res) => {
  const user = userOf(req);
  res.status(200).json({ user: user || null });
};
