const Service = require("../models/Service");


// ✅ LISTAR TODOS LOS SERVICIOS
exports.getServices = async (req, res) => {
  try {
    const rows = await Service.getAll();

    res.json({
      success: true,
      data: rows,
    });

  } catch (err) {
    console.error("Error al obtener servicios:", err);

    res.status(500).json({
      success: false,
      error: "Error al obtener servicios",
    });
  }
};


// ✅ LISTAR SOLO SERVICIOS ACTIVOS
exports.getActiveServices = async (req, res) => {
  try {
    const rows = await Service.findAllActive();

    res.json({
      success: true,
      data: rows,
    });

  } catch (err) {
    console.error("Error al obtener servicios activos:", err);

    res.status(500).json({
      success: false,
      error: "Error al obtener servicios activos",
    });
  }
};


// ✅ OBTENER SERVICIO POR ID
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

    res.json({
      success: true,
      data: service,
    });

  } catch (err) {
    console.error("Error al obtener servicio:", err);

    res.status(500).json({
      success: false,
      error: "Error al obtener servicio",
    });
  }
};


// ✅ CREAR SERVICIO
exports.createService = async (req, res) => {
  try {
    const result = await Service.create(req.body);

    res.status(201).json({
      success: true,
      message: "Servicio creado correctamente",
      data: result,
    });

  } catch (err) {
    console.error("Error creando servicio:", err);

    res.status(500).json({
      success: false,
      error: "Error creando servicio",
    });
  }
};


// ✅ ACTUALIZAR SERVICIO
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

    await Service.update(id, req.body);

    res.json({
      success: true,
      message: "Servicio actualizado correctamente",
    });

  } catch (err) {
    console.error("Error actualizando servicio:", err);

    res.status(500).json({
      success: false,
      error: "Error actualizando servicio",
    });
  }
};


// ✅ DESACTIVAR SERVICIO
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

    res.json({
      success: true,
      message: "Servicio desactivado correctamente",
    });

  } catch (err) {
    console.error("Error desactivando servicio:", err);

    res.status(500).json({
      success: false,
      error: "Error desactivando servicio",
    });
  }
};


// ✅ ACTIVAR SERVICIO
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

    res.json({
      success: true,
      message: "Servicio activado correctamente",
    });

  } catch (err) {
    console.error("Error activando servicio:", err);

    res.status(500).json({
      success: false,
      error: "Error activando servicio",
    });
  }
};


// ✅ ELIMINAR SERVICIO DEFINITIVAMENTE
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

    res.json({
      success: true,
      message: "Servicio eliminado definitivamente",
    });

  } catch (err) {
    console.error("Error eliminando servicio:", err);

    res.status(500).json({
      success: false,
      error: "No se pudo eliminar el servicio",
    });
  }
};