
const Review = require("../models/Review");

class ReviewController {

    // =========================================
    // OBTENER RESEÑAS
    // =========================================
    static async getReviews(req, res) {
        try {
            const page = Math.max(
                1,
                parseInt(req.query.page, 10) || 1
            );

            const limit = Math.min(
                50,
                Math.max(
                    1,
                    parseInt(req.query.limit, 10) || 20
                )
            );

            const offset = (page - 1) * limit;

            const reviews = await Review.getAll(
                limit,
                offset
            );

            return res.status(200).json({
                success: true,
                message: "Reseñas obtenidas correctamente",
                data: reviews,
                pagination: {
                    page,
                    limit,
                    count: reviews.length
                }
            });

        } catch (error) {
            console.error(
                "Error al obtener reseñas:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "No se pudieron obtener las reseñas"
            });
        }
    }


    // =========================================
    // CREAR RESEÑA
    // =========================================
    static async createReview(req, res) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Debes iniciar sesión para publicar una reseña"
                });
            }

            const rating = Number(req.body.rating);
            const comment =
                typeof req.body.comment === "string"
                    ? req.body.comment.trim()
                    : "";

            // Validar puntuación
            if (
                !Number.isInteger(rating) ||
                rating < 1 ||
                rating > 5
            ) {
                return res.status(400).json({
                    success: false,
                    message: "La puntuación debe ser un número entero entre 1 y 5"
                });
            }

            // Validar comentario
            if (!comment) {
                return res.status(400).json({
                    success: false,
                    message: "El comentario es obligatorio"
                });
            }

            if (comment.length < 5) {
                return res.status(400).json({
                    success: false,
                    message: "El comentario debe tener al menos 5 caracteres"
                });
            }

            if (comment.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: "El comentario no puede superar los 1000 caracteres"
                });
            }

            const reviewId = await Review.create({
                userId,
                rating,
                comment
            });

            return res.status(201).json({
                success: true,
                message: "Reseña publicada correctamente",
                data: {
                    id: reviewId,
                    user_id: userId,
                    rating,
                    comment
                }
            });

        } catch (error) {
            console.error(
                "Error al crear reseña:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "No se pudo publicar la reseña"
            });
        }
    }
}

module.exports = ReviewController;
