
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
        this.email_verified = data.email_verified;
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
                email_verified,
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
                email_verified,
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
                email_verified,
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
    // Los registros nuevos quedan pendientes de verificación
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
                password,
                email_verified
            )
            VALUES (?, ?, ?, ?, ?, 0)`,
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
    // GUARDAR TOKEN DE VERIFICACIÓN
    // ============================================================

    static async saveEmailVerificationToken(
        userId,
        tokenHash,
        expiresAt
    ) {
        await pool.query(
            `UPDATE users
             SET
                email_verification_token_hash = ?,
                email_verification_expires_at = ?
             WHERE id = ?`,
            [tokenHash, expiresAt, userId]
        );
    }

    // ============================================================
    // BUSCAR USUARIO POR TOKEN DE VERIFICACIÓN
    // ============================================================

    static async findByEmailVerificationToken(tokenHash) {
        const [rows] = await pool.query(
            `SELECT
                id,
                first_name,
                last_name,
                email,
                email_verified,
                email_verification_expires_at
             FROM users
             WHERE
                email_verification_token_hash = ?
                AND email_verification_expires_at > NOW()
                AND email_verified = 0`,
            [tokenHash]
        );

        return rows[0] || null;
    }

    // ============================================================
    // CONFIRMAR CORREO ELECTRÓNICO
    // ============================================================

    static async verifyEmail(userId) {
        const [result] = await pool.query(
            `UPDATE users
             SET
                email_verified = 1,
                email_verification_token_hash = NULL,
                email_verification_expires_at = NULL
             WHERE
                id = ?
                AND email_verified = 0
                AND email_verification_expires_at > NOW()`,
            [userId]
        );

        return result.affectedRows > 0;
    }

    // ============================================================
    // GUARDAR TOKEN DE RECUPERACIÓN DE CONTRASEÑA
    // ============================================================

    static async savePasswordResetToken(userId, tokenHash, expiresAt) {
        await pool.query(
            `UPDATE users
             SET
                password_reset_token_hash = ?,
                password_reset_expires_at = ?
             WHERE id = ?`,
            [tokenHash, expiresAt, userId]
        );
    }

    // ============================================================
    // BUSCAR USUARIO POR TOKEN DE RECUPERACIÓN
    // ============================================================

    static async findByPasswordResetToken(tokenHash) {
        const [rows] = await pool.query(
            `SELECT
                id,
                first_name,
                last_name,
                email,
                password_reset_expires_at
             FROM users
             WHERE
                password_reset_token_hash = ?
                AND password_reset_expires_at > NOW()`,
            [tokenHash]
        );

        return rows[0] || null;
    }

    // ============================================================
    // ACTUALIZAR CONTRASEÑA Y ELIMINAR TOKEN
    // ============================================================

    static async resetPassword(userId, tokenHash, hashedPassword) {
        const [result] = await pool.query(
            `UPDATE users
             SET
                password = ?,
                password_reset_token_hash = NULL,
                password_reset_expires_at = NULL,
                updated_at = NOW()
             WHERE
                id = ?
                AND password_reset_token_hash = ?
                AND password_reset_expires_at > NOW()`,
            [hashedPassword, userId, tokenHash]
        );

        return result.affectedRows > 0;
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
                email_verified,
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

        const [countRows] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM users`
        );

        const totalUsers = countRows[0].total;

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
                email_verified,
                created_at,
                updated_at
            FROM users
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const totalPages = Math.ceil(totalUsers / limit);

        return {
            users: rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
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
