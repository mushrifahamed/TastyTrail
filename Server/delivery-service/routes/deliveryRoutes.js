const express = require('express');
const router = express.Router();
const { assignDelivery, getDeliveryStatus, updateOrderStatus, getOrderDetails, getDeliveredOrdersByDriver } = require('../controllers/deliveryController');

// Route to assign a delivery to a driver
router.post('/assign', assignDelivery);

// Route to get the current status of a delivery
router.get('/status/:orderId', getDeliveryStatus);

// Route to update the status of an order
router.put('/update-status', updateOrderStatus);  // Method for updating the status of an order


router.get('/order/:orderId', getOrderDetails);

// Route to get all delivered orders of a specific delivery person
router.get('/delivered/:driverId', getDeliveredOrdersByDriver);

module.exports = router;
