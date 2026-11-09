
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

let calendarClient = null;

// ==========================================
// CONEXIÓN CON GOOGLE CALENDAR
// ==========================================

const getCalendarClient = () => {
  if (calendarClient) return calendarClient;

  const {
    GOOGLE_CALENDAR_CLIENT_EMAIL,
    GOOGLE_CALENDAR_PRIVATE_KEY,
  } = process.env;

  if (!GOOGLE_CALENDAR_CLIENT_EMAIL || !GOOGLE_CALENDAR_PRIVATE_KEY) {
    throw new Error("Faltan las variables de entorno de Google Calendar.");
  }

  const auth = new google.auth.JWT({
    email: GOOGLE_CALENDAR_CLIENT_EMAIL,
    key: GOOGLE_CALENDAR_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });

  calendarClient = google.calendar({
    version: "v3",
    auth,
  });

  return calendarClient;
};

// ==========================================
// OBTENER ID DEL CALENDARIO
// ==========================================

const getCalendarId = () => {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    throw new Error("Falta configurar GOOGLE_CALENDAR_ID.");
  }

  return calendarId;
};

// ==========================================
// FORMATEAR FECHA Y HORA DE MYSQL
// ==========================================

const formatDate = (date) => {
  if (!date) {
    throw new Error("La cita no contiene una fecha válida.");
  }

  if (date instanceof Date) {
    return date.toISOString().slice(0, 10);
  }

  return String(date).slice(0, 10);
};

const formatTime = (time) => {
  if (!time) {
    throw new Error("La cita no contiene una hora válida.");
  }

  return String(time).slice(0, 8);
};

// ==========================================
// CONSTRUIR INFORMACIÓN DEL EVENTO
// ==========================================

const buildEventData = (appointment) => {
  const customerName = `${appointment.first_name || ""} ${
    appointment.last_name || ""
  }`.trim();

  const serviceName = appointment.service_name || "Servicio";
  const status = appointment.status || "PENDING";

  // ==========================================
  // COMPROBAR FORMATO DE FECHA DE MYSQL
  // ==========================================

  console.log(
    "Fecha recibida desde MySQL:",
    appointment.appointment_date
  );

  console.log(
    "Tipo de fecha:",
    typeof appointment.appointment_date
  );

  console.log(
    "¿Es objeto Date?:",
    appointment.appointment_date instanceof Date
  );

  // ==========================================
  // FORMATEAR FECHA Y HORA
  // ==========================================

  const date = formatDate(appointment.appointment_date);
  const startTime = formatTime(appointment.start_time);
  const endTime = formatTime(appointment.end_time);

  return {
    summary: `Cita - ${customerName}`,
    description: [
      `Cliente: ${customerName}`,
      `Servicio: ${serviceName}`,
      `Estado: ${status}`,
    ].join("\n"),
    start: {
      dateTime: `${date}T${startTime}-06:00`,
      timeZone: "America/Costa_Rica",
    },
    end: {
      dateTime: `${date}T${endTime}-06:00`,
      timeZone: "America/Costa_Rica",
    },
  };
};

// ==========================================
// CREAR EVENTO
// ==========================================

const createCalendarEvent = async (appointment) => {
  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const event = buildEventData(appointment);

    const response = await calendar.events.insert({
      calendarId,
      resource: event,
    });

    return response.data.id;
  } catch (error) {
    console.error(
      "Error creando evento en Google Calendar:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// ==========================================
// ACTUALIZAR EVENTO
// ==========================================

const updateCalendarEvent = async (eventId, appointment) => {
  try {
    if (!eventId) return;

    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const event = buildEventData(appointment);

    await calendar.events.patch({
      calendarId,
      eventId,
      resource: event,
    });
  } catch (error) {
    console.error(
      "Error actualizando evento en Google Calendar:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// ==========================================
// ELIMINAR EVENTO
// ==========================================

const deleteCalendarEvent = async (eventId) => {
  try {
    if (!eventId) return;

    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    await calendar.events.delete({
      calendarId,
      eventId,
    });
  } catch (error) {
    const statusCode = error.code || error.response?.status;

    if (statusCode === 404 || statusCode === 410) {
      return;
    }

    console.error(
      "Error eliminando evento en Google Calendar:",
      error.response?.data || error.message
    );

    throw error;
  }
};

module.exports = {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};
