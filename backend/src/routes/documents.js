import { Router } from 'express';
import multer from 'multer';
import { Client as MinioClient } from 'minio';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import Document from '../models/Document.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOCX, TXT allowed'));
  },
});

const minio = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
const translationQueue = new Queue('translation', { connection: redisConnection });

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { sourceLang, targetLang, outputFormat } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'File is required' });
    if (!sourceLang || !targetLang) return res.status(400).json({ error: 'sourceLang and targetLang are required' });
    if (sourceLang === targetLang) return res.status(400).json({ error: 'sourceLang and targetLang must differ' });

    const tempId = new Date().getTime();
    const fileKey = `uploads/${tempId}/${file.originalname}`;
    const bucketName = process.env.MINIO_BUCKET_UPLOADS || 'uploads';

    const bucketExists = await minio.bucketExists(bucketName);
    if (!bucketExists) await minio.makeBucket(bucketName);

    await minio.putObject(bucketName, fileKey, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const doc = await Document.create({
      userId: req.user.id,
      originalName: file.originalname,
      sourceMimeType: file.mimetype,
      sourceFileKey: fileKey,
      sourceLang,
      targetLang,
      outputFormat: outputFormat || 'pdf',
    });

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
        jobId: doc._id.toString(),
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

router.get('/', requireAuth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

// PATCH /api/documents/:id/notarize — кабинет нотариуса
router.patch('/:id/notarize', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'notary') return res.status(403).json({ error: 'Notary role required' });
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { status: 'notarized', updatedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/documents/internal/:id/mark-paid — вызывается payment-сервисом после Stripe
router.patch('/internal/:id/mark-paid', async (req, res) => {
  try {
    const secret = req.headers['x-service-secret'];
    if (secret !== process.env.SERVICE_SECRET) {
      return res.status(403).json({ error: 'Invalid service secret' });
    }
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paid: true, updatedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id/download — presigned URL для скачивания переведённого файла
router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (!doc.translatedFileKey) return res.status(400).json({ error: 'Document not translated yet' });

    const url = await minio.presignedGetObject(
      process.env.MINIO_BUCKET_TRANSLATIONS || 'translations',
      doc.translatedFileKey,
      24 * 60 * 60 // ссылка действительна 24 часа
    );

    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/notary/queue — все документы со статусом notarizing для нотариуса
router.get('/notary/queue', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'notary') return res.status(403).json({ error: 'Notary role required' });
    const docs = await Document.find({ status: 'notarizing' }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
