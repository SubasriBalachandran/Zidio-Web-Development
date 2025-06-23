const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const crypto = require("crypto");
const Upload = require("../models/upload");
const auth = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/upload/excel
 * Upload and process an Excel file
 */
router.post("/excel", auth, upload.single("excelsheet"), async (req, res) => {
  try {
    const buffer = req.file.buffer;
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    if (jsonData.length === 0) {
      return res.status(400).json({ message: "The Excel file is empty." });
    }

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

    res.status(200).json({
      message: "File uploaded",
      summary,
      data: jsonData,
      columns: summary.columns,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

/**
 * GET /api/upload/history
 * Fetch upload history for the current user
 */
router.get("/history", auth, async (req, res) => {
  try {
    const uploads = await Upload.find({ user: req.user._id }).sort({ uploadedAt: -1 });
    res.json({ uploads });
  } catch (error) {
    console.error("Fetch history error:", error);
    res.status(500).json({ message: "History fetch failed", error: error.message });
  }
});

/**
 * DELETE /api/upload/history
 * Clear all upload history for the current user
 */
router.delete("/history", auth, async (req, res) => {
  try {
    await Upload.deleteMany({ user: req.user._id });
    res.json({ message: "Upload history cleared." });
  } catch (error) {
    console.error("Error clearing upload history:", error);
    res.status(500).json({ message: "Failed to clear history." });
  }
});

/**
 * POST /api/upload/restore
 * Restore previously backed-up uploads (used for undo feature)
 */
router.post("/restore", auth, async (req, res) => {
  try {
    const { uploads } = req.body;

    if (!Array.isArray(uploads) || uploads.length === 0) {
      return res.status(400).json({ message: "No uploads provided for restoration." });
    }

    const restored = await Upload.insertMany(
      uploads.map((item) => ({
        user: req.user._id,
        fileName: item.fileName,
        contentHash: item.contentHash || "", 
        summary: item.summary,
        rows: item.rows,
        uploadedAt: new Date(item.uploadedAt || Date.now()),
      }))
    );

    res.json({ message: "History restored", uploads: restored });
  } catch (error) {
    console.error("Restore failed:", error);
    res.status(500).json({ message: "Failed to restore history." });
  }
});

module.exports = router;
