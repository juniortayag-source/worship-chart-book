const { requireUser, publicUsers } = require("./_auth");

// The team roster (id + name only, no passwords) — used by the Availability
// grid to know whose column is whose. Any logged-in account can read it;
// it's not secret, it's the same list everyone already picks their name
// from on the login screen.
module.exports = async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const list = publicUsers().slice().sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });
  res.status(200).json(list);
};
