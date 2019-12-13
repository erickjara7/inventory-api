const nodemailer = require("nodemailer");

const sendEmail = async options => {
  const transporter = nodemailer.createTransport({
    // Configuracion SMTP (Gmail, Mailtrap, Sendpulse, etc)
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  const info = await transporter.sendMail(message);

  if (process.env.NODE_ENV === "development") {
    console.log("Mensaje enviado: %s", info.messageId);
  }
};

module.exports = sendEmail;
