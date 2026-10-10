const { pool } = require("../config/database");

class Dashboard {

    // ==========================================
    // OBTENER RESUMEN DEL DASHBOARD
    // ==========================================

    static async getSummary() {

        const [
            [todayAppointments],
            [pendingAppointments],
            [totalClients],
            [activeServices],
            [potentialRevenue],
            [completedRevenue]
        ] = await Promise.all([

            // ------------------------------------------
            // CITAS DE HOY
            // ------------------------------------------

            pool.query(`
                SELECT COUNT(*) AS total
                FROM appointments
                WHERE appointment_date = CURDATE()
                AND status != 'CANCELLED'
            `),

            // ------------------------------------------
            // CITAS PENDIENTES
            // ------------------------------------------

            pool.query(`
                SELECT COUNT(*) AS total
                FROM appointments
                WHERE status = 'PENDING'
            `),

            // ------------------------------------------
            // TOTAL DE CLIENTES
            // ------------------------------------------

            pool.query(`
                SELECT COUNT(*) AS total
                FROM users
                WHERE role = 'CLIENT'
                AND is_active = TRUE
            `),

            // ------------------------------------------
            // SERVICIOS ACTIVOS
            // ------------------------------------------

            pool.query(`
                SELECT COUNT(*) AS total
                FROM services
                WHERE is_active = TRUE
            `),

            // ------------------------------------------
            // INGRESO POTENCIAL DE HOY
            // PENDING + CONFIRMED
            // ------------------------------------------

            pool.query(`
                SELECT COALESCE(SUM(s.price), 0) AS total
                FROM appointments a
                INNER JOIN services s
                    ON a.service_id = s.id
                WHERE a.appointment_date = CURDATE()
                AND a.status IN ('PENDING', 'CONFIRMED')
            `),

            // ------------------------------------------
            // INGRESO REALIZADO
            // COMPLETED
            // ------------------------------------------

            pool.query(`
                SELECT COALESCE(SUM(s.price), 0) AS total
                FROM appointments a
                INNER JOIN services s
                    ON a.service_id = s.id
                WHERE a.appointment_date = CURDATE()
                AND a.status = 'COMPLETED'
            `)
        ]);

        return {
            todayAppointments: Number(todayAppointments[0].total),
            pendingAppointments: Number(pendingAppointments[0].total),
            totalClients: Number(totalClients[0].total),
            activeServices: Number(activeServices[0].total),
            potentialRevenue: Number(potentialRevenue[0].total),
            completedRevenue: Number(completedRevenue[0].total)
        };
    }


    // ==========================================
    // AGENDA DE HOY
    // ==========================================

    static async getTodaySchedule() {

        const [rows] = await pool.query(`

            SELECT

                a.id,

                a.appointment_date,

                a.start_time,

                a.end_time,

                a.status,

                a.notes,

                u.first_name AS client_first_name,
                u.last_name AS client_last_name,

                s.name AS service_name,
                s.duration AS service_duration,
                s.price AS service_price,

                bu.first_name AS barber_first_name,
                bu.last_name AS barber_last_name

            FROM appointments a

            INNER JOIN users u
                ON a.user_id = u.id

            INNER JOIN services s
                ON a.service_id = s.id

            INNER JOIN barbers b
                ON a.barber_id = b.id

            INNER JOIN users bu
                ON b.user_id = bu.id

            WHERE a.appointment_date = CURDATE()

            ORDER BY
                a.start_time ASC

        `);

        return rows;
    }


    // ==========================================
    // OBTENER TODO EL DASHBOARD
    // ==========================================

    static async getDashboard() {

        const [summary, todaySchedule] = await Promise.all([

            this.getSummary(),

            this.getTodaySchedule()

        ]);

        return {
            ...summary,
            todaySchedule
        };
    }
}

module.exports = Dashboard;