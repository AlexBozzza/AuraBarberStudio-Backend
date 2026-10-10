const { pool } = require("../config/database");

class User {

    constructor(data) {

        this.id = data.id;
        this.first_name = data.first_name;
        this.last_name = data.last_name;
        this.email = data.email;
        this.phone = data.phone;
        this.password = data.password;
        this.role = data.role;
        this.profile_image = data.profile_image;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;

    }


    // ============================================================
    // OBTENER TODOS LOS USUARIOS
    // ============================================================

    static async findAll() {

        const [rows] = await pool.query(
            `SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                role,
                profile_image,
                is_active,
                created_at,
                updated_at
            FROM users
            ORDER BY created_at DESC`
        );

        return rows;

    }


    // ============================================================
    // OBTENER USUARIO POR ID
    // ============================================================

    static async findById(id) {

        const [rows] = await pool.query(
            `SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                role,
                profile_image,
                is_active,
                created_at,
                updated_at
            FROM users
            WHERE id = ?`,
            [id]
        );

        return rows[0] || null;

    }


    // ============================================================
    // BUSCAR USUARIO POR EMAIL
    // ============================================================

    static async findByEmail(email) {

        const [rows] = await pool.query(
            `SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                role,
                profile_image,
                is_active,
                created_at,
                updated_at
            FROM users
            WHERE email = ?`,
            [email]
        );

        return rows[0] || null;

    }


    // ============================================================
    // BUSCAR USUARIO CON CONTRASEÑA
    // Se utiliza para el login
    // ============================================================

    static async findByEmailWithPassword(email) {

        const [rows] = await pool.query(
            `SELECT *
             FROM users
             WHERE email = ?`,
            [email]
        );

        return rows[0] || null;

    }


    // ============================================================
    // CREAR USUARIO
    // ============================================================

    static async create({
        first_name,
        last_name,
        email,
        phone,
        password
    }) {

        const [result] = await pool.query(
            `INSERT INTO users (
                first_name,
                last_name,
                email,
                phone,
                password
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                first_name,
                last_name,
                email,
                phone,
                password
            ]
        );

        return this.findById(result.insertId);

    }


    // ============================================================
// ACTUALIZAR USUARIO
// ============================================================

static async updateUser(
    id,
    {
        first_name,
        last_name,
        email,
        phone,
        password
    }
) {

    let sql = `
        UPDATE users
        SET
            first_name = ?,
            last_name = ?,
            email = ?,
            phone = ?,
            updated_at = NOW()
    `;

    const params = [
        first_name,
        last_name,
        email,
        phone
    ];

    // Si se está cambiando la contraseña
    if (password) {

        sql += `,
            password = ?
        `;

        params.push(password);
    }

    sql += `
        WHERE id = ?
    `;

    params.push(id);

    await pool.query(sql, params);

    return this.findById(id);

}


    // ============================================================
    // BUSCAR USUARIOS POR NOMBRE
    // ============================================================

    static async searchByName(search) {

        const searchTerm = `%${search}%`;

        const [rows] = await pool.query(
            `SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                role,
                profile_image,
                is_active,
                created_at,
                updated_at
            FROM users
            WHERE
                first_name LIKE ?
                OR last_name LIKE ?
                OR CONCAT(first_name, ' ', last_name) LIKE ?
                OR email LIKE ?
            ORDER BY created_at DESC`,
            [
                searchTerm,
                searchTerm,
                searchTerm,
                searchTerm
            ]
        );

        return rows;

    }


    // ============================================================
    // PAGINACIÓN
    // ============================================================

    static async paginate(page = 1, limit = 10) {

        page = Math.max(1, parseInt(page) || 1);
        limit = Math.max(1, parseInt(limit) || 10);

        const offset = (page - 1) * limit;


        // Total de usuarios

        const [countRows] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM users`
        );

        const totalUsers = countRows[0].total;


        // Usuarios de la página actual

        const [rows] = await pool.query(
            `SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                role,
                profile_image,
                is_active,
                created_at,
                updated_at
            FROM users
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );


        const totalPages =
            Math.ceil(totalUsers / limit);


        return {

            users: rows,

            pagination: {

                currentPage: page,

                totalPages,

                totalUsers,

                hasNextPage:
                    page < totalPages,

                hasPrevPage:
                    page > 1

            }

        };

    }


    // ============================================================
    // ELIMINAR USUARIO
    // ============================================================

    static async delete(id) {

        const [result] = await pool.query(
            `DELETE FROM users
             WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;

    }


    // ============================================================
    // CONTAR USUARIOS
    // ============================================================

    static async count() {

        const [rows] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM users`
        );

        return rows[0].total;

    }

}


module.exports = User;