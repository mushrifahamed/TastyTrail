const Order = require("../models/Order");
const axios = require("axios");
const orderSplitter = require("../services/orderSplitter");
const restaurantService = require("../services/restaurantService");
const paymentService = require("../services/paymentService");
const notificationService = require("../services/notificationService");
const { RESTAURANT_SERVICE_URL } = process.env;
const amqp = require('amqplib/callback_api');


// Function to publish an event to RabbitMQ
// Function to publish the order created event to RabbitMQ
const publishOrderCreatedEvent = (orderId) => {
  amqp.connect('amqp://localhost', (error, connection) => {
    if (error) {
      throw error;
    }

    connection.createChannel((error, channel) => {
      if (error) {
        throw error;
      }

      const queue = 'order_created_queue';  // Queue name where delivery service listens
      const msg = JSON.stringify({ orderId });  // Message payload (only orderId)

      channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(msg), { persistent: true });

      console.log(`Order Created Event Sent: ${msg}`);
    });

    setTimeout(() => {
      connection.close();
    }, 500);
  });
};

// Create a new order with items from multiple restaurants
const createOrder = async (req, res, next) => {
  try {
    const { customerId, items, deliveryAddress } = req.body;

    // Validate all restaurants are available
    const restaurantIds = [...new Set(items.map((item) => item.restaurantId))];
    const availabilityChecks = await Promise.all(
      restaurantIds.map((id) => restaurantService.getRestaurantAvailability(id))
    );

    const unavailableRestaurants = availabilityChecks.filter(
      (check) => !check.isAvailable
    );
    if (unavailableRestaurants.length > 0) {
      return res.status(400).json({
        message: "Some restaurants are not available for orders",
        unavailableRestaurants: unavailableRestaurants.map(
          (r) => r.restaurantId
        ),
      });
    }

    // Calculate total amount
    const totalAmount = orderSplitter.calculateOrderTotal(items);

    // Create the main order
    const order = new Order({
      customerId,
      items,
      deliveryAddress,
      totalAmount,
      paymentStatus: "pending",
    });

    // Split order by restaurant
    order.subOrders = orderSplitter.splitOrderByRestaurant(items);

    const savedOrder = await order.save();

    // Initiate payment process
    const paymentResponse = await paymentService.createPayment(
      savedOrder._id,
      totalAmount,
      customerId,
      `Food order from ${restaurantIds.length} restaurants`
    );

    // Update order with payment ID
    savedOrder.paymentId = paymentResponse.paymentId;
    await savedOrder.save();

    // Notify restaurants about their sub-orders
    await Promise.all(
      savedOrder.subOrders.map((subOrder) =>
        restaurantService.notifyNewOrder(subOrder.restaurantId, {
          orderId: savedOrder._id,
          subOrderId: subOrder._id,
          items: subOrder.items,
          customerId,
          deliveryAddress,
        })
      )
    );

    // Send notification to customer
    await notificationService.sendNotification(
      customerId,
      "order_created",
      `Your order #${savedOrder._id} has been placed with ${restaurantIds.length} restaurants`,
      { orderId: savedOrder._id }
    );

    // Publish the order created event to RabbitMQ after the order is created
    publishOrderCreatedEvent(savedOrder._id);

    res.status(201).json(savedOrder);
  } catch (error) {
    next(error);
  }
};

// Get order with sub-orders
const getOrderWithSubOrders = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId", "name email")
      .populate("items.restaurantId", "name address")
      .populate("subOrders.restaurantId", "name address");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// Update sub-order status
const updateSubOrderStatus = async (req, res, next) => {
  try {
    const { subOrderId, status } = req.body;

    const order = await Order.findOneAndUpdate(
      { "subOrders._id": subOrderId },
      { $set: { "subOrders.$.status": status } },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Sub-order not found" });
    }

    // Check if all sub-orders are delivered
    const allDelivered = order.subOrders.every(
      (so) => so.status === "delivered"
    );
    if (allDelivered) {
      order.status = "completed";
      await order.save();

      await notificationService.sendNotification(
        order.customerId,
        "order_completed",
        `Your order #${order._id} has been completed`,
        { orderId: order._id }
      );
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// Get orders by customer
const getCustomerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 })
      .populate("subOrders.restaurantId", "name");

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// Get orders by restaurant
const getRestaurantOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      "subOrders.restaurantId": req.params.restaurantId,
    })
      .sort({ createdAt: -1 })
      .populate("customerId", "name");

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// Export all controller functions
module.exports = {
  createOrder,
  getOrderWithSubOrders,
  updateSubOrderStatus,
  getCustomerOrders,
  getRestaurantOrders,
};
