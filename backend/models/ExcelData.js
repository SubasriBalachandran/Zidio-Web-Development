// models/ExcelData.js
const mongoose = require("mongoose");

const excelDataSchema = new mongoose.Schema({
  data: { type: Array, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ExcelData", excelDataSchema);
