
require("dotenv").config();

const { verifyEmailConnection } = require("./services/emailService");

verifyEmailConnection()
    .then(() => {
        console.log("✅ Conexión con la API de Brevo correcta");
    })
    .catch((error) => {
        console.error("❌ Error con Brevo:", error.message);
        process.exitCode = 1;
    });
