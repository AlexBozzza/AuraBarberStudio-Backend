
const express = require("express");
const router = express.Router();

const ServiceController = require("../controllers/serviceController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/auth");

const upload = require("../middleware/upload");
const { sanitizeInput } = require("../middleware/validation");

// Protección para operaciones administrativas
const adminAccess = [
    authenticateToken,
    authorizeRoles(["BARBER"])
];

// GET /services - Obtener todos los servicios (público)
router.get(
    "/",
    ServiceController.getServices
);

// GET /services/active - Obtener servicios activos (público)
router.get(
    "/active",
    ServiceController.getActiveServices
);

// GET /services/:id - Obtener servicio por ID (público)
router.get(
    "/:id",
    ServiceController.getServiceById
);

// POST /services - Crear servicio
router.post(
    "/",
    ...adminAccess,
    upload.single("image"),
    sanitizeInput,
    ServiceController.createService
);

// PUT /services/:id - Actualizar servicio
router.put(
    "/:id",
    ...adminAccess,
    upload.single("image"),
    sanitizeInput,
    ServiceController.updateService
);

// PATCH /services/:id/deactivate
router.patch(
    "/:id/deactivate",
    ...adminAccess,
    ServiceController.deactivateService
);

// PATCH /services/:id/activate
router.patch(
    "/:id/activate",
    ...adminAccess,
    ServiceController.activateService
);

// DELETE /services/:id
router.delete(
    "/:id",
    ...adminAccess,
    ServiceController.deleteService
);

module.exports = router;
