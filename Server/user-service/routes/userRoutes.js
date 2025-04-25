const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const {
  verifyToken,
  // Admin
  createAdmin,

  // Restaurant Admin
  //requestRestaurantAdminAccess,
  //approveRestaurantAdmin,
  createRestaurantAdmin,  // <-- Import the new controller for creating restaurant admin
  getAdminsByRestaurant,
  
  // Customer
  registerCustomer,

  // Delivery
  registerDeliveryPerson,
  approveDeliveryPerson,

  // Common
  login,
  getMe,
  updateMe,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const authMiddleware = require("../utils/authMiddleware");

// ==================== PUBLIC ROUTES ====================
// Restaurant admin request access
//router.post("/restaurant-admin/request", requestRestaurantAdminAccess);

// Customer registration
router.post("/customers/register", registerCustomer);

// Delivery personnel registration
router.post(
  "/delivery/register",
  upload.array("documents", 3),
  registerDeliveryPerson
);

// Login (all roles)
router.post("/login", login);

// ==================== AUTHENTICATED USER ROUTES ====================
// These routes require any authenticated user (customer, admin, etc.)
router.use(
  authMiddleware([
    "customer",
    "restaurant_admin",
    "delivery_personnel",
    "admin",
  ])
);

// Profile management (must come BEFORE any parameterized routes)
router.get("/me", getMe);
router.patch("/update-me", updateMe);
router.get('/verify-token', verifyToken);

// ==================== ADMIN PROTECTED ROUTES ====================
// These routes require admin role
router.use(authMiddleware(["admin"]));

// Admin user management
router.post("/admins", createAdmin);
//router.patch("/restaurant-admin/approve", approveRestaurantAdmin);
router.patch("/delivery/approve", approveDeliveryPerson);

// User management
router.get("/", getAllUsers);
router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

// ==================== RESTAURANT ADMIN CREATION ROUTE ====================

// Add these routes
router.get('/restaurant/:restaurantId/admins', 
  authMiddleware(['admin']), 
  getAdminsByRestaurant
);

router.post('/restaurant-admin', 
  authMiddleware(['admin']), 
  createRestaurantAdmin
);

module.exports = router;