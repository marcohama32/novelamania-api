const express = require("express");
const router = express.Router();
const {
  createEpisode,
  editEpisode,
  findEpisodelById,
  getAllEpisodes,
  deleteEpisode,
  findEpisodesBySeasonId
} = require("../controllers/episodeController.js");
const {
  isAuthenticated,
  isAdmin,
  isTokenValid,
  checkSubscription
} = require("../middleware/auth");

//@auth routes
// api/route
router.post("/episode/create", isAuthenticated, isAdmin, createEpisode);
router.put(
  "/episode/edit/:id",
  isAuthenticated,
  isAdmin,
  editEpisode
);
router.get("/episode/getbyid/:id", isAuthenticated,checkSubscription, findEpisodelById);
router.get('/episodes/season/:seasonId',isAuthenticated,checkSubscription, findEpisodesBySeasonId);
router.get("/episode/getall", isAuthenticated,checkSubscription, getAllEpisodes);
router.delete("/episode/delete/:id", isAuthenticated, isAdmin, deleteEpisode);

module.exports = router;
