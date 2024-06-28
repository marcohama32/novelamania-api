const express = require("express");
const router = express.Router();
const {
  createSeason,
  editSeason,
  findSeasonById,
  getAllSeasons,
  deleteSeason,
} = require("../controllers/seasonController");
const {
  isAuthenticated,
  isAdmin,
  isTokenValid,
  checkSubscription
} = require("../middleware/auth");

//@auth routes
// api/route
router.post("/season/create", isAuthenticated, isAdmin, createSeason);
router.put("/season/edit/:id", isAuthenticated, isAdmin, editSeason);
router.get("/season/getbyid/:id", isAuthenticated, checkSubscription, findSeasonById);
router.get("/season/getall", isAuthenticated, checkSubscription, getAllSeasons);
router.delete("/season/delete/:id", isAuthenticated, isAdmin, deleteSeason);

module.exports = router;
