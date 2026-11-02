/**
 * Rutas de Citas
 */

const express = require("express");
const router = express.Router();

const AppointmentController = require("../controllers/appointmentController");

const {
  authenticateToken
} = require("../middleware/auth");


// ==========================================
// OBTENER HORARIOS DISPONIBLES
// ==========================================

router.get(
  "/available-slots",
  AppointmentController.getAvailableSlots
);


// ==========================================
// OBTENER CITAS DEL USUARIO AUTENTICADO
// ==========================================

router.get(
  "/my-appointments",
  authenticateToken,
  AppointmentController.getMyAppointments
);


// ==========================================
// OBTENER TODAS LAS CITAS
// ==========================================

router.get(
  "/",
  AppointmentController.getAppointments
);


// ==========================================
// OBTENER CITAS POR FECHA
// ==========================================

router.get(
  "/date",
  AppointmentController.getAppointmentsByDate
);


// ==========================================
// OBTENER AGENDA DE UN BARBERO
// ==========================================

router.get(
  "/barber",
  AppointmentController.getBarberAppointments
);


// ==========================================
// OBTENER CITA POR ID
// ==========================================

router.get(
  "/:id",
  AppointmentController.getAppointmentById
);


// ==========================================
// CREAR CITA
// Requiere usuario autenticado
// ==========================================

router.post(
  "/",
  authenticateToken,
  AppointmentController.createAppointment
);


// ==========================================
// CAMBIAR ESTADO DE LA CITA
// ==========================================

router.patch(
  "/:id/status",
  AppointmentController.updateStatus
);


// ==========================================
// ELIMINAR CITA
// ==========================================

router.delete(
  "/:id",
  AppointmentController.deleteAppointment
);

// ==========================================
// CANCELAR CITA DEL CLIENTE
// Requiere usuario autenticado
// ==========================================

router.patch(
  "/:id/cancel",
  authenticateToken,
  AppointmentController.cancelMyAppointment
);

// ==========================================
// REAGENDAR CITA DEL CLIENTE
// Requiere usuario autenticado
// ==========================================

router.patch(
  "/:id/reschedule",
  authenticateToken,
  AppointmentController.rescheduleMyAppointment
);

module.exports = router;