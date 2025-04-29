

==================================================
ROUTES
==================================================



/* Service: server */
/* File: deliveryRoutes.js */
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



/* Service: server */
/* File: notificationRoutes.js */
const express = require("express");
const router = express.Router();
const controller = require("../controllers/notificationController");

router.post("/register", controller.registerToken);
router.post("/sendToUser", controller.sendToUser);
router.post("/broadcast", controller.broadcast);

module.exports = router;



/* Service: server */
/* File: cartRoutes.js */
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



/* Service: server */
/* File: orderRoutes.js */
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

module.exports = router;



/* Service: server */
/* File: paymentRoutes.js */
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



/* Service: server */
/* File: restaurantRoutes.js */
const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurantController");
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../config/multerConfig");

const uploadFields = upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'menuItemImages', maxCount: 10 } // Adjust as needed
  ]);

// Add a new restaurant should have verifyToken
router.post('/', 
    (req, res, next) => {
        // Log incoming request for debugging
        console.log('Incoming restaurant data:', req.body);
        next();
    },
    uploadFields, 
    verifyToken(['admin', 'super_admin']), 
    restaurantController.addRestaurant
    );

// Get nearby restaurants
router.get("/nearby", restaurantController.getNearbyRestaurants);

// Add this near the top with other routes
router.get('/verify/:restaurantId', 
    restaurantController.verifyRestaurant
  );

// get by id
router.get("/:id", restaurantController.getRestaurantById);

// Update restaurant availability should have verifyToken
router.put("/:id/availability", restaurantController.toggleAvailability);

router.get("/", restaurantController.getAllRestaurants); // Add this route to get all restaurants

// Get restaurant availability (public)
router.get("/:id/availability", restaurantController.getRestaurantAvailability);

// Get restaurant details by ID (public)
//router.get("/:id", restaurantController.getRestaurantById);

// Menu Item Management Routes
router.post(
  "/:restaurantId/menu",
  upload.single("menuItemImage"),
  verifyToken(['admin', 'restaurant_admin']),
  restaurantController.addMenuItem
);

router.put(
  "/:restaurantId/menu/:menuItemId",
  upload.single("menuItemImage"),
  verifyToken(['admin', 'restaurant_admin']),
  restaurantController.updateMenuItem
);

router.delete(
  "/:restaurantId/menu/:menuItemId",
  verifyToken(['admin', 'restaurant_admin']),
  restaurantController.deleteMenuItem
);

// search restaurants
router.get("/search", restaurantController.searchRestaurants);

module.exports = router;



/* Service: server */
/* File: userRoutes.js */
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
  removeRestaurantAdmin,
  
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

// ==================== RESTAURANT ADMIN ROUTEs ====================

router.post('/restaurant-admin', 
  authMiddleware(['admin']), 
  createRestaurantAdmin
);

router.get('/restaurant/:restaurantId/admins', 
  authMiddleware(['admin']), 
  getAdminsByRestaurant
);

router.delete('/restaurant-admin/:adminId', 
  authMiddleware(['admin']), 
  removeRestaurantAdmin
);

module.exports = router;


==================================================
CONTROLLERS
==================================================



/* Service: server */
/* File: deliveryController.js */
const Order = require('../models/orders');
const DeliveryPerson = require('../models/deliveryPerson');

const assignDelivery = async (req, res) => {
    const { orderId, requiredVehicleType } = req.body;
  
    try {
      // Find the order by ID
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).send({ message: 'Order not found' });
      }
  
      // Find the available delivery person with the required vehicle type
      const availableDriver = await DeliveryPerson.findOne({ 
        availability: true,
        vehicleType: requiredVehicleType,
      });
  
      if (!availableDriver) {
        return res.status(400).send({ message: 'No available delivery personnel with the required vehicle type' });
      }
  
      // Assign delivery to the driver
      order.deliveryPersonId = availableDriver._id;
      order.status = 'Assigned';
      await order.save();
  
      // Update the delivery person's availability
      availableDriver.availability = false;
      await availableDriver.save();
  
      res.status(200).send({ message: 'Delivery assigned', order });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Internal server error' });
    }
  };

  // Get the current status of an order
const getDeliveryStatus = async (req, res) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
  
    if (!order) {
      return res.status(404).send({ message: 'Order not found' });
    }
  
    res.status(200).send({ orderId, status: order.status });
  };
  
  // Update the status of an order (e.g., when delivery person accepts, starts delivery, etc.)
  const updateOrderStatus = async (req, res) => {
    const { orderId, newStatus } = req.body;
  
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).send({ message: 'Order not found' });
      }
  
      // Ensure the new status is valid
      const validStatuses = ['Pending', 'Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'];
      if (!validStatuses.includes(newStatus)) {
        return res.status(400).send({ message: 'Invalid status' });
      }
  
      // Update the order status
      order.status = newStatus;
      await order.save();
  
      // Broadcast status update to clients using Socket.io (optional, for real-time updates)
      io.emit('statusUpdate', { orderId, newStatus }); 
  
      res.status(200).send({ message: 'Order status updated', order });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Internal server error' });
    }
  };

  module.exports = {
    assignDelivery,
    getDeliveryStatus,
    updateOrderStatus,
  };

  
  



/* Service: server */
/* File: notificationController.js */
const Token = require("../models/Token");
const { sendNotification } = require("../services/fcmService");

// Register token
exports.registerToken = async (req, res) => {
  const { userId, token, role } = req.body;

  if (!userId || !token || !role) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const existing = await Token.findOne({ userId, role });
  if (existing) {
    existing.token = token;
    existing.updatedAt = new Date();
    await existing.save();
  } else {
    await Token.create({ userId, token, role });
  }

  res.json({ message: "Token registered successfully" });
};

// Send to a specific user
exports.sendToUser = async (req, res) => {
  const { userId, role, title, body, data } = req.body;

  const user = await Token.findOne({ userId, role });
  if (!user) return res.status(404).json({ message: "Token not found" });

  try {
    await sendNotification(user.token, title, body, data);
    res.json({ message: "Notification sent" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send", error: err.message });
  }
};

// Broadcast to all users by role
exports.broadcast = async (req, res) => {
  const { role, title, body, data } = req.body;

  const users = await Token.find({ role });
  let results = [];

  for (const user of users) {
    try {
      const res = await sendNotification(user.token, title, body, data);
      results.push({ userId: user.userId, result: res });
    } catch (err) {
      results.push({ userId: user.userId, error: err.message });
    }
  }

  res.json({ message: "Broadcast complete", results });
};



/* Service: server */
/* File: cartController.js */
const Cart = require("../models/Cart");
const restaurantService = require("../services/restaurantService");
const userService = require("../services/userService");
const paymentService = require("../services/paymentService");
const estimationService = require("../services/estimationService");
const orderSplitter = require("../services/orderSplitter");
const Order = require("../models/Order");
const amqp = require("amqplib/callback_api");

// Function to publish the order created event to RabbitMQ
const publishOrderCreatedEvent = (orderId) => {
  amqp.connect("amqp://localhost", (error, connection) => {
    if (error) {
      console.error("RabbitMQ connection error:", error);
      return;
    }

    connection.createChannel((error, channel) => {
      if (error) {
        console.error("RabbitMQ channel error:", error);
        return;
      }

      const queue = "order_created_queue";
      const msg = JSON.stringify({ orderId });

      channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(msg), { persistent: true });

      console.log(`Order Created Event Sent: ${msg}`);
    });

    setTimeout(() => {
      connection.close();
    }, 500);
  });
};

// Get cart contents
const getCart = async (req, res, next) => {
  try {
    const customerId = req.user.id;

    let cart = await Cart.findOne({ customerId });
    if (!cart) {
      cart = new Cart({ customerId, items: [] });
      await cart.save();
    }

    res.status(200).json(cart);
  } catch (error) {
    next(error);
  }
};

// Add item to cart
const addToCart = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { restaurantId, menuItemId, name, price, quantity } = req.body;

    // Validate restaurant availability
    const restaurantAvailability =
      await restaurantService.getRestaurantAvailability(restaurantId);
    if (!restaurantAvailability.isAvailable) {
      return res
        .status(400)
        .json({ message: "Restaurant is not available for orders" });
    }

    let cart = await Cart.findOne({ customerId });
    if (!cart) {
      cart = new Cart({ customerId, items: [] });
    }

    // Check if cart already has items from a different restaurant
    const existingRestaurantIds = [
      ...new Set(cart.items.map((item) => item.restaurantId.toString())),
    ];
    if (
      existingRestaurantIds.length > 0 &&
      !existingRestaurantIds.includes(restaurantId.toString())
    ) {
      // We'll still allow adding the item, but include a warning
      cart.items.push({ restaurantId, menuItemId, name, price, quantity });
      await cart.save();

      return res.status(200).json({
        cart,
        warning:
          "Your cart now contains items from multiple restaurants. These will be processed as separate orders during checkout.",
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.menuItemId.toString() === menuItemId &&
        item.restaurantId.toString() === restaurantId
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({ restaurantId, menuItemId, name, price, quantity });
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    next(error);
  }
};

// Update cart item quantity
const updateCartItem = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { itemId, quantity } = req.body;

    const cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    next(error);
  }
};

// Remove item from cart
const removeFromCart = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    next(error);
  }
};

// Clear cart
const clearCart = async (req, res, next) => {
  try {
    const customerId = req.user.id;

    const cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully", cart });
  } catch (error) {
    next(error);
  }
};

// Convert cart to order(s)
const checkoutCart = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { deliveryAddress, deliveryLocation } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    console.log("checkoutCart", req.body);

    const cart = await Cart.findOne({ customerId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Get customer info from user service
    let customerInfo;
    try {
      customerInfo = await userService.getUserInfo(customerId, token);
    } catch (error) {
      console.error("Failed to get user info, using fallback data:", error);
      customerInfo = {
        name: "Customer",
        phone: "Unknown",
      };
    }

    // Group cart items by restaurant
    const itemsByRestaurant = {};
    cart.items.forEach((item) => {
      if (!itemsByRestaurant[item.restaurantId]) {
        itemsByRestaurant[item.restaurantId] = [];
      }
      itemsByRestaurant[item.restaurantId].push(item);
    });

    // Create separate orders for each restaurant
    const orderPromises = Object.keys(itemsByRestaurant).map(
      async (restaurantId) => {
        const restaurantItems = itemsByRestaurant[restaurantId];

        // Calculate total amount for this restaurant's items
        const totalAmount = orderSplitter.calculateOrderTotal(restaurantItems);

        console.log("rest items", restaurantItems);

        // Calculate estimated delivery time
        const estimatedTime = await estimationService.calculateEstimatedTime(
          restaurantItems,
          deliveryLocation,
          [restaurantId]
        );

        // Create order for this restaurant
        const order = new Order({
          customerId,
          customerInfo: {
            name: customerInfo.name || "Customer",
            phone: customerInfo.phone || "Unknown",
          },
          items: restaurantItems,
          deliveryAddress,
          deliveryLocation,
          totalAmount,
          paymentStatus: "pending",
          estimatedDeliveryTime: estimatedTime,
          trackingStatus: "placed",
          statusUpdates: [
            {
              status: "placed",
              timestamp: Date.now(),
              note: "Order placed successfully",
            },
          ],
          restaurantId,
        });

        // Save the order
        const savedOrder = await order.save();

        // Initiate payment process for this order
        const paymentResponse = await paymentService.createPayment(
          savedOrder._id,
          totalAmount,
          customerId,
          `Order #${savedOrder._id} for restaurant ${restaurantId}`,
          token
        );

        // Update order with payment ID
        savedOrder.paymentId = paymentResponse.paymentId;
        await savedOrder.save();

        return {
          order: savedOrder,
          payment: {
            paymentId: paymentResponse.paymentId,
            checkoutUrl: paymentResponse.checkoutUrl,
            paymentParams: paymentResponse.paymentParams,
          },
        };
      }
    );

    // Wait for all orders to be created
    const results = await Promise.all(orderPromises);

    // Clear cart after successful orders
    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: `Created ${results.length} orders from your cart`,
      orders: results,
    });
  } catch (error) {
    next(error);
  }
};

// Checkout items from a specific restaurant only - NEW FUNCTION
const checkoutRestaurant = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { restaurantId, deliveryAddress, paymentMethod } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!req.body.deliveryLocation || !req.body.deliveryLocation.coordinates) {
      return res.status(400).json({
        message: "Delivery location coordinates are required",
      });
    }

    if (!deliveryAddress) {
      console.log("Delivery address is required");
      return res.status(400).json({ message: "Delivery address is required" });
    }

    // Use default delivery location if not provided
    const deliveryLocation = req.body.deliveryLocation || { lat: 0, lng: 0 };

    const cart = await Cart.findOne({ customerId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Filter for items only from the specified restaurant
    const restaurantItems = cart.items.filter(
      (item) => item.restaurantId.toString() === restaurantId.toString()
    );

    if (restaurantItems.length === 0) {
      return res.status(400).json({
        message: "No items found for this restaurant in your cart",
      });
    }

    // Get customer info from user service
    let customerInfo;
    try {
      customerInfo = await userService.getUserInfo(customerId, token);
    } catch (error) {
      console.error("Failed to get user info, using fallback data:", error);
      customerInfo = {
        name: "Customer",
        phone: "Unknown",
      };
    }

    // Calculate total amount for this restaurant's items
    const totalAmount = orderSplitter.calculateOrderTotal(restaurantItems);

    console.log("rest items", restaurantItems);

    console.log("Delivery location:", deliveryLocation);

    // Calculate estimated delivery time
    const estimatedTime = await estimationService.calculateEstimatedTime(
      restaurantItems,
      deliveryLocation,
      restaurantId
    );

    console.log("estimated time", estimatedTime);

    // Create order for this restaurant
    const order = new Order({
      customerId,
      customerInfo: {
        name: customerInfo.name || "Customer",
        phone: customerInfo.phone || "Unknown",
      },
      items: restaurantItems,
      deliveryAddress,
      deliveryLocation,
      totalAmount,
      paymentStatus: "pending",
      paymentType: paymentMethod,
      estimatedDeliveryTime: estimatedTime,
      trackingStatus: "placed",
      statusUpdates: [
        {
          status: "placed",
          timestamp: Date.now(),
          note: "Order placed successfully",
        },
      ],
      restaurantId,
    });

    // Save the order
    const savedOrder = await order.save();

    // Initiate payment process for this order
    const paymentResponse = await paymentService.createPayment(
      savedOrder._id,
      totalAmount,
      customerId,
      `Order #${savedOrder._id} for restaurant ${restaurantId}`,
      token,
      paymentMethod
    );

    // Update order with payment ID
    savedOrder.paymentId = paymentResponse.paymentId;
    await savedOrder.save();

    // Publish the order created event to RabbitMQ
    publishOrderCreatedEvent(savedOrder._id);

    // IMPORTANT FIX: Remove ONLY the items from this restaurant
    cart.items = cart.items.filter(
      (item) => item.restaurantId.toString() !== restaurantId.toString()
    );
    await cart.save();

    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder,
      payment: {
        paymentId: paymentResponse.paymentId,
        checkoutUrl: paymentResponse.checkoutUrl,
        paymentParams: paymentResponse.paymentParams,
      },
      cart: cart,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  checkoutCart,
  checkoutRestaurant, // Export the new function
};



/* Service: server */
/* File: orderController.js */
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const axios = require("axios");
const orderSplitter = require("../services/orderSplitter");
const restaurantService = require("../services/restaurantService");
const paymentService = require("../services/paymentService");
const notificationService = require("../services/notificationService");
const estimationService = require("../services/estimationService");
const userService = require("../services/userService");
const { RESTAURANT_SERVICE_URL } = process.env;
const amqp = require("amqplib/callback_api");

// Function to publish an event to RabbitMQ
// Function to publish the order created event to RabbitMQ
const publishOrderCreatedEvent = (orderId) => {
  amqp.connect("amqp://localhost", (error, connection) => {
    if (error) {
      throw error;
    }

    connection.createChannel((error, channel) => {
      if (error) {
        throw error;
      }

      const queue = "order_created_queue"; // Queue name where delivery service listens
      const msg = JSON.stringify({ orderId }); // Message payload (only orderId)

      channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(msg), { persistent: true });

      console.log(`Order Created Event Sent: ${msg}`);
    });

    setTimeout(() => {
      connection.close();
    }, 500);
  });
};

// Create a new order with items from a single restaurant
const createOrder = async (req, res, next) => {
  try {
    const {
      customerId,
      customerInfo,
      items,
      deliveryAddress,
      deliveryLocation,
    } = req.body;

    if (!deliveryAddress) {
      return res.status(400).json({ message: "Delivery address is required" });
    }

    // Ensure all items are from the same restaurant
    const restaurantIds = [
      ...new Set(items.map((item) => item.restaurantId.toString())),
    ];
    if (restaurantIds.length > 1) {
      return res.status(400).json({
        message: "An order can only contain items from a single restaurant",
        restaurantIds,
      });
    }

    const restaurantId = restaurantIds[0];

    // Validate restaurant availability
    const restaurantAvailability =
      await restaurantService.getRestaurantAvailability(restaurantId);
    if (!restaurantAvailability.isAvailable) {
      return res.status(400).json({
        message: "Restaurant is not available for orders",
        restaurantId,
      });
    }

    // Calculate total amount
    const totalAmount = orderSplitter.calculateOrderTotal(items);

    console.log("Delivery location:", deliveryLocation);

    // Calculate estimated delivery time
    const estimatedTime = await estimationService.calculateEstimatedTime(
      items,
      deliveryLocation,
      restaurantId
    );

    // Create the order
    const order = new Order({
      customerId,
      customerInfo,
      items,
      deliveryAddress,
      deliveryLocation,
      totalAmount,
      paymentStatus: "pending",
      estimatedDeliveryTime: estimatedTime,
      trackingStatus: "placed",
      statusUpdates: [
        {
          status: "placed",
          timestamp: Date.now(),
          note: "Order placed successfully",
        },
      ],
      restaurantId,
    });

    const savedOrder = await order.save();

    // Create response data object
    const responseData = {
      order: savedOrder,
    };

    let paymentResponse;

    // Initiate payment process
    try {
      const token = req.headers.authorization?.split(" ")[1];
      console.log("Token being used:", token); // Debug log
      paymentResponse = await paymentService.createPayment(
        savedOrder._id,
        totalAmount,
        customerId,
        `Order #${savedOrder._id} with ${items.length} items`,
        token
      );

      // Store payment ID in order
      savedOrder.paymentId = paymentResponse.paymentId;
      await savedOrder.save();

      // Include payment information in response
      responseData.payment = {
        paymentId: paymentResponse.paymentId,
        checkoutUrl: paymentResponse.checkoutUrl,
        paymentParams: paymentResponse.paymentParams,
      };
    } catch (error) {
      console.error("Error initiating payment:", error);
      return res.status(500).json({ message: "Error initiating payment" });
    }

    // Now paymentResponse is accessible here
    if (paymentResponse) {
      // Update order with payment ID
      savedOrder.paymentId = paymentResponse.paymentId;
      await savedOrder.save();
    }

    // Publish the order created event to RabbitMQ after the order is created
    publishOrderCreatedEvent(savedOrder._id);

    res.status(201).json(savedOrder);
  } catch (error) {
    next(error);
  }
};

// Get order details
const getOrderWithSubOrders = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// Get orders by customer
const getCustomerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId }).sort(
      { createdAt: -1 }
    );

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// Get orders by restaurant
const getRestaurantOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      restaurantId: req.params.restaurantId,
    })
      .sort({ createdAt: -1 })
      .populate("customerId", "name");

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// Update order tracking status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update tracking status
    order.trackingStatus = status;
    order.statusUpdates.push({
      status,
      timestamp: Date.now(),
      note: note || "",
    });

    await order.save();

    // Send notification to customer
    try {
      await axios.post(
        `${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`,
        {
          userId: order.customerId,
          role: "customer",
          title: "Order Status Update",
          body: `Your order #${order._id} is now ${status}`,
          data: {
            orderId: order._id.toString(),
            status,
            type: "order_update",
          },
        }
      );
    } catch (notificationError) {
      console.error("Failed to send notification:", notificationError);
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

// Get orders assigned to delivery person
const getDeliveryPersonOrders = async (req, res, next) => {
  try {
    const deliveryPersonId = req.user.id;

    const orders = await Order.find({
      deliveryPersonId,
      trackingStatus: { $in: ["ready_for_pickup", "out_for_delivery"] },
    })
      .sort({ createdAt: -1 })
      .populate("customerId", "name")
      .populate("items.restaurantId", "name address")
      .populate("restaurantId", "name address");

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// Get specific order for delivery person
const getDeliveryOrder = async (req, res, next) => {
  try {
    const deliveryPersonId = req.user.id;
    const orderId = req.params.id;

    const order = await Order.findOne({
      _id: orderId,
      deliveryPersonId,
    })
      .populate("customerId", "name email")
      .populate("items.restaurantId", "name address")
      .populate("restaurantId", "name address");

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found or not assigned to you" });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

const updateOrderPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, paymentId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update payment status
    order.paymentStatus = paymentStatus;
    order.paymentId = paymentId;

    // If payment is completed, update order status
    if (paymentStatus === "completed") {
      order.trackingStatus = "confirmed";
      order.statusUpdates.push({
        status: "confirmed",
        timestamp: Date.now(),
        note: "Payment completed, order confirmed",
      });

      // Notify customer about confirmed order
      await notificationService
        .sendNotification(
          order.customerId,
          "order_confirmed",
          `Your order #${order._id} has been confirmed and is being prepared`,
          { orderId: order._id }
        )
        .catch((err) => console.error("Notification service error:", err));
    } else if (paymentStatus === "failed" || paymentStatus === "cancelled") {
      order.trackingStatus = "cancelled";
      order.statusUpdates.push({
        status: "cancelled",
        timestamp: Date.now(),
        note: "Order cancelled due to payment issues",
      });

      // Notify customer about cancelled order
      await notificationService
        .sendNotification(
          order.customerId,
          "order_cancelled",
          `Your order #${order._id} has been cancelled due to payment issues`,
          { orderId: order._id }
        )
        .catch((err) => console.error("Notification service error:", err));
    }

    await order.save();
    res.status(200).json({ message: "Order payment status updated", order });
  } catch (error) {
    next(error);
  }
};

const updateSubOrderStatus = async (req, res, next) => {
  try {
    const { subOrderId } = req.params;
    const { status, note } = req.body;

    // Find the order containing this sub-order
    const order = await Order.findOne({ "items._id": subOrderId });

    if (!order) {
      return res.status(404).json({ message: "Sub-order not found" });
    }

    // Find the specific item in the order
    const subOrderIndex = order.items.findIndex(
      (item) => item._id.toString() === subOrderId
    );

    if (subOrderIndex === -1) {
      return res.status(404).json({ message: "Sub-order not found in order" });
    }

    // Update the status of the sub-order
    order.items[subOrderIndex].status = status;

    // Add to status updates history if note is provided
    if (note) {
      order.statusUpdates.push({
        status: `sub_order_${status}`,
        timestamp: Date.now(),
        note: note,
        subOrderId: subOrderId,
      });
    }

    await order.save();

    // Notify customer about status update
    await notificationService
      .sendNotification(
        order.customerId,
        "sub_order_status_update",
        `Your item "${order.items[subOrderIndex].name}" is now ${status}`,
        { orderId: order._id, subOrderId: subOrderId, status }
      )
      .catch((err) => console.error("Notification service error:", err));

    res.status(200).json({
      message: "Sub-order status updated successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// Export all controller functions
module.exports = {
  createOrder,
  getOrderWithSubOrders,
  getCustomerOrders,
  getRestaurantOrders,
  updateOrderStatus,
  getDeliveryPersonOrders,
  getDeliveryOrder,
  updateOrderPaymentStatus,
  updateSubOrderStatus,
};



/* Service: server */
/* File: paymentController.js */
const Payment = require("../models/Payment");
const paymentService = require("../services/paymentService");
const notificationService = require("../services/notificationService");
const axios = require("axios");
require("dotenv").config();

// // Create a new payment
// const createPayment = async (req, res, next) => {
//   try {
//     const { orderId, amount, customerId, description, paymentMethod } =
//       req.body;

//     // Validate required fields
//     if (!orderId || !amount || !customerId) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         required: ["orderId", "amount", "customerId"],
//       });
//     }

//     // Check if payment already exists for this order
//     const existingPayment = await Payment.findOne({ orderId });
//     if (existingPayment) {
//       return res.status(400).json({
//         message: "Payment already exists for this order",
//         paymentId: existingPayment._id,
//       });
//     }

//     // Fetch customer info from user service using the user's token
//     let customerInfo;
//     try {
//       // Extract the token part from the Authorization header
//       const authHeader = req.headers.authorization;
//       const token =
//         authHeader &&
//         typeof authHeader === "string" &&
//         authHeader.startsWith("Bearer ")
//           ? authHeader.split(" ")[1]
//           : null;

//       if (!token) {
//         throw new Error("No valid authorization token provided");
//       }

//       // Use the /me endpoint with the user's token
//       const response = await axios.get(
//         `${process.env.USER_SERVICE_URL}/api/users/me`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       customerInfo = response.data.data.user;
//     } catch (error) {
//       console.error("Error fetching customer info:", error);
//       // Use fallback data instead of failing
//       customerInfo = {
//         name: "Customer",
//         phone: "Unknown",
//       };
//     }

//     // Convert description to string if it's an object
//     const descriptionStr =
//       typeof description === "object"
//         ? JSON.stringify(description)
//         : description || `Payment for order #${orderId}`;

//     // Create payment record (without items field)
//     const payment = new Payment({
//       orderId,
//       customerId,
//       amount,
//       currency: req.body.currency || "LKR",
//       description: descriptionStr,
//       paymentMethod: paymentMethod,
//     });

//     // Handle payment methods differently
//     if (paymentMethod === "cash") {
//       // For cash payments, create payment record with pending status
//       payment.status = "pending";
//       const savedPayment = await payment.save();

//       res.status(201).json({
//         paymentId: savedPayment._id,
//         status: "pending",
//       });
//     } else if (paymentMethod === "card") {
//       // For card payments, generate PayHere parameters
//       const savedPayment = await payment.save();

//       // Generate payment parameters and URL for PayHere
//       const paymentParams = paymentService.generatePaymentParams(
//         orderId,
//         amount,
//         payment.currency,
//         descriptionStr,
//         customerId,
//         customerInfo,
//         "card"
//       );

//       // Generate payment URL
//       const paymentUrl = paymentService.getPaymentUrl(paymentParams);

//       res.status(201).json({
//         paymentId: savedPayment._id,
//         checkoutUrl: paymentUrl,
//         paymentParams: paymentParams,
//       });
//     }
//   } catch (error) {
//     next(error);
//   }
// };

const createPayment = async (req, res, next) => {
  try {
    const { orderId, amount, customerId, description, paymentMethod } =
      req.body;

    // Validate required fields
    if (!orderId || !amount || !customerId) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["orderId", "amount", "customerId"],
      });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment) {
      return res.status(400).json({
        message: "Payment already exists for this order",
        paymentId: existingPayment._id,
      });
    }

    // Create payment record (without PayHere integration)
    const payment = new Payment({
      orderId,
      customerId,
      amount,
      currency: req.body.currency || "LKR",
      description: description || `Payment for order #${orderId}`,
      paymentMethod: paymentMethod || "cash",
      status: paymentMethod === "cash" ? "pending" : "pending",
    });

    const savedPayment = await payment.save();

    res.status(201).json({
      paymentId: savedPayment._id,
      status: savedPayment.status,
    });
  } catch (error) {
    next(error);
  }
};

// Process payment notification from PayHere
const processNotification = async (req, res, next) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      method,
    } = req.body;

    // Verify the signature...
    const isValidSignature = paymentService.verifyPaymentSignature(
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig
    );

    if (!isValidSignature) {
      console.error("Invalid payment signature for order:", order_id);
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Find the payment
    const payment = await Payment.findOne({ orderId: order_id });
    if (!payment) {
      console.error("Payment not found for order:", order_id);
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment status based on status code
    let paymentStatus;
    switch (status_code) {
      case "2":
        paymentStatus = "completed";
        break;
      case "0":
        paymentStatus = "pending";
        break;
      case "-1":
        paymentStatus = "cancelled";
        break;
      case "-2":
        paymentStatus = "failed";
        break;
      case "-3":
        paymentStatus = "chargedback";
        break;
      default:
        paymentStatus = "pending";
    }

    // Update payment record
    payment.status = paymentStatus;
    payment.paymentId = payment_id;
    payment.paymentMethod = method;
    payment.statusCode = status_code;
    payment.md5sig = md5sig;
    await payment.save();

    // Notify order service about payment status
    await notificationService.notifyOrderService(
      order_id,
      paymentStatus,
      payment_id
    );

    // Respond to PayHere
    res.status(200).send("Payment notification received");
  } catch (error) {
    console.error("Error processing payment notification:", error);
    next(error);
  }
};

// Get payment by ID
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
};

// Get payment by order ID
const getPaymentByOrderId = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
};

// Get payments by customer ID
const getPaymentsByCustomerId = async (req, res, next) => {
  try {
    const payments = await Payment.find({ customerId: req.params.customerId });
    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
};

// Process refund
const processRefund = async (req, res, next) => {
  try {
    const { paymentId, amount, reason } = req.body;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Only completed payments can be refunded" });
    }

    // In a real implementation, you would call PayHere's refund API here
    // For sandbox, we'll just update the status
    payment.status = "refunded";
    await payment.save();

    // Notify order service about refund
    await notificationService.notifyOrderService(
      payment.orderId,
      "refunded",
      payment.paymentId
    );

    res.status(200).json({ message: "Refund processed successfully", payment });
  } catch (error) {
    next(error);
  }
};

const storePaymentDetails = async (req, res, next) => {
  try {
    const { orderId, paymentId, amount, status } = req.body;

    // Validate required fields
    if (!orderId || !paymentId || !amount || !status) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["orderId", "paymentId", "amount", "status"],
      });
    }

    // Extract bearer token
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    if (!token) {
      return res
        .status(401)
        .json({ message: "No valid authorization token provided" });
    }

    // Get user info using token
    let userInfo;
    try {
      const response = await axios.get(
        `${process.env.USER_SERVICE_URL}/api/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      userInfo = response.data.data.user;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Create or update payment record
    let payment = await Payment.findOne({ orderId });

    if (payment) {
      // Update existing payment
      payment.paymentId = paymentId;
      payment.status = status;
      payment.amount = amount;
      payment.paymentMethod = "card";
      payment.updatedAt = Date.now();
    } else {
      // Create new payment record
      payment = new Payment({
        orderId,
        customerId: userInfo.id, // Use ID from validated token
        paymentId,
        amount,
        currency: "LKR",
        status,
        paymentMethod: "card",
      });
    }

    const savedPayment = await payment.save();

    // Notify order service about payment status using internal API key
    await notificationService.notifyOrderService(orderId, status, paymentId);

    // Get updated order details
    const orderServiceResponse = await axios.get(
      `${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}`,
      {
        headers: {
          "x-api-key": process.env.INTERNAL_API_KEY,
        },
      }
    );

    res.status(201).json({
      message: "Payment details stored successfully",
      payment: savedPayment,
      order: orderServiceResponse.data,
    });
  } catch (error) {
    console.error("Error storing payment details:", error);
    next(error);
  }
};

module.exports = {
  createPayment,
  processNotification,
  getPaymentById,
  getPaymentByOrderId,
  getPaymentsByCustomerId,
  processRefund,
  storePaymentDetails,
};



/* Service: server */
/* File: restaurantController.js */
const axios = require("axios");
const mongoose = require("mongoose");
const path = require("path");
const Restaurant = require("../models/restaurantModel");
const { calculateDistance } = require("../utils/geolocation");
const upload = require("../config/multerConfig");

const addRestaurant = async (req, res) => {
  console.log("Request body:", req.body); // Debugging log
  console.log("Request files:", req.files); // Debugging log

  try {
    // Parse the incoming data (handling both stringified and direct objects)
    const name = req.body.name;
    const description = req.body.description;

    const address =
      typeof req.body.address === "string"
        ? JSON.parse(req.body.address)
        : req.body.address;

    const operatingHours =
      typeof req.body.operatingHours === "string"
        ? JSON.parse(req.body.operatingHours)
        : req.body.operatingHours;

    let menu = [];
    try {
      menu =
        typeof req.body.menu === "string"
          ? JSON.parse(req.body.menu)
          : req.body.menu || [];

      if (!Array.isArray(menu)) {
        throw new Error("Menu must be an array");
      }
    } catch (err) {
      console.error("Error parsing menu:", err);
      return res.status(400).json({ message: "Invalid menu format" });
    }

    // Validate required fields
    if (!name || !address) {
      return res.status(400).json({
        message: "Name and address are required",
        details: {
          received: { name, address },
        },
      });
    }

    // Validate address structure
    if (
      !address.geoCoordinates ||
      typeof address.geoCoordinates !== "object" ||
      isNaN(parseFloat(address.geoCoordinates.longitude)) ||
      isNaN(parseFloat(address.geoCoordinates.latitude))
    ) {
      return res.status(400).json({
        message: "Valid geo coordinates are required",
        details: {
          receivedCoordinates: address.geoCoordinates,
        },
      });
    }

    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({ name });
    if (existingRestaurant) {
      return res.status(400).json({
        message: "Restaurant already exists",
        existingId: existingRestaurant._id,
      });
    }

    // Handle file uploads
    const coverImage = req.files?.coverImage?.[0]?.path || null;
    const menuItemImages = req.files?.menuItemImages || [];

    // Validate menu items match uploaded images
    if (menuItemImages.length > 0 && menuItemImages.length !== menu.length) {
      console.warn(
        `Mismatch: ${menuItemImages.length} images for ${menu.length} menu items`
      );
    }

    // Create new restaurant with proper data types
    const newRestaurant = new Restaurant({
      name: name.trim(),
      description: description ? description.trim() : "",
      address: {
        street: address.street ? address.street.trim() : "",
        city: address.city ? address.city.trim() : "",
        country: address.country ? address.country.trim() : "",
        geoCoordinates: {
          type: "Point",
          coordinates: [
            parseFloat(address.geoCoordinates.longitude),
            parseFloat(address.geoCoordinates.latitude),
          ],
        },
      },
      menu: menu.map((item, index) => ({
        name: item.name ? item.name.trim() : `Item ${index + 1}`,
        description: item.description ? item.description.trim() : "",
        price: parseFloat(item.price) || 0,
        category: item.category ? item.category.trim() : "other",
        image: menuItemImages[index]?.path || null,
      })),
      operatingHours: {
        from: operatingHours?.from || "09:00",
        to: operatingHours?.to || "21:00",
      },
      availability: true,
      coverImage,
    });

    // Validate the restaurant document before saving
    const validationError = newRestaurant.validateSync();
    if (validationError) {
      return res.status(400).json({
        message: "Validation failed",
        error: validationError.message,
        details: validationError.errors,
      });
    }

    await newRestaurant.save();

    res.status(201).json({
      status: "success",
      data: {
        restaurant: newRestaurant,
      },
    });
  } catch (err) {
    console.error("Error creating restaurant:", err);

    // Handle duplicate key errors separately
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Restaurant with this name already exists",
        error: err.message,
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        error: err.message,
        details: err.errors,
      });
    }

    res.status(500).json({
      message: "Error creating restaurant",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// Get all restaurants within a certain radius (nearby restaurants)
const getNearbyRestaurants = async (req, res) => {
  const { longitude, latitude, radius } = req.query;

  try {
    // Check if valid coordinates are provided
    const isValidCoordinates =
      longitude &&
      latitude &&
      !isNaN(parseFloat(longitude)) &&
      !isNaN(parseFloat(latitude));

    if (isValidCoordinates) {
      // Try to get nearby restaurants first with distance filter
      let restaurants = await Restaurant.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            distanceField: "distance",
            maxDistance: parseFloat(radius) * 1000, // Convert to meters
            spherical: true,
            includeLocs: "address.geoCoordinates",
          },
        },
        {
          $project: {
            name: 1,
            description: 1,
            coverImage: 1,
            menu: 1,
            availability: 1,
            operatingHours: 1,
            distance: 1,
          },
        },
      ]);

      // If no nearby restaurants found, get all restaurants with distance calculation
      // This maintains the same format as nearby restaurants
      if (restaurants.length === 0) {
        console.log(
          "No nearby restaurants found, getting all restaurants with distance"
        );
        restaurants = await Restaurant.aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
              },
              distanceField: "distance",
              // No maxDistance filter here - return all restaurants
              spherical: true,
              includeLocs: "address.geoCoordinates",
            },
          },
          {
            $project: {
              name: 1,
              description: 1,
              coverImage: 1,
              menu: 1,
              availability: 1,
              operatingHours: 1,
              distance: 1,
            },
          },
        ]);
      }

      if (restaurants.length === 0) {
        return res.status(404).json({ message: "No restaurants found" });
      }

      return res.status(200).json(restaurants);
    } else {
      // If coordinates are not valid, just return all restaurants without distance
      const allRestaurants = await Restaurant.find(
        {},
        {
          name: 1,
          description: 1,
          coverImage: 1,
          menu: 1,
          availability: 1,
          operatingHours: 1,
        }
      );

      if (allRestaurants.length === 0) {
        return res.status(404).json({ message: "No restaurants found" });
      }

      // Add null distance field for format consistency
      const formattedRestaurants = allRestaurants.map((restaurant) => {
        const restaurantObj = restaurant.toObject();
        restaurantObj.distance = null;
        return restaurantObj;
      });

      return res.status(200).json(formattedRestaurants);
    }
  } catch (err) {
    console.error("Error fetching restaurants:", err);
    res.status(500).json({ message: "Error fetching restaurants", err });
  }
};

// Update restaurant availability
const toggleAvailability = async (req, res) => {
  const { id } = req.params;
  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      console.error("Error fetching restaurant tog:", err);
      return res.status(404).json({ message: "Restaurant not found" });
    }

    restaurant.availability = !restaurant.availability; // Toggle availability
    await restaurant.save();

    res
      .status(200)
      .json({ message: "Restaurant availability updated", restaurant });
  } catch (err) {
    res.status(500).json({ message: "Error updating availability", err });
  }
};

// Get restaurant availability status
const getRestaurantAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      console.error("Error fetching restaurant aval:", err);
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.status(200).json({
      restaurantId: restaurant._id,
      isAvailable: restaurant.availability,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error checking restaurant availability", err });
  }
};

// Get restaurant by ID
const getRestaurantById = async (req, res) => {
  const { id } = req.params;

  // 1. Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid restaurant ID format",
    });
  }

  try {
    console.log("Fetching restaurant with ID:", req.params.id);
    const restaurant = await Restaurant.findById(req.params.id);
    console.log("Fetched restaurant:", restaurant);

    if (!restaurant) {
      console.log("Restaurant not found");
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.status(200).json({
      restaurant,
    });
  } catch (err) {
    console.error("Error verifying restaurant:", err);
    res.status(500).json({
      status: "error",
      message: "Error verifying restaurant",
    });
  }
};

// Verify Restaurant Existence
const verifyRestaurant = async (req, res) => {
  const { restaurantId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid restaurant ID format",
    });
  }

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        status: "fail",
        message: "Restaurant not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        exists: true,
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
        },
      },
    });
  } catch (err) {
    console.error("Error verifying restaurant:", err);
    res.status(500).json({
      status: "error",
      message: "Error verifying restaurant",
    });
  }
};

//get all restaurants
const getAllRestaurants = async (req, res) => {
  try {
    // Fetch all restaurants from the database
    const restaurants = await Restaurant.find(); // You can add query filters if needed

    if (restaurants.length === 0) {
      return res.status(404).json({ message: "No restaurants found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        restaurants, // Return the list of restaurants
      },
    });
  } catch (err) {
    console.error("Error fetching restaurants:", err);
    res.status(500).json({ message: "Error fetching restaurants", err });
  }
};

// Add menu item to restaurant
const addMenuItem = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuItem = req.body;
    const menuItemImage = req.file
      ? path
          .join("uploads", "menu-items", req.file.filename)
          .replace(/\\/g, "/")
      : null;

    // Validate required fields
    if (!menuItem.name || !menuItem.price) {
      return res.status(400).json({
        status: "fail",
        message: "Name and price are required for menu items",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        status: "fail",
        message: "Restaurant not found",
      });
    }

    const newItem = {
      ...menuItem,
      _id: new mongoose.Types.ObjectId(),
      image: menuItemImage,
      price: parseFloat(menuItem.price),
    };

    restaurant.menu.push(newItem);
    const updatedRestaurant = await restaurant.save();

    return res.status(201).json({
      status: "success",
      data: {
        menuItem: updatedRestaurant.menu.slice(-1)[0],
      },
    });
  } catch (err) {
    console.error("Error in addMenuItem:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// Update menu item
const updateMenuItem = async (req, res) => {
  try {
    const { restaurantId, menuItemId } = req.params;
    const menuItem = req.body;
    const menuItemImage = req.file
      ? path
          .join("uploads", "menu-items", req.file.filename)
          .replace(/\\/g, "/")
      : null;

    // Validate required fields
    if (!menuItem.name || !menuItem.price) {
      return res.status(400).json({
        status: "fail",
        message: "Name and price are required for menu items",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        status: "fail",
        message: "Restaurant not found",
      });
    }

    const itemIndex = restaurant.menu.findIndex(
      (item) => item._id.toString() === menuItemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({
        status: "fail",
        message: "Menu item not found",
      });
    }

    restaurant.menu[itemIndex] = {
      ...restaurant.menu[itemIndex],
      ...menuItem,
      price: parseFloat(menuItem.price),
      image: menuItemImage || restaurant.menu[itemIndex].image,
    };

    const updatedRestaurant = await restaurant.save();
    return res.status(200).json({
      status: "success",
      data: {
        menuItem: updatedRestaurant.menu[itemIndex],
      },
    });
  } catch (err) {
    console.error("Error in updateMenuItem:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// Delete menu item
const deleteMenuItem = async (req, res) => {
  try {
    const { restaurantId, menuItemId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        status: "fail",
        message: "Restaurant not found",
      });
    }

    const initialLength = restaurant.menu.length;
    restaurant.menu = restaurant.menu.filter(
      (item) => item._id.toString() !== menuItemId
    );

    if (restaurant.menu.length === initialLength) {
      return res.status(404).json({
        status: "fail",
        message: "Menu item not found",
      });
    }

    await restaurant.save();
    return res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    console.error("Error in deleteMenuItem:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// Search restaurants by filters (cuisine, price, rating)
const searchRestaurants = async (req, res) => {
  const { cuisine, priceRange, rating } = req.query;

  try {
    const query = {};

    if (cuisine) query["menu.category"] = cuisine;
    if (priceRange) query["menu.price"] = { $lte: priceRange };
    if (rating) query["rating"] = { $gte: rating };

    const restaurants = await Restaurant.find(query);
    res.status(200).json(restaurants);
  } catch (err) {
    res.status(500).json({ message: "Error searching restaurants", err });
  }
};

module.exports = {
  addRestaurant,
  getNearbyRestaurants,
  toggleAvailability,
  getRestaurantAvailability,
  getRestaurantById,
  verifyRestaurant,
  getAllRestaurants,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  searchRestaurants,
};



/* Service: server */
/* File: userController.js */
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const authService = require("../services/authService");
const { sendEmail } = require("../services/emailService");
const passwordUtils = require("../utils/passwordUtils");
const axios = require("axios");
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;
const amqp = require("amqplib/callback_api");

// ==================== TOKEN VERIFICATION ====================
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user information
    res.status(200).json({
      status: "success",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        // Include any other relevant user info
      },
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    next(error);
  }
};

// ==================== ADMIN METHODS ====================
const createAdmin = async (req, res, next) => {
  try {
    // Only super admin can create other admins
    if (req.user.role !== "admin" || !req.user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to create admins" });
    }

    const { name, email, phone, password } = req.body;

    const admin = await User.create({
      name,
      email,
      phone,
      password: await passwordUtils.hashPassword(password),
      role: "admin",
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== RESTAURANT ADMIN METHODS ====================

// Create a new Restaurant Admin
const createRestaurantAdmin = async (req, res, next) => {
  try {
    console.log("Incoming request body:", req.body); // Log the entire request
    const { name, email, phone, password, restaurantId } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !restaurantId) {
      return res.status(400).json({
        status: "fail",
        message: "Name, email, phone and restaurantId are required",
      });
    }

    // Validate restaurant exists (call restaurant service)
    try {
      const restaurantResponse = await axios.get(
        `${process.env.RESTAURANT_SERVICE_URL}/api/restaurants/verify/${restaurantId}`,
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );

      if (
        !restaurantResponse.data ||
        restaurantResponse.data.status !== "success"
      ) {
        return res.status(404).json({
          status: "fail",
          message: "Restaurant not found",
        });
      }
    } catch (err) {
      console.error("Error verifying restaurant:", err);
      return res.status(404).json({
        status: "fail",
        message: "Restaurant verification failed",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "Email or phone already in use",
      });
    }

    // Generate password if not provided
    const adminPassword = password || passwordUtils.generateRandomPassword();

    // Create the restaurant admin
    const restaurantAdmin = await User.create({
      name,
      email,
      phone,
      password: await passwordUtils.hashPassword(adminPassword),
      role: "restaurant_admin",
      isActive: true,
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
      emailVerified: true,
      phoneVerified: true,
    });

    // Remove sensitive data before sending response
    restaurantAdmin.password = undefined;

    // Send welcome email
    try {
      await sendEmail(
        email,
        "Welcome as Restaurant Admin",
        `Hello ${name},\n\nYou have been assigned as the admin for restaurant ${restaurantId}.\n\nYour login credentials:\nEmail: ${email}\nPassword: ${adminPassword}`
      );
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    res.status(201).json({
      status: "success",
      data: {
        user: restaurantAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Admins by Restaurant
const getAdminsByRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid restaurant ID format",
      });
    }

    const admins = await User.find({
      role: "restaurant_admin",
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
    }).select("-password -__v");

    res.status(200).json({
      status: "success",
      results: admins.length,
      data: {
        admins,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove Restaurant Admin
const removeRestaurantAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid admin ID format",
      });
    }

    const admin = await User.findOneAndDelete({
      _id: adminId,
      role: "restaurant_admin",
    });

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Restaurant admin not found",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// const requestRestaurantAdminAccess = async (req, res, next) => {
//   try {
//     const { name, email, phone, restaurantName, licenseNumber, address } =
//       req.body;

//     const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
//     if (existingUser) {
//       return res.status(400).json({ message: "Email or phone already in use" });
//     }

//     const restaurantAdmin = await User.create({
//       name,
//       email,
//       phone,
//       role: "restaurant_admin",
//       isActive: false,
//       status: "pending",
//       phoneVerified: true, // Automatically verify phone without OTP
//       restaurantDetails: {
//         name: restaurantName,
//         licenseNumber,
//         address,
//       },
//     });

//     if (email) {
//       await sendEmail(
//         restaurantAdmin.email,
//         "New restaurant admin request",
//         `New restaurant admin request from ${restaurantName}`
//       );
//     }
//     // // Notify super admin about new request
//     // await notificationService.sendAdminNotification(
//     //   "New restaurant admin request",
//     //   `New restaurant admin request from ${restaurantName}`
//     // );

//     res.status(201).json({
//       status: "success",
//       message: "Request submitted for approval",
//       data: {
//         user: {
//           _id: restaurantAdmin._id,
//           name: restaurantAdmin.name,
//           email: restaurantAdmin.email,
//         },
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// Approve Restaurant Admin
const approveRestaurantAdmin = async (req, res, next) => {
  try {
    const { userId, restaurantId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: true,
        status: "approved",
        restaurantId,
        password: await passwordUtils.hashPassword(
          passwordUtils.generateRandomPassword()
        ),
      },
      { new: true }
    );

    if (email) {
      await sendEmail(
        user._id,
        user.email,
        "Your restaurant admin account has been approved"
      );
    }
    // Send welcome email with temporary password
    // await notificationService.sendWelcomeNotification(
    //   user._id,
    //   user.email,
    //   "Your restaurant admin account has been approved"
    // );

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CUSTOMER METHODS ====================
const registerCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, password, address } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email or phone already in use" });
    }

    const customer = await User.create({
      name,
      email,
      phone,
      password: await passwordUtils.hashPassword(password),
      role: "customer",
      address,
      isActive: true,
      phoneVerified: true,
    });

    // Generate JWT token
    const token = authService.generateToken(customer._id, customer.role);

    // Send welcome email (no OTP)
    if (email) {
      await sendEmail(
        customer.email,
        "Welcome to TastyTrail!",
        `Hello ${customer.name},\n\nThank you for registering at TastyTrail!`
      );
    }

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          role: customer.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELIVERY PERSONNEL METHODS ====================
// Function to register a new Delivery Person
const registerDeliveryPerson = async (req, res, next) => {
  try {
    const {
      name,
      password,
      phone,
      nicOrLicense,
      vehicleType,
      vehicleNumber,
      documents,
    } = req.body;

    // Check if the phone number is already in use
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    // Create the new delivery person in the User model
    const deliveryPerson = await User.create({
      name,
      password: await passwordUtils.hashPassword(password),
      phone,
      role: "delivery_personnel",
      nicOrLicense,
      vehicleInfo: {
        type: vehicleType,
        number: vehicleNumber,
      },
      documents, // URL paths to the uploaded documents
      status: "pending", // Default status for delivery person (needs approval)
      isActive: false, // Default is inactive until approved
      phoneVerified: true, // Assuming phone is verified automatically
    });

    // Publish the event to RabbitMQ after the delivery person is created
    publishDeliveryPersonEvent(deliveryPerson);

    res.status(201).json({
      status: "success",
      message: "Delivery person registration submitted for approval",
      data: {
        user: {
          _id: deliveryPerson._id,
          password: deliveryPerson.password,
          name: deliveryPerson.name,
          phone: deliveryPerson.phone,
          status: deliveryPerson.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Function to publish a message to RabbitMQ when a delivery person registers
const publishDeliveryPersonEvent = (deliveryPerson) => {
  amqp.connect("amqp://localhost", (error, connection) => {
    if (error) {
      throw error;
    }

    connection.createChannel((error, channel) => {
      if (error) {
        throw error;
      }

      const queue = "delivery_person_registered_queue"; // Queue for delivery person registration
      const message = JSON.stringify({
        deliveryPersonId: deliveryPerson._id,
        name: deliveryPerson.name,
        phone: deliveryPerson.phone,
        vehicleType: deliveryPerson.vehicleInfo.type,
        vehicleLicensePlate: deliveryPerson.vehicleInfo.number,
      });

      // Make sure the queue exists and then publish the message
      channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(message), { persistent: true });

      console.log(`Published delivery person registration event: ${message}`);
    });

    setTimeout(() => {
      connection.close();
    }, 500);
  });
};

module.exports = {
  registerDeliveryPerson,
  // other methods...
};

const approveDeliveryPerson = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const tempPassword = passwordUtils.generateRandomPassword();
    const deliveryPerson = await User.findByIdAndUpdate(
      userId,
      {
        isActive: true,
        status: "approved",
        password: await passwordUtils.hashPassword(tempPassword),
      },
      { new: true }
    );

    // // Send approval notification with temporary password
    // await notificationService.sendSMSNotification(
    //   deliveryPerson.phone,
    //   `Your delivery account has been approved. Temporary password: ${tempPassword}`
    // );

    res.status(200).json({
      status: "success",
      data: {
        user: deliveryPerson,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== COMMON METHODS ====================
const login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    // Find user by email or phone
    let user;
    if (email) {
      user = await User.findOne({ email }).select("+password");
    } else if (phone) {
      user = await User.findOne({ phone }).select("+password");
    } else {
      return res.status(400).json({ message: "Email or phone required" });
    }

    if (
      !user ||
      !(await passwordUtils.comparePassword(password, user.password))
    ) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        message: "Account not active",
        details:
          user.role === "delivery_personnel"
            ? "Pending admin approval"
            : "Account deactivated",
      });
    }

    // Role-specific checks
    if (user.role === "restaurant_admin" && !user.restaurantId) {
      return res
        .status(403)
        .json({ message: "Restaurant admin not assigned to a restaurant" });
    }

    // Generate JWT token
    const token = authService.generateToken(user._id, user.role);

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateMe = async (req, res, next) => {
  try {
    // Filter out unwanted fields
    const filteredBody = {};
    const allowedFields = ["name", "email", "phone", "address"];
    allowedFields.forEach((field) => {
      if (req.body[field]) filteredBody[field] = req.body[field];
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID (admin only)
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getMe = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ status: "success", data: { user } });
  } catch (error) {
    next(error);
  }
};

// Update user (admin only)
const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyToken,
  // Admin methods
  createAdmin,

  // Restaurant admin methods
  // requestRestaurantAdminAccess,
  approveRestaurantAdmin,
  createRestaurantAdmin,
  getAdminsByRestaurant,
  removeRestaurantAdmin,

  // Customer methods
  registerCustomer,

  // Delivery methods
  registerDeliveryPerson,
  approveDeliveryPerson,

  // Common methods
  login,
  getMe,
  updateMe,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
};

