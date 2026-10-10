/**
 * Controlador de Autenticación
 * @description Maneja las operaciones de registro, login y autenticación
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * Clase que maneja las operaciones de autenticación
 */
class AuthController {

    /**
     * Registra un nuevo usuario
     */
    static async register(req, res) {
        try {
            // Verificar errores de validación
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

            // Verificar si el email ya existe
            const existingUser = await User.findByEmail(email);

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            // Hashear la contraseña
            const saltRounds = 12;

            const hashedPassword = await bcrypt.hash(
                password,
                saltRounds
            );

            // Crear el usuario
            const newUser = await User.create({
                first_name,
                last_name,
                email,
                phone,
                password: hashedPassword
            });

            // Generar JWT token
            const token = jwt.sign(
                {
                    userId: newUser.id,
                    email: newUser.email
                },
                process.env.JWT_SECRET || 'default_secret_key',
                {
                    expiresIn:
                        process.env.JWT_EXPIRES_IN || '24h'
                }
            );

            res.status(201).json({
                success: true,
                message: 'Usuario registrado correctamente',
                data: {
                    user: newUser,
                    token,
                    expiresIn:
                        process.env.JWT_EXPIRES_IN || '24h'
                }
            });

        } catch (error) {

            console.error('Error en register:', error);

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }


    /**
     * Autentica un usuario (login)
     */
    static async login(req, res) {
        try {

            // Verificar errores de validación
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            // Buscar usuario por email con contraseña
            const user =
                await User.findByEmailWithPassword(email);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Comprobar si la cuenta está activa
            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    message: 'La cuenta se encuentra desactivada'
                });
            }

            // Verificar contraseña
            const isPasswordValid =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Generar JWT
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET || 'default_secret_key',
                {
                    expiresIn:
                        process.env.JWT_EXPIRES_IN || '24h'
                }
            );

            // Nunca enviar contraseña al frontend
            delete user.password;

            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: {
                    user,
                    token,
                    expiresIn:
                        process.env.JWT_EXPIRES_IN || '24h'
                }
            });

        } catch (error) {

            console.error('Error en login:', error);

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }


    /**
     * Obtiene el perfil del usuario autenticado
     */
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
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }


    /**
     * Actualiza el perfil del usuario autenticado
     */
    static async updateProfile(req, res) {
        try {

            // Verificar errores de validación
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
                email,
                phone,
                currentPassword,
                newPassword
            } = req.body;

            // Obtener usuario con contraseña
            const existingUser =
                await User.findByEmailWithPassword(
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
                email,
                phone
            };

            // Si se desea cambiar contraseña
            if (newPassword) {

                if (!currentPassword) {
                    return res.status(400).json({
                        success: false,
                        message:
                            'La contraseña actual es requerida para cambiar la contraseña'
                    });
                }

                const isCurrentPasswordValid =
                    await bcrypt.compare(
                        currentPassword,
                        existingUser.password
                    );

                if (!isCurrentPasswordValid) {
                    return res.status(401).json({
                        success: false,
                        message:
                            'Contraseña actual incorrecta'
                    });
                }

                const saltRounds = 12;

                updateData.password =
                    await bcrypt.hash(
                        newPassword,
                        saltRounds
                    );
            }

            // Actualizar usuario
            const updatedUser =
                await User.updateUser(
                    userId,
                    updateData
                );

            res.status(200).json({
                success: true,
                message:
                    'Perfil actualizado correctamente',
                data: updatedUser
            });

        } catch (error) {

            console.error(
                '❌ Error en updateProfile:',
                error
            );

            res.status(500).json({
                success: false,
                message:
                    'Error interno del servidor',
                error: error.message
            });
        }
    }


    /**
     * Renueva el token JWT
     */
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
                    expiresIn:
                        process.env.JWT_EXPIRES_IN || '24h'
                }
            );

            res.status(200).json({
                success: true,
                message: 'Token renovado correctamente',
                data: {
                    token: newToken,
                    expiresIn:
                        process.env.JWT_EXPIRES_IN || '24h'
                }
            });

        } catch (error) {

            console.error(
                'Error en refreshToken:',
                error
            );

            res.status(500).json({
                success: false,
                message:
                    'Error interno del servidor',
                error: error.message
            });
        }
    }


    /**
     * Logout
     */
    static async logout(req, res) {
        try {

            res.status(200).json({
                success: true,
                message: 'Logout exitoso',
                data: {
                    message:
                        'Token invalidado. Elimina el token del cliente.'
                }
            });

        } catch (error) {

            console.error(
                'Error en logout:',
                error
            );

            res.status(500).json({
                success: false,
                message:
                    'Error interno del servidor',
                error: error.message
            });
        }
    }
}

module.exports = AuthController;