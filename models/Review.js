
const { pool } = require("../config/database");

class Review {
    static async getAll(limit = 20, offset = 0) {
        const [rows] = await pool.query(
            `SELECT
                r.id,
                r.rating,
                r.comment,
                r.created_at,
                u.first_name,
                u.last_name,
                u.profile_image
            FROM reviews r
            INNER JOIN users u ON u.id = r.user_id
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?`,
            [Number(limit), Number(offset)]
        );

        return rows;
    }

    static async create({ userId, rating, comment }) {
        const [result] = await pool.query(
            `INSERT INTO reviews (
                user_id,
                rating,
                comment
            )
            VALUES (?, ?, ?)`,
            [userId, rating, comment]
        );

        return result.insertId;
    }
}

module.exports = Review;
