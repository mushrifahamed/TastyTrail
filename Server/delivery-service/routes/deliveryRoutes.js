const express = require('express');
const router = express.Router();
const { assignDelivery, getDeliveryStatus, updateOrderStatus } = require('../controllers/deliveryController');

// Route to assign a delivery to a driver
router.post('/assign', assignDelivery);

// Route to get the current status of a delivery
router.get('/status/:orderId', getDeliveryStatus);

// Route to update the status of an order
router.put('/update-status', updateOrderStatus);  // Method for updating the status of an order

module.exports = router;
