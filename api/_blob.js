const { del } = require("@vercel/blob");

// Best-effort cleanup of page images that are no longer referenced by any
// song (replaced by a re-upload, or the song itself was deleted). Failures
// here are swallowed on purpose: the database row is the source of truth,
// and a leftover blob just wastes a little storage rather than breaking
// anything for the user.
function deleteBlobs(urls) {
  var list = (urls || []).filter(Boolean);
  if (!list.length) return Promise.resolve();
  return del(list).catch(function () {});
}

function pageUrls(pages) {
  return (pages || []).map(function (p) { return p && p.url; }).filter(Boolean);
}

module.exports = { deleteBlobs: deleteBlobs, pageUrls: pageUrls };
