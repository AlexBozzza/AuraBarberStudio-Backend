/**
 * Rutas de Autenticación
 * Maneja registro, login, perfil y logout
 */

const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');

const AuthController = require('../controllers/authController');

const {
    validateRegister,
    validateLogin,
    validateProfileUpdate
} = require('../middleware/validation');


// 📌 Registro
router.post(
    '/register',
    validateRegister,
    AuthController.register
);


// 📌 Login
router.post(
    '/login',
    validateLogin,
    AuthController.login
);


// 📌 Obtener perfil
router.get(
    '/profile',
    authenticateToken,
    AuthController.getProfile
);


// 📌 Actualizar perfil
router.put(
    '/profile',
    validateProfileUpdate,
    authenticateToken,
    AuthController.updateProfile
);


// 📌 Refresh token
router.post(
    '/refresh',
    authenticateToken,
    AuthController.refreshToken
);


// 📌 Logout
router.post(
    '/logout',
    authenticateToken,
    AuthController.logout
);


module.exports = router;