const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  // createNovel,
  // editNovel,
  // findNovelById,
  // getAllNovels,
  // deleteNovel,
  getDashboardData,
  getRecentAndTopViewedContents,
  getAllDoramas,
  getAllNovels,
  deleteContent,
  editContent,
  getAllContents,
  findContentById,
  createContent,
} = require("../controllers/contentController");
const {
  isAuthenticated,
  isAdmin,
  isTokenValid,
  checkSubscription
} = require("../middleware/auth");

//@auth routes
// api/route
router.post(
  "/novel/create",
  upload.single("image_url"),
  isAuthenticated,
  isAdmin,
  createContent
);
router.put(
  "/novel/edit/:id",
  upload.single("image_url"),
  isAuthenticated,
  isAdmin,
  editContent
);
router.get("/novel/getbyid/:id", checkSubscription,findContentById);
router.get("/novel/getall", getAllContents);
router.delete("/novel/delete/:id", isAuthenticated,isAdmin, deleteContent);

// Customer frontend dashboard
router.get("/content/getrecentandtopview", getRecentAndTopViewedContents);

router.get("/content/getonlynovels",getAllNovels);
router.get("/content/getonlydoramas",getAllDoramas);

//admin dashboard
router.get("/admin/dashboard", isAuthenticated,isAdmin, getDashboardData);
module.exports = router;
