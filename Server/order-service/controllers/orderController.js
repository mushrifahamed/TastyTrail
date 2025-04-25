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

    // Calculate estimated delivery time
    const estimatedTime = await estimationService.calculateEstimatedTime(
      items,
      deliveryLocation,
      [restaurantId]
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
    const order = await Order.findById(req.params.id)
      .populate("customerId", "name email")
      .populate("items.restaurantId", "name address")
      .populate("restaurantId", "name address")
      .populate("deliveryPersonId", "name phone");

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
    const orders = await Order.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 })
      .populate("restaurantId", "name");

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

    // Add to status updates history
    order.statusUpdates.push({
      status,
      timestamp: Date.now(),
      note: note || "",
    });

    // If status is out_for_delivery, assign delivery person
    if (
      status === "out_for_delivery" &&
      req.user.role === "delivery_personnel"
    ) {
      order.deliveryPersonId = req.user.id;
    }

    await order.save();

    // Notify customer about status update
    await notificationService.sendNotification(
      order.customerId,
      "order_status_update",
      `Your order #${order._id} is now ${status}`,
      { orderId: order._id, status }
    );

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
