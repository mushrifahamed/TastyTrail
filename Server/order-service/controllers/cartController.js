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
    const { restaurantId, deliveryAddress } = req.body;
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
      cart: cart, // Return the updated cart with remaining items
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
