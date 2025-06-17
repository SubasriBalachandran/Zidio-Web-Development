const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema({
  fileName: String,
  contentHash: { type: String, unique: true },
  summary: {
    totalRows: Number,
    columns: [String],
  },
  rows: [mongoose.Schema.Types.Mixed], // ✅ Save all row data
});

module.exports = mongoose.model("Upload", uploadSchema);
