import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  sourceMimeType: { type: String, required: true },
  sourceFileKey: { type: String, required: true }, // путь в MinIO бакете uploads
  sourceLang: { type: String, enum: ['ru', 'en'], required: true },
  targetLang: { type: String, enum: ['ru', 'en'], required: true },
  outputFormat: { type: String, enum: ['pdf', 'docx', 'txt'], default: 'pdf' },

  // Статусы которые обновляет воркер Вадима
  status: {
    type: String,
    enum: ['pending', 'translating', 'translated', 'notarizing', 'notarized', 'paid', 'failed'],
    default: 'pending',
  },
  progress: { type: Number, default: 0 },
  translatedFileKey: { type: String }, // путь в MinIO бакете translations
  translatedAt: { type: Date },
  error: { type: String },

  // Оплата через Stripe
  paid: { type: Boolean, default: false },
  stripeSessionId: { type: String },
}, { timestamps: true });

export default mongoose.model('Document', documentSchema);
