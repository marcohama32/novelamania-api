const express = require("express");
const router = express.Router();
const {
  allUsers,
  findUserById,
  singleUserProfile,
  // editUser,
  deleteUser,
  desactiveUser,

} = require("../controllers/userController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

const upload = require("../middleware/upload");

//@auth routes
// api/route

router.get("/allusers", isAuthenticated, allUsers);
// router.put("/user/edit/:id", upload.single("avatar"), editUser);
router.put("/user/inactive/:id", isAuthenticated, desactiveUser);
// get user by id
// get user profile by id
router.get("/user/getuserbyid/:id", isAuthenticated, findUserById);
//user loged profile
router.get("/user/userprofile", isAuthenticated, singleUserProfile);

router.delete("/admin/user/delete/:id", isAuthenticated, isAdmin, deleteUser);

module.exports = router;