
const Service = require("../models/Service");

const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

// ==========================================
// SUBIR IMAGEN A CLOUDINARY
// ==========================================
const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "aura-barber-studio/services",
                resource_type: "image"
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            }
        );

        Readable.from(file.buffer).pipe(uploadStream);
    });
};

// ==========================================
// PROCESAR IDENTIFICADORES DE BARBEROS
// ==========================================
const parseBarberIds = (value) => {
    if (value === undefined || value === null || value === "") {
        return [];
    }

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value !== "string") {
        return null;
    }

    try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed)) {
            return parsed;
        }

        return null;
    } catch (error) {
        return value.split(",").filter(Boolean);
    }
};

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
    let uploadedImage = null;

    try {
        const {
            name,
            description,
            duration,
            price
        } = req.body;

        const barber_ids = parseBarberIds(req.body.barber_ids);

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

        let image = req.body.image || null;
        let image_public_id = null;

        // Subir fotografía a Cloudinary
        if (req.file) {
            uploadedImage = await uploadToCloudinary(req.file);

            image = uploadedImage.secure_url;
            image_public_id = uploadedImage.public_id;
        }

        const result = await Service.create({
            name,
            description,
            duration: Number(duration),
            price: Number(price),
            image,
            image_public_id,
            barber_ids,
        });

        return res.status(201).json({
            success: true,
            message: "Servicio creado correctamente",
            data: result,
        });

    } catch (err) {

        // Limpiar imagen si falla la creación en MySQL
        if (uploadedImage?.public_id) {
            try {
                await cloudinary.uploader.destroy(uploadedImage.public_id);
            } catch (deleteError) {
                console.error(
                    "Error eliminando imagen temporal:",
                    deleteError
                );
            }
        }

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
    let uploadedImage = null;

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
            price
        } = req.body;

        let barber_ids = req.body.barber_ids;

        if (!name || !duration || price === undefined || price === null) {
            return res.status(400).json({
                success: false,
                error: "El nombre, la duración y el precio son obligatorios",
            });
        }

        if (barber_ids !== undefined) {
            barber_ids = parseBarberIds(barber_ids);

            if (!Array.isArray(barber_ids)) {
                return res.status(400).json({
                    success: false,
                    error: "barber_ids debe ser una lista de identificadores",
                });
            }
        }

        // Conservar la fotografía actual por defecto
        let image = req.body.image || service.image;
        let image_public_id = service.image_public_id || null;

        // Subir nueva fotografía si se seleccionó una
        if (req.file) {
            uploadedImage = await uploadToCloudinary(req.file);

            image = uploadedImage.secure_url;
            image_public_id = uploadedImage.public_id;

        } else if (
            req.body.image &&
            req.body.image !== service.image
        ) {
            image_public_id = null;
        }

        await Service.update(id, {
            name,
            description,
            duration: Number(duration),
            price: Number(price),
            image,
            image_public_id,
            ...(barber_ids !== undefined ? { barber_ids } : {}),
        });

        // Eliminar imagen anterior después de actualizar MySQL
        if (
            uploadedImage &&
            service.image_public_id &&
            service.image_public_id !== uploadedImage.public_id
        ) {
            try {
                await cloudinary.uploader.destroy(
                    service.image_public_id
                );
            } catch (deleteError) {
                console.error(
                    "No se pudo eliminar la imagen anterior:",
                    deleteError
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Servicio actualizado correctamente",
        });

    } catch (err) {

        // Limpiar la nueva fotografía si falla la actualización
        if (uploadedImage?.public_id) {
            try {
                await cloudinary.uploader.destroy(uploadedImage.public_id);
            } catch (deleteError) {
                console.error(
                    "Error eliminando imagen temporal:",
                    deleteError
                );
            }
        }

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
