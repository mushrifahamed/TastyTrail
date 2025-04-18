const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const verifyToken = require('../middleware/authMiddleware');  // If you're using JWT authentication

// Add a new restaurant should have verifyToken
router.post('/', restaurantController.addRestaurant);

// Get nearby restaurants
router.get('/nearby', restaurantController.getNearbyRestaurants);

// Update restaurant availability should have verifyToken
router.put('/:id/availability', restaurantController.toggleAvailability);

// Accept an order should have verifyToken
router.post('/orders', restaurantController.acceptOrder);

// Manage menu (add/update/remove items) shoul have verify token
router.put('/:id/menu', restaurantController.manageMenu);

router.get('/search', restaurantController.searchRestaurants);

module.exports = router;