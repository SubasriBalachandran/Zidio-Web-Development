const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const ExcelData = require("../models/ExcelData");
const auth = require("../middleware/auth");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload & Store Excel Data
router.post("/excel", auth, upload.any(), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = req.files[0];

    if (!file.originalname.match(/\.(xls|xlsx)$/)) {
      return res.status(400).json({ message: "Only Excel files are allowed" });
    }

    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const jsonData = xlsx.utils.sheet_to_json(sheet);

    if (jsonData.length === 0) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    const summary = {
      totalRows: jsonData.length,
      columns: Object.keys(jsonData[0] || {}),
    };

    const savedData = new ExcelData({
      data: jsonData,
      user: req.user._id, 
      uploadedAt: new Date(),
    });

    await savedData.save();

    res.status(200).json({
      message: "Excel file uploaded and data saved to MongoDB successfully",
      summary,
      data: jsonData,
      columns: summary.columns,
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
