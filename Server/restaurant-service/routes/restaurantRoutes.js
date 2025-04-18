const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const verifyToken = require('../middleware/authMiddleware');

// Add a new restaurant should have verifyToken
router.post('/', restaurantController.addRestaurant);

// Get nearby restaurants
router.get('/nearby', restaurantController.getNearbyRestaurants);

// Update restaurant availability should have verifyToken
router.put('/:id/availability', restaurantController.toggleAvailability);

// Manage menu (add/update/remove items) shoul have verify token
router.put('/:id/menu', restaurantController.manageMenu);

// search restaurants
router.get('/search', restaurantController.searchRestaurants);

module.exports = router;