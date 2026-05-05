import { Router } from 'express';
import multer from 'multer';
import { Client as MinioClient } from 'minio';
import { Queue } from 'bullmq';
import Redis from "ioredis";
import Document from '../models/Document.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Multer — принимает файл в память (до 20MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOCX, TXT allowed'));
  },
});

// MinIO клиент
const minio = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// Redis + BullMQ очередь — Producer для воркера Вадима
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const translationQueue = new Queue('translation', { connection: redisConnection });

// POST /api/documents/upload
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { sourceLang, targetLang, outputFormat } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'File is required' });
    if (!sourceLang || !targetLang) return res.status(400).json({ error: 'sourceLang and targetLang are required' });
    if (sourceLang === targetLang) return res.status(400).json({ error: 'sourceLang and targetLang must differ' });

    // Шаг 1: Сначала создаём документ в MongoDB со статусом pending
    // ВАЖНО: воркер Вадима делает updateOne без upsert — документ должен существовать до джоба
    const doc = await Document.create({
      userId: req.user.id,
      originalName: file.originalname,
      sourceMimeType: file.mimetype,
      sourceFileKey: '', // заполним после загрузки в MinIO
      sourceLang,
      targetLang,
      outputFormat: outputFormat || 'pdf',
    });

    // Шаг 2: Загружаем файл в MinIO бакет uploads
    const fileKey = `uploads/${doc._id}/${file.originalname}`;
    const bucketName = process.env.MINIO_BUCKET_UPLOADS || 'uploads';

    // Создаём бакет если не существует
    const bucketExists = await minio.bucketExists(bucketName);
    if (!bucketExists) await minio.makeBucket(bucketName);

    await minio.putObject(bucketName, fileKey, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    // Шаг 3: Обновляем документ с ключом файла в MinIO
    doc.sourceFileKey = fileKey;
    await doc.save();

    // Шаг 4: Ставим джоб в очередь для воркера Вадима
    // Формат строго по SPEC.md — Producer contract
    await translationQueue.add(
      'translate',
      {
        documentId: doc._id.toString(),
        sourceFileKey: fileKey,
        sourceMimeType: file.mimetype,
        sourceLang,
        targetLang,
        outputFormat: outputFormat || 'pdf',
      },
      {
        attempts: 5,
        backoff: { type: 'custom' },
        jobId: doc._id.toString(), // idempotency — один документ = один джоб
      }
    );

    res.status(201).json({
      message: 'Document uploaded and queued for translation',
      document: {
        id: doc._id,
        originalName: doc.originalName,
        status: doc.status,
        sourceLang: doc.sourceLang,
        targetLang: doc.targetLang,
        outputFormat: doc.outputFormat,
        createdAt: doc.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents — список документов текущего пользователя
router.get('/', requireAuth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id — статус конкретного документа
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
