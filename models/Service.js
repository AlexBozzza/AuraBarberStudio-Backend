
const { pool } = require("../config/database");

const Service = {
    // Obtener servicios junto con sus barberos asignados
    async findAll() {
        const [services] = await pool.execute(
            "SELECT * FROM services ORDER BY id DESC"
        );

        if (services.length === 0) return [];

        const [assignments] = await pool.execute(
            `SELECT barber_id, service_id
             FROM barber_services`
        );

        return services.map((service) => ({
            ...service,
            barber_ids: assignments
                .filter(
                    (item) => Number(item.service_id) === Number(service.id)
                )
                .map((item) => Number(item.barber_id)),
        }));
    },

    async getAll() {
        return this.findAll();
    },

    // Obtener servicios activos con sus barberos
    async findAllActive() {
        const [services] = await pool.execute(
            `SELECT * FROM services
             WHERE is_active = 1
             ORDER BY id ASC`
        );

        if (services.length === 0) return [];

        const serviceIds = services.map((service) => service.id);
        const placeholders = serviceIds.map(() => "?").join(",");

        const [assignments] = await pool.execute(
            `SELECT barber_id, service_id
             FROM barber_services
             WHERE service_id IN (${placeholders})`,
            serviceIds
        );

        return services.map((service) => ({
            ...service,
            barber_ids: assignments
                .filter(
                    (item) => Number(item.service_id) === Number(service.id)
                )
                .map((item) => Number(item.barber_id)),
        }));
    },

    // Buscar servicio por ID, incluyendo sus barberos
    async findById(id) {
        const [rows] = await pool.execute(
            "SELECT * FROM services WHERE id = ?",
            [id]
        );

        if (!rows[0]) return null;

        const [assignments] = await pool.execute(
            `SELECT barber_id
             FROM barber_services
             WHERE service_id = ?`,
            [id]
        );

        return {
            ...rows[0],
            barber_ids: assignments.map((item) => Number(item.barber_id)),
        };
    },

    // Crear servicio y guardar sus asignaciones
    async create({
        name,
        description,
        duration,
        price,
        image,
        barber_ids = [],
    }) {
        if (!Array.isArray(barber_ids)) {
            throw new Error("barber_ids debe ser una lista");
        }

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                `INSERT INTO services
                    (name, description, duration, price, image)
                 VALUES (?, ?, ?, ?, ?)`,
                [name, description, duration, price, image || null]
            );

            const serviceId = result.insertId;

            const uniqueBarberIds = [
                ...new Set(barber_ids.map(Number)),
            ];

            for (const barberId of uniqueBarberIds) {
                if (!Number.isInteger(barberId) || barberId <= 0) {
                    throw new Error("Identificador de barbero inválido");
                }

                await connection.execute(
                    `INSERT INTO barber_services
                        (barber_id, service_id)
                     VALUES (?, ?)`,
                    [barberId, serviceId]
                );
            }

            await connection.commit();

            return {
                insertId: serviceId,
                barber_ids: uniqueBarberIds,
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Actualizar servicio y sus asignaciones
    async update(
        id,
        {
            name,
            description,
            duration,
            price,
            image,
            barber_ids,
        }
    ) {
        if (
            barber_ids !== undefined &&
            !Array.isArray(barber_ids)
        ) {
            throw new Error("barber_ids debe ser una lista");
        }

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            await connection.execute(
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
                    image || null,
                    id,
                ]
            );

            // Solo modificar asignaciones si se enviaron explícitamente.
            if (barber_ids !== undefined) {
                const uniqueBarberIds = [
                    ...new Set(barber_ids.map(Number)),
                ];

                for (const barberId of uniqueBarberIds) {
                    if (!Number.isInteger(barberId) || barberId <= 0) {
                        throw new Error("Identificador de barbero inválido");
                    }
                }

                await connection.execute(
                    `DELETE FROM barber_services
                     WHERE service_id = ?`,
                    [id]
                );

                for (const barberId of uniqueBarberIds) {
                    await connection.execute(
                        `INSERT INTO barber_services
                            (barber_id, service_id)
                         VALUES (?, ?)`,
                        [barberId, id]
                    );
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async deactivate(id) {
        await pool.execute(
            "UPDATE services SET is_active = 0 WHERE id = ?",
            [id]
        );

        return true;
    },

    async activate(id) {
        await pool.execute(
            "UPDATE services SET is_active = 1 WHERE id = ?",
            [id]
        );

        return true;
    },

    async delete(id) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            await connection.execute(
                "DELETE FROM barber_services WHERE service_id = ?",
                [id]
            );

            await connection.execute(
                "DELETE FROM services WHERE id = ?",
                [id]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },
};

module.exports = Service;
