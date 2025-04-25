const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig');

// Routes that require a valid JWT token and verify the role

// Add a new restaurant (admin only)

// Use fields instead of separate single/array
const uploadFields = upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'menuItemImages', maxCount: 10 } // Adjust as needed
  ]);
  
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

// Get nearby restaurants (public)
router.get('/nearby', restaurantController.getNearbyRestaurants);

// Update restaurant availability (admin and restaurant admin only)
router.put('/:id/availability', verifyToken(['admin', 'restaurant_admin']), restaurantController.toggleAvailability);

// Get restaurant availability (public)
router.get("/:id/availability", restaurantController.getRestaurantAvailability);

// Get restaurant details by ID (public)
router.get("/:id", restaurantController.getRestaurantById);

router.get("/", restaurantController.getAllRestaurants); // Add this route to get all restaurants

// Manage menu items (admin and restaurant admin only)
router.put('/:id/menu', upload.single('menuItemImage'), verifyToken(['admin', 'restaurant_admin']), restaurantController.manageMenu);

// Search restaurants by filters (public)
router.get('/search', restaurantController.searchRestaurants);

module.exports = router;