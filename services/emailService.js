
const API_URL = "https://api.brevo.com/v3";

function getApiKey() {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        throw new Error("Falta la variable BREVO_API_KEY");
    }

    return apiKey;
}

async function sendEmail({ to, subject, text, html }) {
    if (!to) {
        throw new Error("El destinatario del correo es obligatorio");
    }

    if (!subject || (!text && !html)) {
        throw new Error("Faltan el asunto o el contenido del correo");
    }

    const body = {
        sender: {
            name: process.env.BREVO_SENDER_NAME || "AuraBarberStudio",
            email: process.env.BREVO_SENDER_EMAIL
        },
        to: [{ email: to }],
        subject
    };

    if (html) {
        body.htmlContent = html;
    } else {
        body.textContent = text;
    }

    const response = await fetch(`${API_URL}/smtp/email`, {
        method: "POST",
        headers: {
            "accept": "application/json",
            "api-key": getApiKey(),
            "content-type": "application/json"
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
    });

    const responseText = await response.text();

    if (!response.ok) {
        throw new Error(
            `Brevo API (${response.status}): ${responseText}`
        );
    }

    let result = {};

    if (responseText) {
        try {
            result = JSON.parse(responseText);
        } catch {
            result = { response: responseText };
        }
    }

    console.log("Correo aceptado por Brevo:", result.messageId || "OK");

    return result;
}

async function verifyEmailConnection() {
    const response = await fetch(`${API_URL}/account`, {
        headers: {
            "accept": "application/json",
            "api-key": getApiKey()
        },
        signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Brevo API (${response.status}): ${errorText}`
        );
    }

    return true;
}

module.exports = {
    sendEmail,
    verifyEmailConnection
};
