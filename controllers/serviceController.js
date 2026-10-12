
const Service = require("../models/Service");

// ==========================================
// LISTAR TODOS LOS SERVICIOS
// ==========================================
exports.getServices = async (req, res) => {
    try {
        const rows = await Service.getAll();

        return res.status(200).json({
            success: true,
            data: rows,
        });
    } catch (err) {
        console.error("Error al obtener servicios:", err);

        return res.status(500).json({
            success: false,
            error: "Error al obtener servicios",
        });
    }
};

// ==========================================
// LISTAR SOLO SERVICIOS ACTIVOS
// ==========================================
exports.getActiveServices = async (req, res) => {
    try {
        const rows = await Service.findAllActive();

        return res.status(200).json({
            success: true,
            data: rows,
        });
    } catch (err) {
        console.error("Error al obtener servicios activos:", err);

        return res.status(500).json({
            success: false,
            error: "Error al obtener servicios activos",
        });
    }
};

// ==========================================
// OBTENER SERVICIO POR ID
// ==========================================
exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                error: "Servicio no encontrado",
            });
        }

        return res.status(200).json({
            success: true,
            data: service,
        });
    } catch (err) {
        console.error("Error al obtener servicio:", err);

        return res.status(500).json({
            success: false,
            error: "Error al obtener servicio",
        });
    }
};

// ==========================================
// CREAR SERVICIO
// ==========================================
exports.createService = async (req, res) => {
    try {
        const {
            name,
            description,
            duration,
            price,
            image,
            barber_ids = [],
        } = req.body;

        if (!name || !duration || price === undefined || price === null) {
            return res.status(400).json({
                success: false,
                error: "El nombre, la duración y el precio son obligatorios",
            });
        }

        if (!Array.isArray(barber_ids)) {
            return res.status(400).json({
                success: false,
                error: "barber_ids debe ser una lista de identificadores",
            });
        }

        const result = await Service.create({
            name,
            description,
            duration: Number(duration),
            price: Number(price),
            image,
            barber_ids,
        });

        return res.status(201).json({
            success: true,
            message: "Servicio creado correctamente",
            data: result,
        });
    } catch (err) {
        console.error("Error creando servicio:", err);

        return res.status(500).json({
            success: false,
            error: "Error creando servicio",
        });
    }
};

// ==========================================
// ACTUALIZAR SERVICIO
// ==========================================
exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                error: "Servicio no encontrado",
            });
        }

        const {
            name,
            description,
            duration,
            price,
            image,
            barber_ids,
        } = req.body;

        if (!name || !duration || price === undefined || price === null) {
            return res.status(400).json({
                success: false,
                error: "El nombre, la duración y el precio son obligatorios",
            });
        }

        if (
            barber_ids !== undefined &&
            !Array.isArray(barber_ids)
        ) {
            return res.status(400).json({
                success: false,
                error: "barber_ids debe ser una lista de identificadores",
            });
        }

        await Service.update(id, {
            name,
            description,
            duration: Number(duration),
            price: Number(price),
            image,
            ...(barber_ids !== undefined ? { barber_ids } : {}),
        });

        return res.status(200).json({
            success: true,
            message: "Servicio actualizado correctamente",
        });
    } catch (err) {
        console.error("Error actualizando servicio:", err);

        return res.status(500).json({
            success: false,
            error: "Error actualizando servicio",
        });
    }
};

// ==========================================
// DESACTIVAR SERVICIO
// ==========================================
exports.deactivateService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                error: "Servicio no encontrado",
            });
        }

        await Service.deactivate(id);

        return res.status(200).json({
            success: true,
            message: "Servicio desactivado correctamente",
        });
    } catch (err) {
        console.error("Error desactivando servicio:", err);

        return res.status(500).json({
            success: false,
            error: "Error desactivando servicio",
        });
    }
};

// ==========================================
// ACTIVAR SERVICIO
// ==========================================
exports.activateService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                error: "Servicio no encontrado",
            });
        }

        await Service.activate(id);

        return res.status(200).json({
            success: true,
            message: "Servicio activado correctamente",
        });
    } catch (err) {
        console.error("Error activando servicio:", err);

        return res.status(500).json({
            success: false,
            error: "Error activando servicio",
        });
    }
};

// ==========================================
// ELIMINAR SERVICIO DEFINITIVAMENTE
// ==========================================
exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                error: "Servicio no encontrado",
            });
        }

        await Service.delete(id);

        return res.status(200).json({
            success: true,
            message: "Servicio eliminado definitivamente",
        });
    } catch (err) {
        console.error("Error eliminando servicio:", err);

        return res.status(500).json({
            success: false,
            error: "No se pudo eliminar el servicio",
        });
    }
};
