const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurantController");
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../config/multerConfig");

// Add a new restaurant should have verifyToken
router.post(
  "/",
  upload.single("coverImage"),
  upload.array("menuItemImages"),
  restaurantController.addRestaurant
);

// get by id
router.get("/:id", restaurantController.getRestaurantById);

// Get nearby restaurants
router.get("/nearby", restaurantController.getNearbyRestaurants);

// Update restaurant availability should have verifyToken
router.put("/:id/availability", restaurantController.toggleAvailability);

// Manage menu (add/update/remove items) shoul have verify token
router.put(
  "/:id/menu",
  upload.single("menuItemImage"),
  restaurantController.manageMenu
);

// search restaurants
router.get("/search", restaurantController.searchRestaurants);

// check availability
router.get("/:id/availability", restaurantController.getRestaurantAvailability);

module.exports = router;
