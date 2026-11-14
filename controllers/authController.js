
/**
 * Controlador de Autenticación
 * Maneja registro, login y verificación de correo
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { sendEmail } = require('../services/emailService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://aura-barber-studio-frontend.vercel.app';
const VERIFICATION_HOURS = 24;
const PASSWORD_RESET_MINUTES = 30;

// Escapar caracteres especiales para evitar problemas en el HTML
const escapeHtml = (value) => {
    return String(value || '').replace(/[&<>"']/g, (character) => {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return entities[character];
    });
};

class AuthController {

    // ============================================================
    // REGISTRAR USUARIO
    // ============================================================

    static async register(req, res) {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const {
                first_name,
                last_name,
                email,
                phone,
                password
            } = req.body;

            const existingUser = await User.findByEmail(email);

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            const newUser = await User.create({
                first_name,
                last_name,
                email,
                phone,
                password: hashedPassword
            });

            // Generar token seguro
            const verificationToken = crypto.randomBytes(32).toString('hex');

            const tokenHash = crypto
                .createHash('sha256')
                .update(verificationToken)
                .digest('hex');

            const expiresAt = new Date(
                Date.now() + VERIFICATION_HOURS * 60 * 60 * 1000
            );

            await User.saveEmailVerificationToken(
                newUser.id,
                tokenHash,
                expiresAt
            );

            const verificationUrl =
                `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

            const safeFirstName = escapeHtml(newUser.first_name);

            const html = `
                <div style="font-family: Arial, sans-serif; background-color: #111111; padding: 40px 20px;">
                    <div style="max-width: 550px; margin: auto; background-color: #202020; padding: 35px; border-radius: 12px; color: #ffffff;">
                        <h1 style="color: #B8860B; text-align: center;">AURA BARBER STUDIO</h1>
                        <h2 style="text-align: center;">Confirma tu correo electrónico</h2>
                        <p>Hola ${safeFirstName},</p>
                        <p>Gracias por registrarte en Aura Barber Studio. Para activar tu cuenta, confirma que esta dirección de correo te pertenece.</p>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${verificationUrl}" style="background-color: #B8860B; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                VERIFICAR MI CORREO
                            </a>
                        </div>
                        <p style="color: #bbbbbb; font-size: 14px;">Este enlace vence en 24 horas.</p>
                        <p style="color: #bbbbbb; font-size: 14px;">Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
                    </div>
                </div>
            `;

            const text = `
Hola ${newUser.first_name},

Gracias por registrarte en Aura Barber Studio.

Confirma tu correo electrónico utilizando este enlace:

${verificationUrl}

El enlace vence en 24 horas.

Si no creaste esta cuenta, ignora este mensaje.
            `;

            try {
                await sendEmail({
                    to: email,
                    subject: 'Confirma tu correo - Aura Barber Studio',
                    text,
                    html
                });
            } catch (emailError) {
                console.error('Error enviando verificación:', emailError);

                return res.status(201).json({
                    success: true,
                    emailSent: false,
                    message: 'Tu cuenta fue creada, pero no pudimos enviar el correo. Puedes solicitar otro enlace desde la pantalla de verificación.',
                    data: {
                        email
                    }
                });
            }

            return res.status(201).json({
                success: true,
                emailSent: true,
                message: 'Cuenta creada. Revisa tu correo para verificar tu dirección antes de iniciar sesión.',
                data: {
                    email
                }
            });

        } catch (error) {
            console.error('Error en register:', error);

            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // ============================================================
    // VERIFICAR CORREO ELECTRÓNICO
    // ============================================================

    static async verifyEmail(req, res) {
        try {
            const { token } = req.body;

            if (!token || typeof token !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'El token de verificación es obligatorio'
                });
            }

            const tokenHash = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            const user = await User.findByEmailVerificationToken(tokenHash);

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'El enlace es inválido, ya fue utilizado o ha expirado. Solicita uno nuevo.'
                });
            }

            const verified = await User.verifyEmail(user.id);

            if (!verified) {
                return res.status(400).json({
                    success: false,
                    message: 'No fue posible verificar el correo. Solicita un nuevo enlace.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Tu correo electrónico fue verificado correctamente. Ya puedes iniciar sesión.'
            });

        } catch (error) {
            console.error('Error en verifyEmail:', error);

            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // ============================================================
    // REENVIAR CORREO DE VERIFICACIÓN
    // ============================================================

    static async resendVerification(req, res) {
        try {
            const { email } = req.body;

            if (!email || typeof email !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Debes proporcionar un correo electrónico válido'
                });
            }

            const user = await User.findByEmail(email);

            // Respuesta genérica para no revelar qué correos están registrados
            if (!user || user.email_verified) {
                return res.status(200).json({
                    success: true,
                    message: 'Si la cuenta existe y necesita verificación, recibirás un correo con las instrucciones.'
                });
            }

            const verificationToken = crypto.randomBytes(32).toString('hex');

            const tokenHash = crypto
                .createHash('sha256')
                .update(verificationToken)
                .digest('hex');

            const expiresAt = new Date(
                Date.now() + VERIFICATION_HOURS * 60 * 60 * 1000
            );

            await User.saveEmailVerificationToken(
                user.id,
                tokenHash,
                expiresAt
            );

            const verificationUrl =
                `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

             const safeFirstName = escapeHtml(user.first_name);

            const html = `
                <div style="font-family: Arial, sans-serif; background-color: #111111; padding: 40px 20px;">
                    <div style="max-width: 550px; margin: auto; background-color: #202020; padding: 35px; border-radius: 12px; color: #ffffff;">
                        <h1 style="color: #B8860B; text-align: center;">AURA BARBER STUDIO</h1>
                        <h2 style="text-align: center;">Verifica tu correo electrónico</h2>
                        <p>Hola ${safeFirstName},</p>
                        <p>Solicitaste un nuevo enlace para verificar tu cuenta.</p>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${verificationUrl}" style="background-color: #B8860B; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                VERIFICAR MI CORREO
                            </a>
                        </div>
                        <p style="color: #bbbbbb; font-size: 14px;">Este enlace vence en 24 horas.</p>
                    </div>
                </div>
            `;

            await sendEmail({
                to: email,
                subject: 'Nuevo enlace de verificación - Aura Barber Studio',
                text: `Hola ${user.first_name}, verifica tu correo mediante este enlace: ${verificationUrl}. El enlace vence en 24 horas.`,
                html
            });

            return res.status(200).json({
                success: true,
                message: 'Si la cuenta existe y necesita verificación, recibirás un correo con las instrucciones.'
            });

        } catch (error) {
            console.error('Error en resendVerification:', error);

            return res.status(500).json({
                success: false,
                message: 'No fue posible enviar el correo. Inténtalo nuevamente.'
            });
        }
    }


    // ============================================================
    // SOLICITAR RECUPERACIÓN DE CONTRASEÑA
    // ============================================================

    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email || typeof email !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Debes proporcionar un correo electrónico válido'
                });
            }

            const user = await User.findByEmail(email);

            // Respuesta genérica para no revelar cuentas registradas
            if (!user || !user.email_verified || !user.is_active) {
                return res.status(200).json({
                    success: true,
                    message: 'Si existe una cuenta asociada a ese correo, recibirás instrucciones para recuperar tu contraseña.'
                });
            }

            // Generar token seguro
            const resetToken = crypto.randomBytes(32).toString('hex');

            const tokenHash = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            const expiresAt = new Date(
                Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000
            );

            await User.savePasswordResetToken(
                user.id,
                tokenHash,
                expiresAt
            );

            const resetUrl =
                `${FRONTEND_URL}/reset-password?token=${resetToken}`;

            const safeFirstName = escapeHtml(user.first_name);

            const html = `
                <div style="font-family: Arial, sans-serif; background-color: #111111; padding: 40px 20px;">
                    <div style="max-width: 550px; margin: auto; background-color: #202020; padding: 35px; border-radius: 12px; color: #ffffff;">
                        <h1 style="color: #B8860B; text-align: center;">AURA BARBER STUDIO</h1>
                        <h2 style="text-align: center;">Recuperación de contraseña</h2>
                        <p>Hola ${safeFirstName},</p>
                        <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p>
                        <p>Haz clic en el siguiente botón para establecer una nueva contraseña:</p>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${resetUrl}" style="background-color: #B8860B; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                RESTABLECER CONTRASEÑA
                            </a>
                        </div>
                        <p style="color: #bbbbbb; font-size: 14px;">Este enlace vence en 30 minutos y solo puede utilizarse una vez.</p>
                        <p style="color: #bbbbbb; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este mensaje. Tu contraseña actual seguirá siendo la misma.</p>
                    </div>
                </div>
            `;

            const text = `
Hola ${user.first_name},

Recibimos una solicitud para cambiar la contraseña de tu cuenta de Aura Barber Studio.

Utiliza este enlace para establecer una nueva contraseña:

${resetUrl}

Este enlace vence en 30 minutos y solo puede utilizarse una vez.

Si no solicitaste este cambio, ignora este mensaje.
            `;

            await sendEmail({
                to: email,
                subject: 'Recuperación de contraseña - Aura Barber Studio',
                text,
                html
            });

            return res.status(200).json({
                success: true,
                message: 'Si existe una cuenta asociada a ese correo, recibirás instrucciones para recuperar tu contraseña.'
            });

        } catch (error) {
            console.error('Error en forgotPassword:', error);

            return res.status(500).json({
                success: false,
                message: 'No fue posible procesar la solicitud. Inténtalo nuevamente.'
            });
        }
    }


    // ============================================================
    // RESTABLECER CONTRASEÑA
    // ============================================================

    static async resetPassword(req, res) {
        try {
            const { token, password } = req.body;

            if (
                !token ||
                typeof token !== 'string' ||
                !password ||
                typeof password !== 'string'
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'El token y la nueva contraseña son obligatorios'
                });
            }

// Validar longitud de contraseña
if (password.length < 8 || password.length > 128) {
    return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener entre 8 y 128 caracteres'
    });
}

// Validar complejidad de contraseña
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!*?&])[A-Za-z\d@$!*?&]+$/;

if (!passwordRegex.test(password)) {
    return res.status(400).json({
        success: false,
        message: 'La contraseña debe contener al menos una minúscula, una mayúscula, un número y un carácter especial (@$!*?&)'
    });
}
            // Calcular hash del token recibido
            const tokenHash = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // Buscar usuario con token vigente
            const user = await User.findByPasswordResetToken(tokenHash);

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'El enlace es inválido, ya fue utilizado o ha expirado. Solicita uno nuevo.'
                });
            }

            // Encriptar nueva contraseña
            const hashedPassword = await bcrypt.hash(password, 12);

            // Actualizar contraseña y eliminar token
            const updated = await User.resetPassword(
                user.id,
                tokenHash,
                hashedPassword
            );

            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'El enlace es inválido, ya fue utilizado o ha expirado. Solicita uno nuevo.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión.'
            });

        } catch (error) {
            console.error('Error en resetPassword:', error);

            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }



    // ============================================================
    // LOGIN
    // ============================================================

    static async login(req, res) {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            const user = await User.findByEmailWithPassword(email);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    message: 'La cuenta se encuentra desactivada'
                });
            }

            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Comprobar verificación después de validar la contraseña
            if (!user.email_verified) {
                return res.status(403).json({
                    success: false,
                    requiresVerification: true,
                    message: 'Debes verificar tu correo electrónico antes de iniciar sesión.'
                });
            }

            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET || 'default_secret_key',
                {
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            );

            delete user.password;
            delete user.email_verification_token_hash;
            delete user.email_verification_expires_at;

            return res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: {
                    user,
                    token,
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            });

        } catch (error) {
            console.error('Error en login:', error);

            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // ============================================================
    // OBTENER PERFIL
    // ============================================================

    static async getProfile(req, res) {
        try {
            const userId = req.user.userId;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Perfil obtenido correctamente',
                data: user
            });

        } catch (error) {
            console.error('Error en getProfile:', error);

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // ============================================================
    // ACTUALIZAR PERFIL
    // ============================================================

    static async updateProfile(req, res) {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const userId = req.user.userId;

            const {
                first_name,
                last_name,                
                phone,
                currentPassword,
                newPassword
            } = req.body;

            const existingUser = await User.findByEmailWithPassword(
                req.user.email
            );

            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const updateData = {
                first_name,
                last_name,                
                phone
            };

            if (newPassword) {
                if (!currentPassword) {
                    return res.status(400).json({
                        success: false,
                        message: 'La contraseña actual es requerida para cambiar la contraseña'
                    });
                }

                const isCurrentPasswordValid = await bcrypt.compare(
                    currentPassword,
                    existingUser.password
                );

                if (!isCurrentPasswordValid) {
                    return res.status(401).json({
                        success: false,
                        message: 'Contraseña actual incorrecta'
                    });
                }

                updateData.password = await bcrypt.hash(newPassword, 12);
            }

            const updatedUser = await User.updateUser(userId, updateData);

            res.status(200).json({
                success: true,
                message: 'Perfil actualizado correctamente',
                data: updatedUser
            });

        } catch (error) {
            console.error('Error en updateProfile:', error);

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // ============================================================
    // RENOVAR TOKEN JWT
    // ============================================================

    static async refreshToken(req, res) {
        try {
            const userId = req.user.userId;
            const email = req.user.email;
            const role = req.user.role;

            const newToken = jwt.sign(
                {
                    userId,
                    email,
                    role
                },
                process.env.JWT_SECRET || 'default_secret_key',
                {
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            );

            res.status(200).json({
                success: true,
                message: 'Token renovado correctamente',
                data: {
                    token: newToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            });

        } catch (error) {
            console.error('Error en refreshToken:', error);

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // ============================================================
    // LOGOUT
    // ============================================================

    static async logout(req, res) {
        try {
            res.status(200).json({
                success: true,
                message: 'Logout exitoso',
                data: {
                    message: 'Token invalidado. Elimina el token del cliente.'
                }
            });

        } catch (error) {
            console.error('Error en logout:', error);

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = AuthController;
