const Dashboard = require("../models/Dashboard");

class DashboardController {

    // ==========================================
    // OBTENER DATOS DEL DASHBOARD
    // ==========================================

    static async getDashboard(req, res) {

        try {

            const dashboard =
                await Dashboard.getDashboard();

            res.status(200).json({

                success: true,

                data: dashboard

            });

        } catch (error) {

            console.error(
                "Error al obtener datos del dashboard:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Error al obtener los datos del dashboard"

            });

        }
    }
}

module.exports = DashboardController;