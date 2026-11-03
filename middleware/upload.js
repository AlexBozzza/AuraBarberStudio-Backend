
const multer = require("multer");

// Almacenar temporalmente la imagen en memoria.
// No se guardan archivos en el disco del servidor.
const storage = multer.memoryStorage();

// Configuración de subida
const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024, // Máximo 5 MB
        files: 1
    },

    fileFilter: (req, file, callback) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return callback(
                new Error("Solo se permiten imágenes JPG, PNG o WEBP")
            );
        }

        callback(null, true);
    }
});

module.exports = upload;
