/**
 * Modelo Appointment
 * @description Maneja todas las consultas SQL de citas
 */

const { pool } = require("../config/database");

class Appointment {

  // ==========================================================
  // CREAR NUEVA CITA
  // ==========================================================
  static async create(data) {

    const {
      user_id,
      barber_id,
      service_id,
      appointment_date,
      start_time,
      end_time,
      status = "PENDING",
      notes = null
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO appointments
      (
        user_id,
        barber_id,
        service_id,
        appointment_date,
        start_time,
        end_time,
        status,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        barber_id,
        service_id,
        appointment_date,
        start_time,
        end_time,
        status,
        notes
      ]
    );

    return this.findById(result.insertId);
  }


  // ==========================================================
  // BUSCAR CITA POR ID
  // ==========================================================
  static async findById(id) {

    const [rows] = await pool.execute(
      `SELECT
          a.*,

          -- Cliente
          u.first_name,
          u.last_name,

          -- Barbero
          b.user_id AS barber_user_id,
          bu.first_name AS barber_first_name,
          bu.last_name AS barber_last_name,

          -- Servicio
          s.name AS service_name,
          s.duration,
          s.price

      FROM appointments a

      INNER JOIN users u
          ON a.user_id = u.id

      INNER JOIN barbers b
          ON a.barber_id = b.id

      INNER JOIN users bu
          ON b.user_id = bu.id

      INNER JOIN services s
          ON a.service_id = s.id

      WHERE a.id = ?`,
      [id]
    );

    return rows[0] || null;
  }


  // ==========================================================
  // OBTENER TODAS LAS CITAS
  // ==========================================================
  static async findAll() {

    const [rows] = await pool.execute(
      `SELECT
          a.*,

          -- Cliente
          u.first_name,
          u.last_name,

          -- Barbero
          b.user_id AS barber_user_id,
          bu.first_name AS barber_first_name,
          bu.last_name AS barber_last_name,

          -- Servicio
          s.name AS service_name,
          s.duration,
          s.price

      FROM appointments a

      INNER JOIN users u
          ON a.user_id = u.id

      INNER JOIN barbers b
          ON a.barber_id = b.id

      INNER JOIN users bu
          ON b.user_id = bu.id

      INNER JOIN services s
          ON a.service_id = s.id

      ORDER BY
          appointment_date DESC,
          start_time ASC`
    );

    return rows;
  }


  // ==========================================================
  // OBTENER CITAS POR FECHA
  // ==========================================================
  static async findByDate(appointment_date) {

    const [rows] = await pool.execute(
      `SELECT *
      FROM appointments
      WHERE appointment_date = ?
      ORDER BY start_time ASC`,
      [appointment_date]
    );

    return rows;
  }


  // ==========================================================
  // OBTENER CITAS DE UN BARBERO EN UNA FECHA
  // ==========================================================
  static async findByBarberAndDate(
    barber_id,
    appointment_date
  ) {

    const [rows] = await pool.execute(
      `SELECT *
      FROM appointments
      WHERE barber_id = ?
      AND appointment_date = ?
      ORDER BY start_time ASC`,
      [
        barber_id,
        appointment_date
      ]
    );

    return rows;
  }


  // ==========================================================
  // OBTENER HISTORIAL DE CITAS DE UN USUARIO
  // ==========================================================
  static async findByUser(user_id) {

    const [rows] = await pool.execute(
      `SELECT
          a.id,
          a.user_id,
          a.barber_id,
          a.service_id,
          a.appointment_date,
          a.start_time,
          a.end_time,
          a.status,
          a.notes,
          a.created_at,
          a.updated_at,

          -- Servicio
          s.name AS service_name,
          s.duration AS service_duration,

          -- Barbero
          bu.first_name AS barber_first_name,
          bu.last_name AS barber_last_name

      FROM appointments a

      INNER JOIN services s
          ON a.service_id = s.id

      INNER JOIN barbers b
          ON a.barber_id = b.id

      INNER JOIN users bu
          ON b.user_id = bu.id

      WHERE a.user_id = ?

      ORDER BY
          a.appointment_date DESC,
          a.start_time DESC`,
      [user_id]
    );

    return rows;
  }


  // ==========================================================
  // VERIFICAR DISPONIBILIDAD DEL HORARIO
  // ==========================================================
  static async isTimeAvailable(
    barber_id,
    appointment_date,
    start_time,
    end_time
  ) {

    const [rows] = await pool.execute(
      `SELECT id
      FROM appointments
      WHERE barber_id = ?
      AND appointment_date = ?
      AND status IN ('PENDING', 'CONFIRMED')
      AND (
            start_time < ?
        AND end_time > ?
      )
      LIMIT 1`,
      [
        barber_id,
        appointment_date,
        end_time,
        start_time
      ]
    );

    return rows.length === 0;
  }


  // ==========================================================
  // OBTENER INFORMACIÓN DEL SERVICIO
  // ==========================================================
  static async getServiceDuration(service_id) {

    const [rows] = await pool.execute(
      `SELECT
          id,
          duration,
          price,
          name
      FROM services
      WHERE id = ?`,
      [service_id]
    );

    return rows[0] || null;
  }


  // ==========================================================
  // CAMBIAR ESTADO
  // ==========================================================
  static async updateStatus(id, status) {

    await pool.execute(
      `UPDATE appointments
      SET status = ?
      WHERE id = ?`,
      [
        status,
        id
      ]
    );

    return this.findById(id);
  }

  
  // ==========================================================
  // OBTENER CITAS PENDIENTES DE RECORDATORIO
  // ==========================================================
  static async findAppointmentsForReminders(fromDateTime, toDateTime) {
    const [rows] = await pool.execute(
      `SELECT
          a.id,
          a.user_id,
          a.appointment_date,
          a.start_time,
          a.status,
          u.email AS customer_email,
          u.first_name AS customer_first_name,
          u.last_name AS customer_last_name,
          s.name AS service_name,
          bu.first_name AS barber_first_name,
          bu.last_name AS barber_last_name
       FROM appointments a
       INNER JOIN users u ON a.user_id = u.id
       INNER JOIN barbers b ON a.barber_id = b.id
       INNER JOIN users bu ON b.user_id = bu.id
       INNER JOIN services s ON a.service_id = s.id
       WHERE a.status IN ('PENDING', 'CONFIRMED')
         AND a.reminder_sent_at IS NULL
         AND TIMESTAMP(a.appointment_date, a.start_time)
             BETWEEN ? AND ?
       ORDER BY a.appointment_date ASC, a.start_time ASC`,
      [fromDateTime, toDateTime]
    );

    return rows;
  }


  // ==========================================================
  // ELIMINAR CITA
  // ==========================================================
  static async delete(id) {

    const [result] = await pool.execute(
      `DELETE FROM appointments
      WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

}

module.exports = Appointment;