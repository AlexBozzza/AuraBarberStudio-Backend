
const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const { sendEmail } = require("./emailService");
const { pool } = require("../config/database");

const TIME_ZONE = "America/Costa_Rica";
const REMINDER_HOURS = 2;

const GOOGLE_MAPS_URL =
    "https://www.google.com/maps?ll=10.015075,-84.207797&z=15&t=m&hl=es-AR&gl=US&mapclient=embed&cid=14195062347311821857";

const COLORS = {
    black: "#171717",
    dark: "#222222",
    gold: "#D4B06A",
    lightGold: "#E8D5AD",
    background: "#F7F5F0",
    white: "#FFFFFF",
    muted: "#6B6B6B",
    border: "#E8E1D5"
};

// Formatea fecha y hora según la zona horaria de Costa Rica.
function getCostaRicaDateTime(date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    }).formatToParts(date);

    const values = Object.fromEntries(
        parts.map(({ type, value }) => [type, value])
    );

    return `${values.year}-${values.month}-${values.day} ` +
        `${values.hour}:${values.minute}:${values.second}`;
}

// Formatea la fecha de la cita sin cambiar el día por la zona horaria.
function formatAppointmentDate(rawDate) {
    let dateString;

    if (rawDate instanceof Date) {
        dateString = [
            rawDate.getUTCFullYear(),
            String(rawDate.getUTCMonth() + 1).padStart(2, "0"),
            String(rawDate.getUTCDate()).padStart(2, "0")
        ].join("-");
    } else {
        dateString = String(rawDate).slice(0, 10);
    }

    const [year, month, day] = dateString.split("-").map(Number);

    if (
        !year ||
        !month ||
        !day ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        throw new Error(`Fecha de cita no válida: ${dateString}`);
    }

    return new Intl.DateTimeFormat("es-CR", {
        timeZone: "UTC",
        dateStyle: "long"
    }).format(new Date(Date.UTC(year, month - 1, day)));
}

async function processReminders() {
    const now = Date.now();

    // Busca citas entre 1 h 55 min y 2 h 1 min desde ahora.
    const from = getCostaRicaDateTime(
        new Date(now + (REMINDER_HOURS * 60 - 5) * 60 * 1000)
    );

    const to = getCostaRicaDateTime(
        new Date(now + (REMINDER_HOURS * 60 + 1) * 60 * 1000)
    );

    const appointments =
        await Appointment.findAppointmentsForReminders(from, to);

    for (const appointment of appointments) {
        try {
            if (!appointment.customer_email) {
                console.warn(
                    `Cita ${appointment.id}: cliente sin correo.`
                );
                continue;
            }

            const formattedDate = formatAppointmentDate(
                appointment.appointment_date
            );

            const formattedTime = String(appointment.start_time)
                .slice(0, 5);

            const customerName =
                appointment.customer_first_name || "cliente";

            const barberName = [
                appointment.barber_first_name,
                appointment.barber_last_name
            ].filter(Boolean).join(" ");

            const serviceName = appointment.service_name || "Servicio reservado";
            const safeName = escapeHtml(customerName);
            const safeDate = escapeHtml(formattedDate);
            const safeTime = escapeHtml(formattedTime);
            const safeService = escapeHtml(serviceName);
            const safeBarber = escapeHtml(barberName || "Por confirmar");

            const subject =
                "Recordatorio de tu cita - Aura Barber Studio";

            const text = [
                `Hola ${customerName},`,
                "",
                "Tu estilo te espera en Aura Barber Studio.",
                "Te recordamos que tu cita está programada para dentro de aproximadamente dos horas.",
                "",
                `Fecha: ${formattedDate}`,
                `Hora: ${formattedTime}`,
                `Servicio: ${serviceName}`,
                `Barbero: ${barberName || "Por confirmar"}`,
                "",
                `Ubicación y cómo llegar: ${GOOGLE_MAPS_URL}`,
                "",
                "¡Te esperamos!",
                "Aura Barber Studio",
                "Estilo · Precisión · Experiencia"
            ].join("\n");

            const html = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Recordatorio de tu cita - Aura Barber Studio</title>
                </head>
                <body style="
                    margin:0;
                    padding:0;
                    background-color:${COLORS.background};
                    font-family:Arial,Helvetica,sans-serif;
                    color:${COLORS.dark};
                    line-height:1.6;
                ">
                    <div style="
                        display:none;
                        max-height:0;
                        overflow:hidden;
                        opacity:0;
                    ">
                        Tu cita en Aura Barber Studio está cerca. Consulta los detalles y cómo llegar.
                    </div>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                        style="background-color:${COLORS.background};padding:28px 12px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                                    style="
                                        max-width:600px;
                                        background-color:${COLORS.white};
                                        border-radius:12px;
                                        overflow:hidden;
                                        border:1px solid ${COLORS.border};
                                    ">

                                    <!-- Encabezado -->
                                    <tr>
                                        <td align="center" style="
                                            background-color:${COLORS.black};
                                            padding:32px 24px;
                                            border-bottom:4px solid ${COLORS.gold};
                                        ">
                                            <div style="
                                                font-size:27px;
                                                font-weight:bold;
                                                letter-spacing:5px;
                                                color:${COLORS.white};
                                            ">
                                                AURA
                                            </div>
                                            <div style="
                                                margin-top:4px;
                                                font-size:11px;
                                                letter-spacing:4px;
                                                color:${COLORS.gold};
                                            ">
                                                BARBER STUDIO
                                            </div>
                                            <div style="
                                                margin-top:22px;
                                                font-size:23px;
                                                font-weight:bold;
                                                color:${COLORS.white};
                                            ">
                                                Tu estilo te espera.
                                            </div>
                                            <div style="
                                                margin-top:8px;
                                                font-size:14px;
                                                color:#E5E5E5;
                                            ">
                                                Un recordatorio especial para tu próxima visita.
                                            </div>
                                        </td>
                                    </tr>

                                    <!-- Mensaje -->
                                    <tr>
                                        <td style="padding:28px 26px 12px;">
                                            <p style="margin:0 0 12px;font-size:16px;">
                                                Hola <strong>${safeName}</strong>,
                                            </p>
                                            <p style="margin:0;color:${COLORS.muted};font-size:14px;">
                                                Te recordamos que tu cita está programada
                                                para dentro de aproximadamente dos horas.
                                                ¡Nos alegra recibirte pronto!
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Detalles de la cita -->
                                    <tr>
                                        <td style="padding:16px 26px 24px;">
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                                                style="
                                                    border:1px solid ${COLORS.border};
                                                    border-radius:9px;
                                                    overflow:hidden;
                                                ">
                                                <tr>
                                                    <td colspan="2" style="
                                                        padding:15px 18px;
                                                        background-color:#F7F3EA;
                                                        border-bottom:1px solid ${COLORS.border};
                                                        font-size:11px;
                                                        font-weight:bold;
                                                        letter-spacing:2px;
                                                        color:#806334;
                                                    ">
                                                        DETALLES DE TU CITA
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="
                                                        padding:13px 18px 5px;
                                                        color:${COLORS.muted};
                                                        font-size:13px;
                                                        width:105px;
                                                    ">Fecha</td>
                                                    <td style="
                                                        padding:13px 18px 5px;
                                                        font-size:14px;
                                                        font-weight:bold;
                                                    ">${safeDate}</td>
                                                </tr>
                                                <tr>
                                                    <td style="
                                                        padding:7px 18px;
                                                        color:${COLORS.muted};
                                                        font-size:13px;
                                                    ">Hora</td>
                                                    <td style="
                                                        padding:7px 18px;
                                                        font-size:14px;
                                                        font-weight:bold;
                                                    ">${safeTime}</td>
                                                </tr>
                                                <tr>
                                                    <td style="
                                                        padding:7px 18px;
                                                        color:${COLORS.muted};
                                                        font-size:13px;
                                                        vertical-align:top;
                                                    ">Servicio</td>
                                                    <td style="
                                                        padding:7px 18px;
                                                        font-size:14px;
                                                        font-weight:bold;
                                                    ">${safeService}</td>
                                                </tr>
                                                <tr>
                                                    <td style="
                                                        padding:7px 18px 16px;
                                                        color:${COLORS.muted};
                                                        font-size:13px;
                                                        vertical-align:top;
                                                    ">Barbero</td>
                                                    <td style="
                                                        padding:7px 18px 16px;
                                                        font-size:14px;
                                                    ">${safeBarber}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Ubicación -->
                                    <tr>
                                        <td style="padding:0 26px 28px;">
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                                                style="
                                                    background-color:${COLORS.black};
                                                    border-radius:9px;
                                                ">
                                                <tr>
                                                    <td align="center" style="padding:23px 18px;">
                                                        <div style="
                                                            font-size:12px;
                                                            font-weight:bold;
                                                            letter-spacing:2px;
                                                            color:${COLORS.gold};
                                                        ">
                                                            VISÍTANOS
                                                        </div>
                                                        <div style="
                                                            margin-top:8px;
                                                            font-size:19px;
                                                            font-weight:bold;
                                                            color:${COLORS.white};
                                                        ">
                                                            ¿Cómo llegar?
                                                        </div>
                                                        <div style="
                                                            margin-top:7px;
                                                            margin-bottom:19px;
                                                            font-size:13px;
                                                            color:#E5E5E5;
                                                        ">
                                                            Abre nuestra ubicación y prepara tu ruta.
                                                        </div>
                                                        <a href="${GOOGLE_MAPS_URL}"
                                                            target="_blank"
                                                            style="
                                                                display:inline-block;
                                                                padding:13px 22px;
                                                                background-color:${COLORS.gold};
                                                                color:${COLORS.black};
                                                                text-decoration:none;
                                                                font-size:13px;
                                                                font-weight:bold;
                                                                border-radius:5px;
                                                            ">
                                                            &#128205; CÓMO LLEGAR A AURA
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Pie -->
                                    <tr>
                                        <td align="center" style="
                                            padding:20px 24px 24px;
                                            border-top:1px solid ${COLORS.border};
                                        ">
                                            <div style="
                                                font-size:14px;
                                                font-weight:bold;
                                                letter-spacing:2px;
                                                color:${COLORS.black};
                                            ">
                                                AURA BARBER STUDIO
                                            </div>
                                            <div style="
                                                margin-top:6px;
                                                font-size:11px;
                                                letter-spacing:1px;
                                                color:${COLORS.muted};
                                            ">
                                                ESTILO · PRECISIÓN · EXPERIENCIA
                                            </div>
                                            <p style="
                                                margin:14px 0 0;
                                                font-size:11px;
                                                color:#888888;
                                            ">
                                                Este mensaje es un recordatorio automático de tu cita.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `;

            // Enviar primero el correo.
            await sendEmail({
                to: appointment.customer_email,
                subject,
                text,
                html
            });

            // Registrar el envío solo después de que Brevo lo acepte.
            const [result] = await pool.execute(
                `UPDATE appointments
                 SET reminder_sent_at = UTC_TIMESTAMP()
                 WHERE id = ?
                   AND reminder_sent_at IS NULL
                   AND status IN ('PENDING', 'CONFIRMED')`,
                [appointment.id]
            );

            if (result.affectedRows === 1) {
                console.log(
                    `✅ Recordatorio enviado para la cita ${appointment.id}`
                );
            } else {
                console.warn(
                    `El correo de la cita ${appointment.id} fue aceptado, ` +
                    "pero no se actualizó reminder_sent_at. " +
                    "Revisa la cita en la base de datos."
                );
            }
        } catch (error) {
            console.error(
                `Error con el recordatorio de la cita ${appointment.id}:`,
                error.message
            );
        }
    }
}

function startReminderService() {
    cron.schedule(
        "* * * * *",
        () => {
            processReminders().catch((error) => {
                console.error(
                    "Error al procesar recordatorios:",
                    error.message
                );
            });
        },
        {
            timezone: TIME_ZONE
        }
    );

    console.log(
        "⏰ Recordatorios automáticos activados (zona horaria de Costa Rica)."
    );
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

module.exports = {
    startReminderService,
    processReminders
};
