const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const ExcelData = require("../models/ExcelData");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const handleExcelUpload = (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Delete the file
    fs.unlinkSync(filePath);

    // Calculate basic summary (e.g., number of rows, column names)
    const summary = {
      totalRows: data.length,
      columns: Object.keys(data[0] || {}),
    };

    return res.status(200).json({
      message: "File processed successfully",
      summary,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    return res.status(500).json({ message: "Error processing file", error: error.message });
  }
};

// Upload & Store Excel Data
router.post("/excel", upload.any(), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = req.files[0];

    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const jsonData = xlsx.utils.sheet_to_json(sheet);

    if (jsonData.length === 0) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    const savedData = new ExcelData({ data: jsonData });
    await savedData.save();

    res.status(200).json({
      message: "Excel file uploaded and data saved to MongoDB successfully",
      rowsStored: jsonData.length,
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


module.exports = router;
