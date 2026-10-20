
const nodemailer = require("nodemailer");

const requiredEnv = [
    "BREVO_SMTP_HOST",
    "BREVO_SMTP_PORT",
    "BREVO_SMTP_USER",
    "BREVO_SMTP_PASS",
    "BREVO_SENDER_EMAIL",
    "BREVO_SENDER_NAME"
];

function createTransporter() {
    const missing = requiredEnv.filter(
        (key) => !process.env[key]
    );

    if (missing.length > 0) {
        throw new Error(
            `Faltan variables de correo: ${missing.join(", ")}`
        );
    }

    return nodemailer.createTransport({
        host: "smtp-relay.sendinblue.com",
        port: Number(process.env.BREVO_SMTP_PORT),
        secure: Number(process.env.BREVO_SMTP_PORT) === 465,
        auth: {
            user: process.env.BREVO_SMTP_USER,
            pass: process.env.BREVO_SMTP_PASS
        }
    });
}

async function sendEmail({ to, subject, text, html }) {
    if (!to) {
        throw new Error("El destinatario del correo es obligatorio");
    }

    const transporter = createTransporter();

    return transporter.sendMail({
        from: {
            name: process.env.BREVO_SENDER_NAME,
            address: process.env.BREVO_SENDER_EMAIL
        },
        to,
        subject,
        text,
        html
    });
}

async function verifyEmailConnection() {
    const transporter = createTransporter();
    return transporter.verify();
}

module.exports = {
    sendEmail,
    verifyEmailConnection
};
