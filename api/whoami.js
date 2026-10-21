const { roleOf } = require("./_auth");

// Lets the front-end know whether the current visitor authenticated with
// the full-access password or the view-only one, so it can hide editing
// controls accordingly. This is a UI convenience only — every write route
// enforces the same check itself (see _auth.js), so a view-only visitor
// can't get write access just by skipping this call.
module.exports = async (req, res) => {
  res.status(200).json({ role: roleOf(req) });
};
