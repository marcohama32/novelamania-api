const express = require("express");
const router = express.Router();
const {
  exportCharges,
  exportExpenses,
  exportCustomers,
  exportServices
} = require("../../controllers/report/reportController");
const {
  isAuthenticated,
  isAdmin,
  isTokenValid,
} = require("../../middleware/auth");

//@auth routes
// api/route
router.get("/charge/report/", exportCharges);

module.exports = router;
