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


module.exports = router;