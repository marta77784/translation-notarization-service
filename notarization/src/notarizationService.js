const mongoose = require("mongoose");

// Схема документа — должна совпадать с тем что сделает Алекс в backend
const documentSchema = new mongoose.Schema({
  userId: String,
  originalFile: String,
  translatedFile: String,
  status: {
    type: String,
    enum: [
      "uploaded",
      "paid",
      "translating",
      "translated",
      "notarizing",
      "notarized",
      "done",
    ],
    default: "uploaded",
  },
  fromLang: String,
  toLang: String,
  notaryId: String,
  createdAt: { type: Date, default: Date.now },
});

const Document = mongoose.model("Document", documentSchema);

// Получить все документы которые ждут нотаризации
const getPendingDocuments = async () => {
  return await Document.find({ status: "translated" });
};

// Назначить документ на нотаризацию
const assignToNotarization = async (documentId) => {
  const document = await Document.findByIdAndUpdate(
    documentId,
    { status: "notarizing" },
    { new: true }, // вернуть обновлённый документ
  );
  return document;
};

// Подписать документ нотариусом
const signDocument = async (documentId, notaryId) => {
  const document = await Document.findByIdAndUpdate(
    documentId,
    {
      status: "done",
      notaryId: notaryId,
    },
    { new: true },
  );
  return document;
};

// Получить один документ по ID
const getDocumentById = async (documentId) => {
  return await Document.findById(documentId);
};

module.exports = {
  getPendingDocuments,
  assignToNotarization,
  signDocument,
  getDocumentById,
  Document,
};
