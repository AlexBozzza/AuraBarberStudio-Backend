const express = require("express");
const router = express.Router();

const ServiceController = require("../controllers/serviceController");


// ✅ GET /services
// Obtener todos los servicios
router.get(
  "/",
  ServiceController.getServices
);


// ✅ GET /services/active
// Obtener solamente los servicios activos
// IMPORTANTE: debe ir antes de /:id
router.get(
  "/active",
  ServiceController.getActiveServices
);


// ✅ GET /services/:id
// Obtener un servicio específico
router.get(
  "/:id",
  ServiceController.getServiceById
);


// ✅ POST /services
// Crear un nuevo servicio
router.post(
  "/",
  ServiceController.createService
);


// ✅ PUT /services/:id
// Actualizar un servicio
router.put(
  "/:id",
  ServiceController.updateService
);


// ✅ PATCH /services/:id/deactivate
// Desactivar un servicio
router.patch(
  "/:id/deactivate",
  ServiceController.deactivateService
);


// ✅ PATCH /services/:id/activate
// Reactivar un servicio
router.patch(
  "/:id/activate",
  ServiceController.activateService
);


// ✅ DELETE /services/:id
// Eliminar un servicio definitivamente
router.delete(
  "/:id",
  ServiceController.deleteService
);


module.exports = router;