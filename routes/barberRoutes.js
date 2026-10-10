const express = require("express");
const router = express.Router();

const BarberController = require("../controllers/barberController");

// ✅ Obtener todos los barberos
router.get(
  "/",
  BarberController.getBarbers
);

// ✅ Obtener solo los barberos disponibles
// IMPORTANTE: debe ir antes de "/:id"
router.get(
  "/available",
  BarberController.getAvailableBarbers
);

// ✅ Obtener barbero por ID
router.get(
  "/:id",
  BarberController.getBarberById
);

// ✅ Crear barbero
router.post(
  "/",
  BarberController.createBarber
);

// ✅ Actualizar barbero
router.put(
  "/:id",
  BarberController.updateBarber
);

// ✅ Desactivar barbero
router.patch(
  "/:id/deactivate",
  BarberController.deactivateBarber
);

// ✅ Activar barbero
router.patch(
  "/:id/activate",
  BarberController.activateBarber
);

// ✅ Eliminar barbero definitivamente
router.delete(
  "/:id",
  BarberController.deleteBarber
);

module.exports = router;