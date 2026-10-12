
const express = require("express");
const router = express.Router();

const ReviewController = require("../controllers/reviewController");
const { authenticateToken } = require("../middleware/auth");

// Consultar reseñas: público, no requiere iniciar sesión
router.get("/", ReviewController.getReviews);

// Publicar una reseña: requiere iniciar sesión
router.post("/", authenticateToken, ReviewController.createReview);

module.exports = router;
