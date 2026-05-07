const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const {
  getPendingDocuments,
  assignToNotarization,
  signDocument,
  getDocumentById,
} = require("./notarizationService");
const { sendNotaryEmail, sendClientEmail } = require("./emailService");

// Middleware — проверяет что пользователь залогинен и имеет роль notary
const authNotary = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Проверяем роль — только notary может работать с этими endpoints
    if (decoded.role !== "notary") {
      return res
        .status(403)
        .json({ error: "Access denied. Notary role required" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// GET /api/notary/documents
// Нотариус видит список документов ожидающих подписания
router.get("/documents", authNotary, async (req, res) => {
  try {
    const documents = await getPendingDocuments();
    res.json({ documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notary/assign/:documentId
// Назначить документ на нотаризацию (статус translated → notarizing)
router.post("/assign/:documentId", authNotary, async (req, res) => {
  try {
    const document = await assignToNotarization(req.params.documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ message: "Document assigned to notarization", document });
  } catch (error) {
    console.error("Error assigning document:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notary/sign/:documentId
// Нотариус подписывает документ (статус notarizing → done)
router.post("/sign/:documentId", authNotary, async (req, res) => {
  try {
    const document = await signDocument(req.params.documentId, req.user.id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    console.log(
      `✅ Document ${req.params.documentId} signed by notary ${req.user.id}`,
    );
    // Отправляем email клиенту что документ готов
    await sendClientEmail(req.user.email, req.params.documentId);

    res.json({ message: "Document successfully notarized", document });
  } catch (error) {
    console.error("Error signing document:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notary/document/:documentId
// Просмотр конкретного документа
router.get("/document/:documentId", authNotary, async (req, res) => {
  try {
    const document = await getDocumentById(req.params.documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ document });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
