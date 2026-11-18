import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const host = process.env.AWS_SES_SMTP_HOST || "email-smtp.us-east-1.amazonaws.com";
const port = parseInt(process.env.AWS_SES_SMTP_PORT || "587", 10);
const user = process.env.AWS_SES_SMTP_USER;
const pass = process.env.AWS_SES_SMTP_PASS;
const to = process.env.TEST_EMAIL_TO || "foysal0322@gmail.com";
const from = process.env.EMAIL_FROM || "foysal0322@gmail.com";

if (!user || !pass) {
  console.error("Missing AWS_SES_SMTP_USER or AWS_SES_SMTP_PASS in environment variables.");
  process.exit(1);
}

console.log(`Connecting to ${host}:${port}...`);
console.log(`Sending test email from <${from}> to <${to}>`);

const transport = nodemailer.createTransport({
  host,
  port,
  secure: false, // STARTTLS
  auth: {
    user,
    pass,
  },
  tls: {
    rejectUnauthorized: true,
  },
  debug: true,
  logger: true,
});

async function main() {
  try {
    console.log("Verifying SMTP connection...");
    await transport.verify();
    console.log("SMTP connection verified successfully!");

    console.log("Sending mail...");
    const info = await transport.sendMail({
      from: `"AmarSalon Test" <${from}>`,
      to,
      subject: "Test Email from AWS SES / Mail Manager via AmarSalon",
      text: "Hello Foysal,\n\nThis is a test email sent from AWS SES SMTP using your Mail Manager credentials.\n\nTimestamp: " + new Date().toISOString(),
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #0d9488; margin-top: 0;">AmarSalon AWS SES Test Email</h2>
          <p>Hello Foysal,</p>
          <p>This is a test email sent successfully using your <strong>AWS SES / Mail Manager SMTP</strong> credentials.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">
            <strong>SMTP Host:</strong> ${host}<br/>
            <strong>Port:</strong> ${port}<br/>
            <strong>Timestamp:</strong> ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
  } catch (error) {
    console.error("Error occurred while sending email:");
    console.error(error);
  }
}

main();
