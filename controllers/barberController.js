const Barber = require("../models/Barber");

// ✅ LISTAR TODOS LOS BARBEROS
exports.getBarbers = async (req, res) => {
  try {
    const rows = await Barber.getAvailable();

    res.json({
      success: true,
      data: rows,
    });

  } catch (err) {
    console.error("Error al obtener barberos:", err);

    res.status(500).json({
      success: false,
      error: "Error al obtener barberos",
    });
  }
};


// ✅ LISTAR SOLO LOS DISPONIBLES
exports.getAvailableBarbers = async (req, res) => {
  try {
    const rows = await Barber.getAvailable();

    res.json({
      success: true,
      data: rows,
    });

  } catch (err) {
    console.error("Error al obtener barberos disponibles:", err);

    res.status(500).json({
      success: false,
      error: "Error al obtener barberos disponibles",
    });
  }
};


// ✅ OBTENER BARBERO POR ID
exports.getBarberById = async (req, res) => {
  try {
    const { id } = req.params;

    const barber = await Barber.findById(id);

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barbero no encontrado",
      });
    }

    res.json({
      success: true,
      data: barber,
    });

  } catch (err) {
    console.error("Error al obtener barbero:", err);

    res.status(500).json({
      success: false,
      error: "Error al obtener barbero",
    });
  }
};


// ✅ CREAR BARBERO
exports.createBarber = async (req, res) => {
  try {
    const result = await Barber.create(req.body);

    res.status(201).json({
      success: true,
      message: "Barbero creado correctamente",
      data: result,
    });

  } catch (err) {
    console.error("Error creando barbero:", err);

    res.status(500).json({
      success: false,
      error: "Error creando barbero",
    });
  }
};


// ✅ ACTUALIZAR BARBERO
exports.updateBarber = async (req, res) => {
  try {
    const { id } = req.params;

    const barber = await Barber.findById(id);

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barbero no encontrado",
      });
    }

    await Barber.update(id, req.body);

    res.json({
      success: true,
      message: "Barbero actualizado correctamente",
    });

  } catch (err) {
    console.error("Error actualizando barbero:", err);

    res.status(500).json({
      success: false,
      error: "Error actualizando barbero",
    });
  }
};


// ✅ DESACTIVAR BARBERO
exports.deactivateBarber = async (req, res) => {
  try {
    const { id } = req.params;

    const barber = await Barber.findById(id);

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barbero no encontrado",
      });
    }

    await Barber.deactivate(id);

    res.json({
      success: true,
      message: "Barbero desactivado correctamente",
    });

  } catch (err) {
    console.error("Error desactivando barbero:", err);

    res.status(500).json({
      success: false,
      error: "Error desactivando barbero",
    });
  }
};


// ✅ ACTIVAR BARBERO
exports.activateBarber = async (req, res) => {
  try {
    const { id } = req.params;

    const barber = await Barber.findById(id);

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barbero no encontrado",
      });
    }

    await Barber.activate(id);

    res.json({
      success: true,
      message: "Barbero activado correctamente",
    });

  } catch (err) {
    console.error("Error activando barbero:", err);

    res.status(500).json({
      success: false,
      error: "Error activando barbero",
    });
  }
};


// ✅ ELIMINAR BARBERO DEFINITIVAMENTE
exports.deleteBarber = async (req, res) => {
  try {
    const { id } = req.params;

    const barber = await Barber.findById(id);

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barbero no encontrado",
      });
    }

    await Barber.delete(id);

    res.json({
      success: true,
      message: "Barbero eliminado correctamente",
    });

  } catch (err) {
    console.error("Error eliminando barbero:", err);

    res.status(500).json({
      success: false,
      error: "No se pudo eliminar el barbero",
    });
  }
};