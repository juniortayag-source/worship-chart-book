const { roleOf } = require("./_auth");

// Passively reports whether the browser is currently sending the correct
// APP_PASSWORD (role "editor") or not (role "viewer", the default for
// everyone until they click "Login") — purely so the front-end knows
// whether to show editing controls. This route never challenges for a
// password itself (see api/login.js for that); every write route enforces
// the same check again on its own, so a view-only visitor can't get write
// access just by skipping this call.
module.exports = async (req, res) => {
  res.status(200).json({ role: roleOf(req) });
};
