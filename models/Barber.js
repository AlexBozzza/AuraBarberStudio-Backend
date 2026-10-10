const { pool } = require("../config/database");

const Barber = {

  // ✅ Crear barbero
  async create(data) {
    const {
      user_id,
      biography,
      experience_years,
      image
    } = data;

    const [result] = await pool.query(
      `INSERT INTO barbers
      (user_id, biography, experience_years, image, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [
        user_id,
        biography,
        experience_years,
        image
      ]
    );

    return this.findById(result.insertId);
  },

  // ✅ Obtener solo los barberos disponibles
  async getAvailable() {
    const [rows] = await pool.query(
      `SELECT
          b.id,
          b.user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          b.biography,
          b.experience_years,
          b.image,
          b.is_available,
          s.id AS service_id,
          s.name AS service_name
      FROM barbers b
      INNER JOIN users u
          ON b.user_id = u.id
      LEFT JOIN barber_services bs
          ON b.id = bs.barber_id
      LEFT JOIN services s
          ON bs.service_id = s.id
      WHERE b.is_available = 1
      ORDER BY b.id ASC`
    );

    const barbers = [];

    rows.forEach(row => {

      let barber = barbers.find(b => b.id === row.id);

      if (!barber) {

        barber = {
          id: row.id,
          user_id: row.user_id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          phone: row.phone,
          biography: row.biography,
          experience_years: row.experience_years,
          image: row.image,
          is_available: row.is_available,
          services: []
        };

        barbers.push(barber);
      }

      if (row.service_id) {
        barber.services.push({
          id: row.service_id,
          name: row.service_name
        });
      }

    });

    return barbers;
  },

  // ✅ Obtener por ID
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT
          b.id,
          b.user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          b.biography,
          b.experience_years,
          b.image,
          b.is_available,
          s.id AS service_id,
          s.name AS service_name
      FROM barbers b
      INNER JOIN users u
          ON b.user_id = u.id
      LEFT JOIN barber_services bs
          ON b.id = bs.barber_id
      LEFT JOIN services s
          ON bs.service_id = s.id
      WHERE b.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    const barber = {
      id: rows[0].id,
      user_id: rows[0].user_id,
      first_name: rows[0].first_name,
      last_name: rows[0].last_name,
      email: rows[0].email,
      phone: rows[0].phone,
      biography: rows[0].biography,
      experience_years: rows[0].experience_years,
      image: rows[0].image,
      is_available: rows[0].is_available,
      services: []
    };

    rows.forEach(row => {
      if (row.service_id) {
        barber.services.push({
          id: row.service_id,
          name: row.service_name
        });
      }
    });

    return barber;
  },

  // ✅ Actualizar barbero
  async update(id, data) {

    const {
      biography = null,
      experience_years = 0,
      image = null
    } = data;

    await pool.query(
      `UPDATE barbers
      SET
        biography = ?,
        experience_years = ?,
        image = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        biography,
        experience_years,
        image,
        id
      ]
    );

    return this.findById(id);
  },

  // ✅ Desactivar disponibilidad
  async deactivate(id) {
    await pool.query(
      `UPDATE barbers
      SET is_available = 0
      WHERE id = ?`,
      [id]
    );

    return true;
  },

  // ✅ Activar disponibilidad
  async activate(id) {
    await pool.query(
      `UPDATE barbers
      SET is_available = 1
      WHERE id = ?`,
      [id]
    );

    return true;
  },

  // ✅ Eliminar definitivamente
  async delete(id) {
    await pool.query(
      `DELETE FROM barbers
      WHERE id = ?`,
      [id]
    );

    return true;
  }

};

module.exports = Barber;