/**
 * Controlador de Usuarios
 * @description Maneja todas las operaciones HTTP para la entidad Usuario
 */

const bcrypt = require('bcrypt');
const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * Clase que maneja las operaciones del controlador de usuarios
 */
class UserController {

    static async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;

            let result;

            if (search) {
                const users = await User.searchByName(search);

                result = {
                    users,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalUsers: users.length,
                        hasNextPage: false,
                        hasPrevPage: false
                    }
                };

            } else {

                result = await User.paginate(page, limit);
            }

            res.status(200).json({
                success: true,
                message: 'Usuarios obtenidos correctamente',
                data: result.users,
                pagination: result.pagination
            });

        } catch (error) {

            console.error('Error en getAllUsers:', error);

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }


    static async getUserById(req, res) {
        try {

            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Usuario obtenido correctamente',
                data: user
            });

        } catch (error) {

            console.error('Error en getUserById:', error);

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }


    static async createUser(req, res) {
        try {

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            // Datos desde el body
            const {
                first_name,
                last_name,
                email,
                phone,
                password
            } = req.body;

            // Validación extra por seguridad
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña es obligatoria'
                });
            }

            // Verificar email duplicado
            const existingUser = await User.findByEmail(email);

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            // Encriptar contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Crear usuario
            const newUser = await User.create({
                first_name,
                last_name,
                email,
                phone,
                password: hashedPassword
            });

            res.status(201).json({
                success: true,
                message: 'Usuario creado correctamente',
                data: newUser
            });

        } catch (error) {

            console.error('Error en createUser:', error);

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }


    static async updateUser(req, res) {
        try {

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { id } = req.params;

            const {
                first_name,
                last_name,
                email,
                phone
            } = req.body;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const existingUser = await User.findById(id);

            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            if (email !== existingUser.email) {

                const emailUser = await User.findByEmail(email);

                if (
                    emailUser &&
                    emailUser.id !== parseInt(id)
                ) {
                    return res.status(409).json({
                        success: false,
                        message: 'El email ya está registrado en otro usuario'
                    });
                }
            }

            const updatedUser = await User.updateUser(id, {
                first_name,
                last_name,
                email,
                phone
            });

            res.status(200).json({
                success: true,
                message: 'Usuario actualizado correctamente',
                data: updatedUser
            });

        } catch (error) {

            console.error('Error en updateUser:', error);

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }


    static async deleteUser(req, res) {
        try {

            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const existingUser = await User.findById(id);

            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            await User.delete(id);

            res.status(200).json({
                success: true,
                message: 'Usuario eliminado correctamente'
            });

        } catch (error) {

            console.error('Error en deleteUser:', error);

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }


    static async searchUsers(req, res) {
        try {

            const { q } = req.query;

            if (!q || q.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El parámetro de búsqueda es requerido'
                });
            }

            const users = await User.searchByName(q.trim());

            res.status(200).json({
                success: true,
                message: 'Búsqueda completada',
                data: users,
                count: users.length
            });

        } catch (error) {

            console.error('Error en searchUsers:', error);

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }


    static async getUserStats(req, res) {
        try {

            const total = await User.count();

            res.status(200).json({
                success: true,
                message: 'Estadísticas obtenidas correctamente',
                data: {
                    totalUsers: total,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {

            console.error('Error en getUserStats:', error);

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

module.exports = UserController;