const express = require("express");

const DashboardController =
    require("../controllers/dashboardController");

const {
    authenticateToken
} = require("../middleware/auth");

const router = express.Router();


// ==========================================
// DASHBOARD
// ==========================================

router.get(
    "/",
    authenticateToken,
    DashboardController.getDashboard
);


module.exports = router;