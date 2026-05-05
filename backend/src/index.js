import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectMongo } from './config/mongo.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// Health check — Kubernetes использует этот эндпоинт чтобы проверить что сервер живой
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Запуск сервера
async function start() {
  await connectMongo();
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

start();
