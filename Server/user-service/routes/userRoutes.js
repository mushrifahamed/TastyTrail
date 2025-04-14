const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateMe,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const authMiddleware = require("../utils/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes (require authentication)
router.use(
  authMiddleware([
    "customer",
    "restaurant_admin",
    "delivery_personnel",
    "admin",
  ])
);

router.get("/me", getMe);
router.patch("/updateMe", updateMe);

// Admin-only routes
router.use(authMiddleware(["admin"]));

router.get("/", getAllUsers);
router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
