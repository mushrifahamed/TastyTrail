// src/routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrderWithSubOrders,
  updateSubOrderStatus,
  getCustomerOrders,
  getRestaurantOrders,
} = require("../controllers/orderController");
const authMiddleware = require("../utils/authMiddleware");

// Customer routes
router.post("/", authMiddleware(["customer"]), createOrder);
router.get(
  "/customer/:customerId",
  authMiddleware(["customer"]),
  getCustomerOrders
);
router.get(
  "/:id",
  authMiddleware(["customer", "restaurant_admin", "delivery_personnel"]),
  getOrderWithSubOrders
);

// Restaurant admin routes
router.patch(
  "/:id/suborders",
  authMiddleware(["restaurant_admin"]),
  updateSubOrderStatus
);
router.get(
  "/restaurant/:restaurantId",
  authMiddleware(["restaurant_admin"]),
  getRestaurantOrders
);

// Delivery personnel routes
router.patch(
  "/suborders/:subOrderId/status",
  authMiddleware(["delivery_personnel"]),
  updateSubOrderStatus
);

module.exports = router;
