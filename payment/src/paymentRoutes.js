const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createCheckoutSession } = require("./stripeService");

// POST /api/payments/create-session
// Клиент нажимает "Оплатить" → фронтенд вызывает этот endpoint
router.post("/create-session", async (req, res) => {
  try {
    const { documentId, amount, customerEmail } = req.body;
    const session = await createCheckoutSession(
      documentId,
      amount,
      customerEmail,
    );
    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payments/webhook
// Stripe отправляет сюда уведомление когда оплата прошла успешно
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      // Проверяем что запрос действительно от Stripe
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      console.error("Webhook signature error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    // Оплата прошла успешно
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const documentId = session.metadata.documentId;
      console.log(`✅ Payment successful for document: ${documentId}`);
      // Позже здесь добавим: обновить статус документа в MongoDB → отправить в очередь
    }

    res.json({ received: true });
  },
);

module.exports = router;
