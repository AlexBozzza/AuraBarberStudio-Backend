/**
 * Rutas de Autenticación
 * Maneja registro, login, verificación, perfil y logout
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

// ============================================================
// REGISTRO
// ============================================================

router.post(
    '/register',
    validateRegister,
    AuthController.register
);

// ============================================================
// VERIFICAR CORREO ELECTRÓNICO
// ============================================================

router.post(
    '/verify-email',
    AuthController.verifyEmail
);

// ============================================================
// REENVIAR CORREO DE VERIFICACIÓN
// ============================================================

router.post(
    '/resend-verification',
    AuthController.resendVerification
);

// ============================================================
// RECUPERAR CONTRASEÑA
// ============================================================

router.post(
    '/forgot-password',
    AuthController.forgotPassword
);

// ============================================================
// RESTABLECER CONTRASEÑA
// ============================================================

router.post(
    '/reset-password',
    AuthController.resetPassword
);

// ============================================================
// LOGIN
// ============================================================

router.post(
    '/login',
    validateLogin,
    AuthController.login
);

// ============================================================
// OBTENER PERFIL
// ============================================================

router.get(
    '/profile',
    authenticateToken,
    AuthController.getProfile
);

// ============================================================
// ACTUALIZAR PERFIL
// ============================================================

router.put(
    '/profile',
    validateProfileUpdate,
    authenticateToken,
    AuthController.updateProfile
);

// ============================================================
// REFRESH TOKEN
// ============================================================

router.post(
    '/refresh',
    authenticateToken,
    AuthController.refreshToken
);

// ============================================================
// LOGOUT
// ============================================================

router.post(
    '/logout',
    authenticateToken,
    AuthController.logout
);

module.exports = router;
