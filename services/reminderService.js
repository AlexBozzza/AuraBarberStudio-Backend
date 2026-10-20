
const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const { sendEmail } = require("./emailService");
const { pool } = require("../config/database");

const TIME_ZONE = "America/Costa_Rica";
const REMINDER_HOURS = 2;

// Formatea una fecha/hora como fecha local de Costa Rica.
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

// Formatea la fecha de una cita sin cambiar el día por la zona horaria.
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
    // La ventana permite tolerar la frecuencia de ejecución del cron.
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

            const subject =
                "Recordatorio de tu cita - Aura Barber Studio";

            const text = [
                `Hola ${customerName},`,
                "",
                "Te recordamos que tu cita en Aura Barber Studio",
                "está programada para dentro de aproximadamente dos horas.",
                "",
                `Fecha: ${formattedDate}`,
                `Hora: ${formattedTime}`,
                `Servicio: ${appointment.service_name || ""}`,
                `Barbero: ${barberName || "Por confirmar"}`,
                "",
                "¡Te esperamos!",
                "Aura Barber Studio"
            ].join("\n");

            const html = `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222;line-height:1.6">
                    <h2>Aura Barber Studio</h2>
                    <p>Hola ${escapeHtml(customerName)},</p>
                    <p>Te recordamos que tu cita está programada
                    para dentro de aproximadamente dos horas.</p>
                    <p>
                        <strong>Fecha:</strong> ${escapeHtml(formattedDate)}<br>
                        <strong>Hora:</strong> ${escapeHtml(formattedTime)}<br>
                        <strong>Servicio:</strong> ${escapeHtml(appointment.service_name || "")}<br>
                        <strong>Barbero:</strong> ${escapeHtml(barberName || "Por confirmar")}
                    </p>
                    <p>¡Te esperamos!</p>
                    <p><strong>Aura Barber Studio</strong></p>
                </div>
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
