const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrderWithSubOrders,
  updateSubOrderStatus,
  getCustomerOrders,
  getRestaurantOrders,
  updateOrderStatus,
  getDeliveryPersonOrders,
  getDeliveryOrder,
  updateOrderPaymentStatus,
  getAllOrders,
} = require("../controllers/orderController");
const authMiddleware = require("../utils/authMiddleware");

const { quickCreateOrder } = require('../controllers/quickOrderController');

// POST /api/quick-order
router.post('/quick-order', quickCreateOrder);

// Customer routes
router.post("/", authMiddleware(["customer"]), createOrder);
router.get(
  "/customer/:customerId",
  authMiddleware(["customer"]),
  getCustomerOrders
);
router.get(
  "/:id",
  authMiddleware([
    "customer",
    "restaurant_admin",
    "delivery_personnel",
    "internal_service",
  ]),
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

// Order tracking routes
router.patch(
  "/:orderId/status",
  authMiddleware(["restaurant_admin", "delivery_personnel", "admin"]),
  updateOrderStatus
);

// Delivery personnel routes
router.patch(
  "/suborders/:subOrderId/status",
  authMiddleware(["delivery_personnel"]),
  updateSubOrderStatus
);

router.get(
  "/delivery/assigned",
  authMiddleware(["delivery_personnel"]),
  getDeliveryPersonOrders
);

router.get(
  "/delivery/order/:id",
  authMiddleware(["delivery_personnel"]),
  getDeliveryOrder
);

router.post(
  "/:orderId/payment-update",
  authMiddleware(["internal_service"]),
  updateOrderPaymentStatus
);

router.get("/", authMiddleware(["restaurant_admin", "admin"]), getAllOrders); // You can modify roles as needed

module.exports = router;
