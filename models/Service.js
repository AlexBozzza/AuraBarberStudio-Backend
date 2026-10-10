// models/Service.js
const { pool } = require("../config/database");

const Service = {

  // ✅ Obtener todos los servicios
  async findAll() {
    const [rows] = await pool.execute(
      "SELECT * FROM services ORDER BY id DESC"
    );

    return rows;
  },

  // ✅ Alias para no romper el controller
  async getAll() {
    return await this.findAll();
  },

  // ✅ Obtener solo los servicios activos
  async findAllActive() {
    const [rows] = await pool.execute(
      "SELECT * FROM services WHERE is_active = 1 ORDER BY id ASC"
    );

    return rows;
  },

  // ✅ Buscar servicio por ID
  async findById(id) {
    const [rows] = await pool.execute(
      "SELECT * FROM services WHERE id = ?",
      [id]
    );

    return rows[0] || null;
  },

  // ✅ Crear servicio
  async create({
    name,
    description,
    duration,
    price,
    image
  }) {
    const [result] = await pool.execute(
      `INSERT INTO services
      (name, description, duration, price, image)
      VALUES (?, ?, ?, ?, ?)`,
      [
        name,
        description,
        duration,
        price,
        image
      ]
    );

    return { insertId: result.insertId };
  },

  // ✅ Editar servicio
  async update(
    id,
    {
      name,
      description,
      duration,
      price,
      image
    }
  ) {
    await pool.execute(
      `UPDATE services
       SET name = ?,
           description = ?,
           duration = ?,
           price = ?,
           image = ?
       WHERE id = ?`,
      [
        name,
        description,
        duration,
        price,
        image,
        id
      ]
    );

    return true;
  },

  // ✅ Desactivar servicio
  async deactivate(id) {
    await pool.execute(
      "UPDATE services SET is_active = 0 WHERE id = ?",
      [id]
    );

    return true;
  },

  // ✅ Reactivar servicio
  async activate(id) {
    await pool.execute(
      "UPDATE services SET is_active = 1 WHERE id = ?",
      [id]
    );

    return true;
  },

  // ✅ Eliminar servicio definitivamente
  async delete(id) {
    await pool.execute(
      "DELETE FROM services WHERE id = ?",
      [id]
    );

    return true;
  }

};

module.exports = Service;