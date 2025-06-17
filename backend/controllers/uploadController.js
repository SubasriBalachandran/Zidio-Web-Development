const xlsx = require("xlsx");
const fs = require("fs");
const crypto = require("crypto");
const Upload = require("../models/upload");

const handleExcelUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;

    // ✅ Read and hash the file content
    const fileBuffer = fs.readFileSync(filePath);
    const contentHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // ✅ Check for duplicates using the content hash
    const existing = await Upload.findOne({ contentHash });
    if (existing) {
      fs.unlinkSync(filePath); // cleanup temp file
      return res.status(200).json({
        message: "File already uploaded",
        summary: existing.summary,
        rows: existing.rows,         // ✅ Return previously stored rows
        duplicate: true,
      });
    }

    // ✅ Parse the Excel file
    const workbook = xlsx.read(fileBuffer);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // ✅ Create a summary
    const summary = {
      totalRows: data.length,
      columns: Object.keys(data[0] || {}),
    };

    // ✅ Save upload to MongoDB including rows
    await Upload.create({
      fileName: req.file.originalname,
      contentHash,
      summary,
      rows: data,                     // ✅ Save full row data
    });

    fs.unlinkSync(filePath); // delete temp file

    // ✅ Respond to client with summary and rows
    return res.status(200).json({
      message: "File uploaded and processed",
      summary,
      rows: data,
      duplicate: false,
    });
  } catch (error) {
    console.error("Error processing Excel:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = { handleExcelUpload };
