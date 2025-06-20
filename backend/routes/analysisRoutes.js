const express = require("express");
const ExcelData = require("../models/ExcelData");

const router = express.Router();

router.get("/summary", async (req, res) => {
  try {
    const latest = await ExcelData.findOne().sort({ uploadedAt: -1 }); // 🔁 safer if you're not using timestamps

    if (!latest) {
      return res.status(404).json({ message: "No Excel data found" });
    }

    const data = latest.data;
    const totalRows = data.length;

    const columns = Object.keys(data[0] || {});
    const columnStats = columns.map((col) => ({
      column: col,
      filled: data.filter(row => row[col] !== undefined && row[col] !== "").length
    }));

    res.json({
      summary: {
        totalRows,
        columns,
        columnStats,
      },
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
