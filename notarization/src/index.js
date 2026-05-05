require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const notarizationRoutes = require("./notarizationRoutes");

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

// Роуты
app.use("/api/notary", notarizationRoutes);

// Health check — Kubernetes проверяет что сервис живой
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "notarization-service" });
});

app.listen(PORT, () => {
  console.log(`📋 Notarization service running on port ${PORT}`);
});
