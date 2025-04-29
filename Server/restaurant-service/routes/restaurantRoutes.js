const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurantController");
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../config/multerConfig");

const uploadFields = upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'menuItemImages', maxCount: 10 } // Adjust as needed
  ]);

// Add a new restaurant should have verifyToken
router.post('/', 
    (req, res, next) => {
        // Log incoming request for debugging
        console.log('Incoming restaurant data:', req.body);
        next();
    },
    uploadFields, 
    verifyToken(['admin', 'super_admin']), 
    restaurantController.addRestaurant
    );

// Get nearby restaurants
router.get("/nearby", restaurantController.getNearbyRestaurants);

// Add this near the top with other routes
router.get('/verify/:restaurantId', 
    restaurantController.verifyRestaurant
  );

// get by id
router.get("/:id", restaurantController.getRestaurantById);

// Update restaurant availability should have verifyToken
router.put("/:id/availability", restaurantController.toggleAvailability);

router.get("/", restaurantController.getAllRestaurants); // Add this route to get all restaurants

// Get restaurant availability (public)
router.get("/:id/availability", restaurantController.getRestaurantAvailability);

// Get restaurant details by ID (public)
//router.get("/:id", restaurantController.getRestaurantById);

// Menu Item Management Routes
router.post(
  "/:restaurantId/menu",
  upload.single("menuItemImage"),
  verifyToken(['admin', 'restaurant_admin']),
  restaurantController.addMenuItem
);

router.put(
  "/:restaurantId/menu/:menuItemId",
  upload.single("menuItemImage"),
  verifyToken(['admin', 'restaurant_admin']),
  restaurantController.updateMenuItem
);

router.delete(
  "/:restaurantId/menu/:menuItemId",
  verifyToken(['admin', 'restaurant_admin']),
  restaurantController.deleteMenuItem
);

// search restaurants
router.get("/search", restaurantController.searchRestaurants);

module.exports = router;
