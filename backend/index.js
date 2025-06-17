const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
const uploadRoutes = require("./routes/uploadRoutes");
app.use("/api/upload", uploadRoutes);
const analysisRoutes = require("./routes/analysisRoutes");
app.use("/api/analysis", analysisRoutes);

app.get("/", (req, res) => res.send("Backend is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
