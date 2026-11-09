/**
 * Controlador de Citas
 */

const Appointment = require("../models/Appointment");

const {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require("../services/googleCalendarService");


class AppointmentController {


  // ==========================================
  // CREAR CITA
  // ==========================================

  static async createAppointment(req, res) {

    try {

      const {
        barber_id,
        service_id,
        appointment_date,
        start_time,
        end_time,
        notes
      } = req.body;


      // ==========================================
      // OBTENER USUARIO DESDE EL TOKEN JWT
      // ==========================================

      const user_id = req.user.userId;


      // ==========================================
      // VALIDACIONES BÁSICAS
      // ==========================================

      if (
        !user_id ||
        !barber_id ||
        !service_id ||
        !appointment_date ||
        !start_time ||
        !end_time
      ) {

        return res.status(400).json({

          success: false,

          message: "Datos incompletos"

        });

      }


      // ==========================================
      // VERIFICAR DISPONIBILIDAD
      // ==========================================

      const available =
        await Appointment.isTimeAvailable(
          barber_id,
          appointment_date,
          start_time,
          end_time
        );


      if (!available) {

        return res.status(409).json({

          success: false,

          message:
            "El horario seleccionado ya está ocupado"

        });

      }


      // ==========================================
      // CREAR CITA
      // ==========================================

      const appointment =
        await Appointment.create({

          user_id,

          barber_id,

          service_id,

          appointment_date,

          start_time,

          end_time,

          notes

        });

        // ==========================================
// SINCRONIZAR CON GOOGLE CALENDAR
// ==========================================

try {
  const eventId = await createCalendarEvent(appointment);

const updatedAppointment =
  await Appointment.updateGoogleCalendarEventId(
    appointment.id,
    eventId
  );

if (updatedAppointment) {
  Object.assign(appointment, updatedAppointment);
}

} catch (calendarError) {
  console.error(
    "La cita se creó, pero no se pudo sincronizar con Google Calendar:",
    calendarError
  );
}


      // ==========================================
      // RESPUESTA
      // ==========================================

      res.status(201).json({

        success: true,

        message: "Cita creada correctamente",

        data: appointment

      });


    } catch (error) {

      console.error(
        "Error creando cita:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Error interno del servidor"

      });

    }

  }


  // ==========================================
  // OBTENER TODAS
  // ==========================================

  static async getAppointments(req, res) {

    try {

      const appointments =
        await Appointment.findAll();


      res.json({

        success: true,

        data: appointments

      });


    } catch (error) {

      console.error(error);


      res.status(500).json({

        success: false,

        message:
          "Error obteniendo citas"

      });

    }

  }


  // ==========================================
  // OBTENER CITAS DEL USUARIO AUTENTICADO
  // ==========================================

  static async getMyAppointments(req, res) {

    try {

      // ==========================================
      // OBTENER USUARIO DESDE EL TOKEN JWT
      // ==========================================

      const user_id = req.user.userId;


      // ==========================================
      // VALIDAR USUARIO
      // ==========================================

      if (!user_id) {

        return res.status(401).json({

          success: false,

          message:
            "Usuario no autenticado"

        });

      }


      // ==========================================
      // OBTENER SUS CITAS
      // ==========================================

      const appointments =
        await Appointment.findByUser(
          user_id
        );


      // ==========================================
      // RESPUESTA
      // ==========================================

      res.status(200).json({

        success: true,

        data: appointments

      });


    } catch (error) {

      console.error(
        "Error obteniendo citas del usuario:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Error obteniendo tus citas"

      });

    }

  }


  // ==========================================
  // OBTENER POR ID
  // ==========================================

  static async getAppointmentById(req, res) {

    try {

      const appointment =
        await Appointment.findById(
          req.params.id
        );


      if (!appointment) {

        return res.status(404).json({

          success: false,

          message:
            "Cita no encontrada"

        });

      }


      res.json({

        success: true,

        data: appointment

      });


    } catch (error) {

      console.error(error);


      res.status(500).json({

        success: false,

        message:
          "Error obteniendo cita"

      });

    }

  }


  // ==========================================
  // OBTENER POR FECHA
  // ==========================================

  static async getAppointmentsByDate(req, res) {

    try {

      const {
        appointment_date
      } = req.query;


      const appointments =
        await Appointment.findByDate(
          appointment_date
        );


      res.json({

        success: true,

        data: appointments

      });


    } catch (error) {

      console.error(error);


      res.status(500).json({

        success: false,

        message:
          "Error obteniendo citas"

      });

    }

  }


  // ==========================================
  // OBTENER AGENDA DE UN BARBERO
  // ==========================================

  static async getBarberAppointments(req, res) {

    try {

      const {
        barber_id,
        appointment_date
      } = req.query;


      const appointments =
        await Appointment.findByBarberAndDate(
          barber_id,
          appointment_date
        );


      res.json({

        success: true,

        data: appointments

      });


    } catch (error) {

      console.error(error);


      res.status(500).json({

        success: false,

        message:
          "Error obteniendo agenda"

      });

    }

  }


  // ==========================================
  // OBTENER HORARIOS DISPONIBLES
  // ==========================================

  static async getAvailableSlots(req, res) {

    try {

      console.log(
        "🔥 ENTRÓ A GET AVAILABLE SLOTS"
      );


      const {
        barber_id,
        service_id,
        appointment_date
      } = req.query;


      // ==========================================
      // VALIDAR PARÁMETROS
      // ==========================================

      if (
        !barber_id ||
        !service_id ||
        !appointment_date
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Faltan parámetros"

        });

      }


      // ==========================================
      // OBTENER DURACIÓN DEL SERVICIO
      // ==========================================

      const service =
        await Appointment.getServiceDuration(
          service_id
        );


      if (!service) {

        return res.status(404).json({

          success: false,

          message:
            "Servicio no encontrado"

        });

      }


      const duration =
        Number(service.duration);


      console.log(
        "Servicio:",
        service
      );


      console.log(
        "Duración:",
        duration
      );


      console.log(
        "Fecha recibida:",
        appointment_date
      );


      // ==========================================
      // OBTENER CITAS DEL BARBERO
      // ==========================================

      const appointments =
        await Appointment.findByBarberAndDate(
          barber_id,
          appointment_date
        );


      const availableSlots = [];


      // ==========================================
      // HORARIO DE TRABAJO
      // ==========================================

      const openingMinutes =
        10 * 60; // 10:00

      const lunchStart =
        13 * 60; // 13:00

      const lunchEnd =
        14 * 60; // 14:00

      const closingMinutes =
        19 * 60; // 19:00


      // ==========================================
// FECHA Y HORA ACTUAL DE COSTA RICA
// ==========================================

const timeZone = "America/Costa_Rica";

const costaRicaParts = new Intl.DateTimeFormat("en-CA", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
}).formatToParts(new Date());

      const getPart = (type) =>
       costaRicaParts.find((part) => part.type === type).value;

      const today =
      `${getPart("year")}-${getPart("month")}-${getPart("day")}`;

      const currentMinutes =
      Number(getPart("hour")) * 60 +
      Number(getPart("minute"));

      console.log("Fecha de Costa Rica:", today);
      console.log("Hora de Costa Rica:", getPart("hour") + ":" + getPart("minute"));


      // ==========================================
      // GENERAR HORARIOS
      // ==========================================

      for (
        let minutes = openingMinutes;

        minutes <= closingMinutes - duration;

        minutes += 15
      ) {


        const endMinutes =
          minutes + duration;


        // ==========================================
        // NO CRUZAR ALMUERZO
        // ==========================================

        if (
          minutes < lunchEnd &&
          endMinutes > lunchStart
        ) {

          continue;

        }


        // ==========================================
        // NO PASAR DEL CIERRE
        // ==========================================

        if (
          endMinutes > closingMinutes
        ) {

          continue;

        }


       // ==========================================
// SI ES HOY
// OCULTAR HORARIOS PASADOS
// Y DEJAR 30 MINUTOS DE MARGEN
// ==========================================

if (appointment_date === today) {

  if (minutes <= currentMinutes + 30) {
    continue;
  }

}


        // ==========================================
        // CONSTRUIR HORA INICIO
        // ==========================================

        const startHour =
          String(
            Math.floor(minutes / 60)
          ).padStart(2, "0");


        const startMinute =
          String(
            minutes % 60
          ).padStart(2, "0");


        // ==========================================
        // CONSTRUIR HORA FINAL
        // ==========================================

        const endHour =
          String(
            Math.floor(endMinutes / 60)
          ).padStart(2, "0");


        const endMinute =
          String(
            endMinutes % 60
          ).padStart(2, "0");


        const startTime =
          `${startHour}:${startMinute}:00`;


        const endTime =
          `${endHour}:${endMinute}:00`;


        // ==========================================
// COMPROBAR SI ESTÁ OCUPADO
// IGNORAR CITAS CANCELADAS
// ==========================================

let occupied = false;

for (const appointment of appointments) {

  const status = String(appointment.status || "").toUpperCase();

  if (!["PENDING", "CONFIRMED"].includes(status)) {
    continue;
  }

  if (
    startTime < appointment.end_time &&
    endTime > appointment.start_time
  ) {
    occupied = true;
    break;
  }

}


        // ==========================================
        // AGREGAR SI ESTÁ DISPONIBLE
        // ==========================================

        if (!occupied) {

          availableSlots.push({

            start_time:
              startTime,

            end_time:
              endTime

          });

        }

      }


      console.log(
        "Horarios disponibles:",
        availableSlots
      );


      res.json({

        success: true,

        data: availableSlots

      });


    } catch (error) {

      console.error(error);


      res.status(500).json({

        success: false,

        message:
          "Error obteniendo horarios disponibles"

      });

    }

  }

  

// ==========================================
// CANCELAR CITA DEL CLIENTE AUTENTICADO
// ==========================================

static async cancelMyAppointment(req, res) {

  try {

    const appointmentId = req.params.id;
    const user_id = req.user.userId;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
    }

    if (!/^\d+$/.test(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Identificador de cita inválido"
      });
    }

    // Obtener fecha y hora actuales de Costa Rica
    const timeZone = "America/Costa_Rica";

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());

    const getPart = (type) =>
      parts.find((part) => part.type === type).value;

    const currentDate =
      `${getPart("year")}-${getPart("month")}-${getPart("day")}`;

    const currentTime =
      `${getPart("hour")}:${getPart("minute")}:00`;

    const result = await Appointment.cancelByUser(
      appointmentId,
      user_id,
      currentDate,
      currentTime
    );

    if (!result.success) {

      if (!result.appointment ||
          String(result.appointment.user_id) !== String(user_id)) {
        return res.status(404).json({
          success: false,
          message: "Cita no encontrada"
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "Esta cita ya no se puede cancelar. Puede haber comenzado, estar completada o ya estar cancelada."
      });
    }

    // ==========================================
    // ELIMINAR EVENTO DE GOOGLE CALENDAR
    // ==========================================

    try {
      await deleteCalendarEvent(
        result.appointment.google_calendar_event_id
      );

      // Limpiar ID del evento en MySQL
      await Appointment.updateGoogleCalendarEventId(
        appointmentId,
        null
      );

    } catch (calendarError) {
      console.error(
        "La cita se canceló, pero no se pudo eliminar de Google Calendar:",
        calendarError
      );
    }

    return res.status(200).json({
      success: true,
      message: "Tu cita ha sido cancelada correctamente",
      data: result.appointment
    });

  } catch (error) {

    console.error("Error cancelando cita:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno al cancelar la cita"
    });

  }

}



// ==========================================
// REAGENDAR CITA DEL CLIENTE AUTENTICADO
// ==========================================

static async rescheduleMyAppointment(req, res) {

  try {

    const appointmentId = req.params.id;
    const user_id = req.user.userId;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
    }

    if (!/^\d+$/.test(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Identificador de cita inválido"
      });
    }

    // Obtener fecha y hora actuales de Costa Rica
    const timeZone = "America/Costa_Rica";

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());

    const getPart = (type) =>
      parts.find((part) => part.type === type).value;

    const currentDate =
      `${getPart("year")}-${getPart("month")}-${getPart("day")}`;

    const currentTime =
      `${getPart("hour")}:${getPart("minute")}:00`;

    const result = await Appointment.rescheduleByUser(
      appointmentId,
      user_id,
      currentDate,
      currentTime
    );

    if (!result.success) {

      if (
        !result.appointment ||
        String(result.appointment.user_id) !== String(user_id)
      ) {
        return res.status(404).json({
          success: false,
          message: "Cita no encontrada"
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "Esta cita ya no se puede reagendar. Puede haber comenzado, estar completada, cancelada o ya haber sido reagendada."
      });
    }

    // ==========================================
    // ELIMINAR EVENTO ANTERIOR DE GOOGLE CALENDAR
    // ==========================================

    try {
      await deleteCalendarEvent(
        result.appointment.google_calendar_event_id
      );

      // Limpiar ID del evento en MySQL
      await Appointment.updateGoogleCalendarEventId(
        appointmentId,
        null
      );

    } catch (calendarError) {
      console.error(
        "La cita se reagendó, pero no se pudo eliminar el evento anterior de Google Calendar:",
        calendarError
      );
    }

    return res.status(200).json({
      success: true,
      message: "Tu cita está lista para reagendar. Selecciona una nueva fecha y horario.",
      data: result.appointment
    });

  } catch (error) {

    console.error("Error reagendando cita:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno al reagendar la cita"
    });

  }

}



  // ==========================================
  // CAMBIAR ESTADO
  // ==========================================

  static async updateStatus(req, res) {

    try {

      const {
        id
      } = req.params;


      const {
        status
      } = req.body;


      const appointment =
        await Appointment.updateStatus(
          id,
          status
        );

// ==========================================
// SINCRONIZAR ESTADO CON GOOGLE CALENDAR
// ==========================================

try {
  const eventId = appointment?.google_calendar_event_id;

  if (eventId) {
    if (["CANCELLED", "RESCHEDULED"].includes(
      String(status).toUpperCase()
    )) {
      await deleteCalendarEvent(eventId);

      await Appointment.updateGoogleCalendarEventId(
        id,
        null
      );

    } else {
      await updateCalendarEvent(eventId, appointment);
    }
  }
} catch (calendarError) {
  console.error(
    "El estado se actualizó, pero falló la sincronización con Google Calendar:",
    calendarError
  );
}


      res.json({

        success: true,

        message:
          "Estado actualizado correctamente",

        data: appointment

      });


    } catch (error) {

      console.error(error);


      res.status(500).json({

        success: false,

        message:
          "Error actualizando cita"

      });

    }

  }


  // ==========================================
  // ELIMINAR CITA
  // ==========================================

  static async deleteAppointment(req, res) {

    try {

  // ==========================================
// OBTENER CITA ANTES DE ELIMINARLA
// ==========================================

const appointment = await Appointment.findById(
  req.params.id
);

// ==========================================
// ELIMINAR EVENTO DE GOOGLE CALENDAR
// ==========================================

if (appointment?.google_calendar_event_id) {
  try {
    await deleteCalendarEvent(
      appointment.google_calendar_event_id
    );
  } catch (calendarError) {
    console.error(
      "No se pudo eliminar el evento de Google Calendar:",
      calendarError
    );
  }
}

// ==========================================
// ELIMINAR CITA DE MYSQL
// ==========================================

await Appointment.delete(req.params.id);


      res.json({

        success: true,

        message:
          "Cita eliminada correctamente"

      });


    } catch (error) {

      console.error(error);


      res.status(500).json({

        success: false,

        message:
          "Error eliminando cita"

      });

    }

  }

}


module.exports =
  AppointmentController;