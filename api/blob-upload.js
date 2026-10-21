const { put } = require("@vercel/blob");
const { requireEditor } = require("./_auth");

// Receives one rendered chord-chart page image (base64-encoded JSON, sent
// from the browser after pdf.js draws the PDF page to a canvas) and stores
// it in Vercel Blob storage. The original PDF file is never sent here —
// only this derived image.
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!requireEditor(req, res)) return;
  try {
    var body = req.body || {};
    var filename = body.filename;
    var contentType = body.contentType || "image/jpeg";
    var dataBase64 = body.dataBase64;
    if (!filename || !dataBase64) {
      res.status(400).json({ error: "filename and dataBase64 are required" });
      return;
    }
    var buffer = Buffer.from(dataBase64, "base64");
    var blob = await put(filename, buffer, {
      access: "public",
      contentType: contentType,
      addRandomSuffix: true,
    });
    res.status(200).json({ url: blob.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
