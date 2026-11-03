
require("dotenv").config();

const { pool } = require("./config/database");
const Appointment = require("./models/Appointment");

function getCostaRicaDateTime(date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Costa_Rica",
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

async function testReminderQuery() {
    try {
        const now = Date.now();

        const from = getCostaRicaDateTime(
            new Date(now + 115 * 60 * 1000)
        );

        const to = getCostaRicaDateTime(
            new Date(now + 121 * 60 * 1000)
        );

        console.log("Intervalo consultado (Costa Rica):");
        console.log("Desde:", from);
        console.log("Hasta:", to);

        const appointments =
            await Appointment.findAppointmentsForReminders(from, to);

        console.log(
            `\nCitas candidatas encontradas: ${appointments.length}`
        );

        for (const appointment of appointments) {
            console.log({
                id: appointment.id,
                fecha: appointment.appointment_date,
                hora: appointment.start_time,
                estado: appointment.status,
                correoDisponible: Boolean(appointment.customer_email),
                recordatorioEnviado: false
            });
        }

        console.log("\nPrueba finalizada. No se enviaron correos.");
    } catch (error) {
        console.error("Error al consultar citas:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

testReminderQuery();
