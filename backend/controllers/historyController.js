const Upload = require("../models/upload");

const getHistory = async (req, res) => {
  try {
    const uploads = await Upload.find().sort({ uploadedAt: -1 });
    res.json({ history: uploads });
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
};

module.exports = { getHistory };
