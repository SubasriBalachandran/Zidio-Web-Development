const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fileName: String,
  contentHash: { type: String, unique: true },
  summary: {
    totalRows: Number,
    columns: [String],
  },
  rows: [mongoose.Schema.Types.Mixed],
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Upload", uploadSchema);
