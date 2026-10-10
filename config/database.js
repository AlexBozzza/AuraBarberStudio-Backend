/**
 * Configuración de conexión a la base de datos MySQL
 * Aura Barber Studio
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "aura_barber_studio",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

/**
 * Probar conexión con MySQL
 */
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();

        console.log("✅ Conexión a MySQL establecida correctamente");
        console.log(`📦 Base de datos: ${dbConfig.database}`);

        connection.release();

        return true;

    } catch (error) {

        console.error("❌ Error al conectar con MySQL:");
        console.error(error.message);

        return false;
    }
};

/**
 * Obtener una conexión del pool
 */
const getConnection = async () => {
    try {

        return await pool.getConnection();

    } catch (error) {

        console.error(
            "❌ Error al obtener conexión del pool:",
            error.message
        );

        throw error;
    }
};

/**
 * Cerrar el pool
 */
const closePool = async () => {
    try {

        await pool.end();

        console.log("🔌 Pool de conexiones cerrado");

    } catch (error) {

        console.error(
            "❌ Error al cerrar el pool:",
            error.message
        );
    }
};

module.exports = {
    pool,
    testConnection,
    getConnection,
    closePool
};