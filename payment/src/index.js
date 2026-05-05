require("dotenv").config();
const express = require("express");
const cors = require("cors");
const paymentRoutes = require("./paymentRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

// Вебхук должен идти ДО express.json() — ему нужен raw body
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(cors());
app.use(express.json());

// Все payment роуты
app.use("/api/payments", paymentRoutes);

// Health check — Kubernetes проверяет этот endpoint чтобы убедиться что сервис живой
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "payment-service" });
});

app.listen(PORT, () => {
  console.log(`💳 Payment service running on port ${PORT}`);
});
