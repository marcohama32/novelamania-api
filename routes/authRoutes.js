const express = require("express");
const router = express.Router();
const {
  signup,
  getAllUsers,
  signin,
  // singleUser,
  logout,
  userProfile,
  forgotPassword,
  resetPassword,
  updateUser,

  deleteUser,

} = require("../controllers/authController");

const {
  allCustomers,
  allUsers,
} = require("../controllers/userController");


const {
  isAuthenticated,
  isAdmin,
  isTokenValid,
  checkSubscription,
  validate
} = require("../middleware/auth");

//@auth routes
// api/route
router.post("/user/signup", signup);
router.get("/user/admin/getall", allUsers);
// router.get("/user/getuserbyid/:id", singleUser);
router.put("/user/updateuser/:id", updateUser);
router.delete("/user/delete/:id", deleteUser);
router.get("/user/getallcustomers", allCustomers);




router.post("/signin", signin);

router.get("/logout", logout);
// router.get("/me", isAuthenticated, userProfile);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/check/verify-token/", isTokenValid);

// check subscription
router.get("/check/checkSubscription",checkSubscription);

// validate subscription
router.get("/validate/subscription",validate);

module.exports = router;
