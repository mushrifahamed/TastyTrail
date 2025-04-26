const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  checkoutCart,
  checkoutRestaurant,
} = require("../controllers/cartController");
const authMiddleware = require("../utils/authMiddleware");

// All cart routes require customer authentication
router.use(authMiddleware(["customer"]));

// Cart routes
router.get("/", getCart);
router.post("/items", addToCart);
router.patch("/items", updateCartItem);
router.delete("/items/:itemId", removeFromCart);
router.delete("/", clearCart);
router.post("/checkout", checkoutRestaurant);

module.exports = router;
