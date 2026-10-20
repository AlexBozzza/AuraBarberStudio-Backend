
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection } = require("./config/database");

const {
    validateJSON,
    sanitizeInput,
    validateContentType
} = require("./middleware/validation");

// Rutas
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const barberRoutes = require("./routes/barberRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const { startReminderService } = require("./services/reminderService");

const app = express();

const PORT = process.env.PORT || 3001;
const API_PREFIX = process.env.API_PREFIX || "/api/v1";

/* ==============================
   MIDDLEWARES
============================== */

app.use(express.json({ limit: "10mb" }));

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);

// Orígenes autorizados para acceder a la API
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://aura-barber-studio-frontend.vercel.app"
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Permitir peticiones sin Origin, por ejemplo,
            // algunas solicitudes entre servidores.
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error(`Origen no permitido por CORS: ${origin}`)
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

app.use(validateContentType);
app.use(sanitizeInput);
app.use(validateJSON);

/* ==============================
   LOG DE REQUESTS
============================== */

if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
        console.log(
            `${new Date().toISOString()} - ${req.method} ${req.url}`
        );

        next();
    });
}

/* ==============================
   RUTA PRINCIPAL
============================== */

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API Aura Barber Studio funcionando correctamente",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

/* ==============================
   HEALTH CHECK
============================== */

app.get("/health", async (req, res) => {
    try {
        const dbConnected = await testConnection();

        res.status(dbConnected ? 200 : 503).json({
            success: dbConnected,

            status: dbConnected
                ? "healthy"
                : "unhealthy",

            services: {
                database: dbConnected
                    ? "connected"
                    : "disconnected",

                server: "running"
            },

            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: "unhealthy",
            error: error.message
        });
    }
});

/* ==============================
   RUTAS API
============================== */

app.use(
    `${API_PREFIX}/users`,
    userRoutes
);

app.use(
    `${API_PREFIX}/auth`,
    authRoutes
);

app.use(
    `${API_PREFIX}/appointments`,
    appointmentRoutes
);

app.use(
    `${API_PREFIX}/services`,
    serviceRoutes
);

app.use(
    `${API_PREFIX}/barbers`,
    barberRoutes
);

app.use(
    `${API_PREFIX}/dashboard`,
    dashboardRoutes
);

app.use(
    `${API_PREFIX}/reviews`,
    reviewRoutes
);

/* ==============================
   DOCUMENTACIÓN
============================== */

app.get("/docs", (req, res) => {
    res.status(200).json({
        success: true,
        name: "Aura Barber Studio API",
        version: "1.0.0",

        baseUrl:
            `${req.protocol}://${req.get("host")}${API_PREFIX}`,

        endpoints: {
            users: `${API_PREFIX}/users`,
            auth: `${API_PREFIX}/auth`,
            appointments: `${API_PREFIX}/appointments`,
            services: `${API_PREFIX}/services`,
            barbers: `${API_PREFIX}/barbers`,
            reviews: `${API_PREFIX}/reviews`,
            health: "/health"
            
        }
    });
});

/* ==============================
   RUTA NO ENCONTRADA
============================== */

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
        requestedUrl: req.originalUrl
    });
});

/* ==============================
   MANEJO GLOBAL DE ERRORES
============================== */

app.use((err, req, res, next) => {
    console.error("Error global:", err);

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "JSON malformado"
        });
    }

    if (err.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Payload demasiado grande"
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: "Error interno del servidor",

        error:
            process.env.NODE_ENV === "production"
                ? "Algo salió mal en el servidor"
                : err.message,

        timestamp: new Date().toISOString()
    });
});

/* ==============================
   INICIAR SERVIDOR
============================== */

const initializeApp = async () => {
    try {
        console.log(
            "🔍 Verificando conexión a la base de datos..."
        );

        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error(
                "❌ No se pudo conectar a MySQL"
            );

            process.exit(1);
        }

        const server = app.listen(PORT, () => {
            console.log(
                "🚀 Servidor Aura Barber Studio iniciado"
            );

            console.log(
                `🌐 URL: http://localhost:${PORT}`
            );

            console.log(
                `📋 API: http://localhost:${PORT}${API_PREFIX}`
            );

            console.log(
                `💚 Health: http://localhost:${PORT}/health`
            );
            startReminderService();
        });

        process.on("SIGINT", () => {
            console.log("\n🛑 Cerrando servidor...");

            server.close(() => {
                console.log("✅ Servidor cerrado");
                process.exit(0);
            });
        });
    } catch (error) {
        console.error(
            "❌ Error al iniciar la aplicación:",
            error.message
        );

        process.exit(1);
    }
};

if (require.main === module) {
    initializeApp();
}

module.exports = app;
