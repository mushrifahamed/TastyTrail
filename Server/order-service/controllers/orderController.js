const Order = require("../models/orderModel");
const Tracking = require("../models/trackingModel");
const logger = require("../config/logger");
const { sendNotification } = require("../services/notificationService");
const { processPayment } = require("../services/paymentService");

// Helper function to validate order ownership/access
const validateOrderAccess = (order, userId, role, restaurantId) => {
  if (role === "admin") return true;
  if (order.userId.toString() === userId) return true;
  if (role === "restaurant" && order.restaurantId.toString() === restaurantId)
    return true;
  if (role === "delivery" && order.deliveryAgentId?.toString() === userId)
    return true;
  return false;
};

// Create a new order
exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      userId,
      restaurantId,
      items,
      totalAmount,
      deliveryAddress,
      paymentMethod,
    } = req.body;

    // Validate input
    if (
      !userId ||
      !restaurantId ||
      !items ||
      items.length === 0 ||
      !totalAmount ||
      !deliveryAddress ||
      !paymentMethod
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create order
    const order = new Order({
      userId,
      restaurantId,
      items,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      orderStatus: "pending",
    });

    // Save order within a transaction
    const savedOrder = await order.save({ session });

    // Create initial tracking record
    await Tracking.create(
      [
        {
          orderId: savedOrder._id,
          status: "pending",
          notes: "Order created and awaiting confirmation",
        },
      ],
      { session }
    );

    // Process payment
    const paymentResult = await processPayment({
      orderId: savedOrder._id,
      amount: totalAmount,
      paymentMethod,
      customerId: userId,
    });

    if (paymentResult.success) {
      // If payment is successful, update order and tracking
      savedOrder.paymentStatus = "completed";
      await savedOrder.save({ session });

      await Tracking.create(
        [
          {
            orderId: savedOrder._id,
            status: "confirmed",
            notes: "Payment processed successfully. Order confirmed.",
          },
        ],
        { session }
      );

      // Notify restaurant
      await sendNotification({
        recipientId: restaurantId,
        message: `New order #${savedOrder._id} received`,
        type: "new_order",
      });

      // Notify user
      await sendNotification({
        recipientId: userId,
        message: `Your order #${savedOrder._id} has been confirmed`,
        type: "order_confirmation",
      });

      // Commit the transaction
      await session.commitTransaction();

      return res.status(201).json({
        success: true,
        order: savedOrder,
        payment: paymentResult,
      });
    } else {
      // Payment failed: Rollback the transaction, and cancel the order
      savedOrder.paymentStatus = "failed";
      savedOrder.orderStatus = "cancelled";
      await savedOrder.save({ session });

      await Tracking.create(
        [
          {
            orderId: savedOrder._id,
            status: "cancelled",
            notes: "Order cancelled due to payment failure",
          },
        ],
        { session }
      );

      // Rollback the transaction
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        error: "Payment failed",
        details: paymentResult,
      });
    }
  } catch (error) {
    // Rollback in case of an error
    await session.abortTransaction();
    logger.error("Error creating order:", error);
    next(error);
  } finally {
    session.endSession();
  }
};

// Get order by ID with tracking history
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("restaurantId", "name address contactNumber")
      .populate("deliveryAgentId", "name phone")
      .populate("trackingHistory");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check authorization
    if (
      !validateOrderAccess(
        order,
        req.user.id,
        req.user.role,
        req.user.restaurantId
      )
    ) {
      return res.status(403).json({ error: "Unauthorized to view this order" });
    }

    res.status(200).json(order);
  } catch (error) {
    logger.error("Error fetching order:", error);
    next(error);
  }
};

// Get orders by user
exports.getOrdersByUser = async (req, res, next) => {
  try {
    // Only allow users to view their own orders (or admin)
    if (req.params.userId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to view these orders" });
    }

    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("restaurantId", "name logo");

    res.status(200).json(orders);
  } catch (error) {
    logger.error("Error fetching user orders:", error);
    next(error);
  }
};

// Get orders by restaurant
exports.getOrdersByRestaurant = async (req, res, next) => {
  try {
    // Verify the requesting user owns the restaurant or is admin
    if (
      req.params.restaurantId !== req.user.restaurantId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Unauthorized to view these orders" });
    }

    const { status, startDate, endDate } = req.query;
    const query = { restaurantId: req.params.restaurantId };

    if (status) query.orderStatus = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("userId", "name phone");

    res.status(200).json(orders);
  } catch (error) {
    logger.error("Error fetching restaurant orders:", error);
    next(error);
  }
};

// Update order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready_for_delivery",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check authorization
    const isRestaurantAdmin =
      req.user.role === "restaurant" &&
      order.restaurantId.toString() === req.user.restaurantId;
    const isDeliveryAgent =
      req.user.role === "delivery" &&
      order.deliveryAgentId?.toString() === req.user.id;

    if (!isRestaurantAdmin && !isDeliveryAgent && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this order" });
    }

    // Special case - only restaurant can mark as preparing/ready
    if (
      ["preparing", "ready_for_delivery"].includes(status) &&
      !isRestaurantAdmin &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Only restaurant can update to this status" });
    }

    // Special case - only delivery agent can mark as out_for_delivery/delivered
    if (
      ["out_for_delivery", "delivered"].includes(status) &&
      !isDeliveryAgent &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Only delivery agent can update to this status" });
    }

    // Update order status
    const previousStatus = order.orderStatus;
    order.orderStatus = status;

    // Set delivery agent if status is ready_for_delivery and no agent assigned
    if (status === "ready_for_delivery" && !order.deliveryAgentId) {
      // In a real implementation, you would assign a delivery agent here
      // For now, we'll just set a placeholder
      order.deliveryAgentId = "DELIVERY_AGENT_ID_PLACEHOLDER";
    }

    await order.save();

    // Create tracking record
    await Tracking.create({
      orderId: order._id,
      status,
      notes: notes || `Status changed from ${previousStatus} to ${status}`,
    });

    // Notify user if status is changed to out_for_delivery or delivered
    if (status === "out_for_delivery" || status === "delivered") {
      await sendNotification({
        recipientId: order.userId,
        message: `Your order #${order._id} is now ${status.replace(/_/g, " ")}`,
        type: "order_status_update",
      });
    }

    res.status(200).json(order);
  } catch (error) {
    logger.error("Error updating order status:", error);
    next(error);
  }
};

// Cancel order
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check authorization - only the user who placed the order or admin can cancel
    if (order.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to cancel this order" });
    }

    // Check if order can be cancelled (only pending or confirmed orders)
    if (!["pending", "confirmed"].includes(order.orderStatus)) {
      return res
        .status(400)
        .json({ error: "Order cannot be cancelled at this stage" });
    }

    // Update order status
    order.orderStatus = "cancelled";
    await order.save();

    // Create tracking record
    await Tracking.create({
      orderId: order._id,
      status: "cancelled",
      notes:
        req.user.role === "admin"
          ? "Order cancelled by admin"
          : "Order cancelled by customer",
    });

    // Initiate refund if payment was completed
    if (order.paymentStatus === "completed") {
      await processRefund(order._id, order.totalAmount);
    }

    // Notify restaurant
    await sendNotification({
      recipientId: order.restaurantId,
      message: `Order #${order._id} has been cancelled`,
      type: "order_cancellation",
    });

    res
      .status(200)
      .json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    logger.error("Error cancelling order:", error);
    next(error);
  }
};

// Assign delivery agent to order
exports.assignDeliveryAgent = async (req, res, next) => {
  try {
    const { deliveryAgentId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only restaurant admin or system admin can assign delivery agents
    const isRestaurantAdmin =
      req.user.role === "restaurant" &&
      order.restaurantId.toString() === req.user.restaurantId;
    if (!isRestaurantAdmin && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to assign delivery agent" });
    }

    // Only assign to orders that are ready for delivery
    if (order.orderStatus !== "ready_for_delivery") {
      return res.status(400).json({ error: "Order is not ready for delivery" });
    }

    order.deliveryAgentId = deliveryAgentId;
    order.orderStatus = "out_for_delivery";
    await order.save();

    // Create tracking record
    await Tracking.create({
      orderId: order._id,
      status: "out_for_delivery",
      notes: `Delivery assigned to agent ${deliveryAgentId}`,
    });

    // Notify delivery agent
    await sendNotification({
      recipientId: deliveryAgentId,
      message: `New delivery assigned: Order #${order._id}`,
      type: "delivery_assignment",
    });

    // Notify customer
    await sendNotification({
      recipientId: order.userId,
      message: `Your order #${order._id} is out for delivery`,
      type: "order_status_update",
    });

    res.status(200).json(order);
  } catch (error) {
    logger.error("Error assigning delivery agent:", error);
    next(error);
  }
};
