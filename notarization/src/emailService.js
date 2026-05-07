const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Email нотариусу — новый документ ждёт подписания
const sendNotaryEmail = async (notaryEmail, documentId) => {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: notaryEmail,
    subject: "New document ready for notarization",
    html: `
      <h2>New Document Ready for Notarization</h2>
      <p>A translated document is waiting for your signature.</p>
      <p><strong>Document ID:</strong> ${documentId}</p>
      <p>Please log in to your notary cabinet to review and sign.</p>
      <a href="${process.env.FRONTEND_URL}/notary">Go to Notary Cabinet</a>
    `,
  });
  console.log(`📧 Email sent to notary: ${notaryEmail}`);
};

// Email клиенту — документ готов
const sendClientEmail = async (clientEmail, documentId) => {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: clientEmail,
    subject: "Your document is ready!",
    html: `
      <h2>Your Document is Ready!</h2>
      <p>Your document has been translated and notarized successfully.</p>
      <p><strong>Document ID:</strong> ${documentId}</p>
      <p>You can now download it from your dashboard.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard">Go to Dashboard</a>
    `,
  });
  console.log(`📧 Email sent to client: ${clientEmail}`);
};

module.exports = { sendNotaryEmail, sendClientEmail };
