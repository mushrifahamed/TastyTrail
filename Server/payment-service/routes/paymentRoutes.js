const express = require("express");
const router = express.Router();
const {
  createPayment,
  processNotification,
  getPaymentById,
  getPaymentByOrderId,
  getPaymentsByCustomerId,
  processRefund,
  storePaymentDetails,
} = require("../controllers/paymentController");
const authMiddleware = require("../utils/authMiddleware");

// Create a new payment (internal service call)
router.post(
  "/",
  authMiddleware(["customer", "restaurant_admin", "admin", "internal_service"]),
  createPayment
);

router.post(
  "/store",
  authMiddleware(["customer", "restaurant_admin", "admin", "internal_service"]),
  storePaymentDetails
);

// Process payment notification from PayHere (no auth - public endpoint)
router.post("/notify", processNotification);

// Get payment by ID
router.get(
  "/:id",
  authMiddleware(["customer", "restaurant_admin", "admin", "internal_service"]),
  getPaymentById
);

// Get payment by order ID
router.get(
  "/order/:orderId",
  authMiddleware(["customer", "restaurant_admin", "admin", "internal_service"]),
  getPaymentByOrderId
);

// Get payments by customer ID
router.get(
  "/customer/:customerId",
  authMiddleware(["customer", "admin", "internal_service"]),
  getPaymentsByCustomerId
);

// Process refund
router.post(
  "/refund",
  authMiddleware(["admin", "restaurant_admin", "internal_service"]),
  processRefund
);

module.exports = router;
