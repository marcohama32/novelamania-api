const express = require('express');
const router = express.Router();
const { subscribePackage, createPackage, editPackage, getAllPackages, findPackageById, deletePackage } = require('../controllers/packageController');
const { checkSubscription, isAuthenticated, isAdmin } = require('../middleware/auth');

// 
router.post('/package/subscribe',isAuthenticated, subscribePackage);
// router.get('/check/subscription',isAuthenticated, checkSubscription);

// 
//@auth routes
// api/route
router.post(
    "/package/create",
    isAuthenticated,
    isAdmin,
    createPackage
  );
  router.put(
    "/package/edit/:id",
    isAuthenticated,
    isAdmin,
    editPackage
  );
  router.get("/package/getbyid/:id", isAuthenticated,checkSubscription, findPackageById);
  router.get("/package/getall", isAuthenticated,checkSubscription, getAllPackages);
  router.delete("/package/delete/:id", isAuthenticated,isAdmin, deletePackage);

module.exports = router;
