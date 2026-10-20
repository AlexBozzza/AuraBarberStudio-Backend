
require("dotenv").config();

const {
    verifyEmailConnection,
    sendEmail
} = require("./services/emailService");

async function testEmail() {
    try {
        console.log("Comprobando conexión con Brevo...");
        await verifyEmailConnection();
        console.log("✅ Conexión SMTP verificada.");

        const result = await sendEmail({
            to: process.env.BREVO_SENDER_EMAIL,
            subject: "Prueba de correo - Aura Barber Studio",
            text: "¡La configuración de correo de Aura Barber Studio funciona correctamente!",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Aura Barber Studio</h2>
                    <p>¡La configuración de correo funciona correctamente!</p>
                    <p>Ya estamos un paso más cerca de activar los recordatorios de citas.</p>
                </div>
            `
        });

        console.log("✅ Correo enviado.");
        console.log("ID del mensaje:", result.messageId);
    } catch (error) {
        console.error("❌ Error al enviar el correo:");
        console.error(error.message);
        process.exitCode = 1;
    }
}

testEmail();
