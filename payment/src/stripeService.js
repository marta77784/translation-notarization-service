const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (documentId, amount, customerEmail) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Document Translation + Notarization",
            description: `Document ID: ${documentId}`,
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `http://localhost:3000/dashboard?payment=success&documentId=${documentId}`,
    cancel_url: `http://localhost:3000/dashboard?payment=cancelled`,
    metadata: {
      documentId: documentId,
    },
  });

  return session;
};

module.exports = { createCheckoutSession };
