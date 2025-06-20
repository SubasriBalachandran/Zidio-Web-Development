const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const crypto = require("crypto");
const Upload = require("../models/upload");
const auth = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/excel", auth, upload.single("excelsheet"), async (req, res) => {
  try {
    const buffer = req.file.buffer;
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    const summary = {
      totalRows: jsonData.length,
      columns: Object.keys(jsonData[0]),
    };

    const contentHash = crypto.createHash("sha256").update(buffer).digest("hex");

    const newUpload = new Upload({
      user: req.user._id,
      fileName: req.file.originalname,
      contentHash,
      summary,
      rows: jsonData,
    });

    await newUpload.save();

    res.status(200).json({ message: "File uploaded", summary, data: jsonData, columns: summary.columns });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

router.get("/history", auth, async (req, res) => {
  try {
    const uploads = await Upload.find({ user: req.user._id }).sort({ uploadedAt: -1 });
    res.json({ uploads });
  } catch (err) {
    res.status(500).json({ message: "History fetch failed", error: err.message });
  }
});

module.exports = router;
