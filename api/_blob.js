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

// Same as pageUrls, but also sweeps in the page images of every "other key
// version" attached to a song (see "Add another key" in the song editor),
// so deleting a song or replacing/removing one of its key versions cleans
// up every image it owns, not just the default chart's.
function allPageUrls(doc) {
  var urls = pageUrls(doc && doc.pages);
  (doc && doc.variants || []).forEach(function (v) {
    urls = urls.concat(pageUrls(v && v.pages));
  });
  return urls;
}

module.exports = { deleteBlobs: deleteBlobs, pageUrls: pageUrls, allPageUrls: allPageUrls };
