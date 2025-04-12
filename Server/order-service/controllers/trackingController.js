const Tracking = require("../models/trackingModel");
const Order = require("../models/orderModel");
const logger = require("../config/logger");

// Get tracking history for an order
exports.getTrackingHistory = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;

    // First verify the order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check authorization
    const isCustomer = order.userId.toString() === req.user.id;
    const isRestaurantAdmin =
      req.user.role === "restaurant" &&
      order.restaurantId.toString() === req.user.restaurantId;
    const isDeliveryAgent =
      req.user.role === "delivery" &&
      order.deliveryAgentId?.toString() === req.user.id;

    if (
      !isCustomer &&
      !isRestaurantAdmin &&
      !isDeliveryAgent &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Unauthorized to view this tracking information" });
    }

    // Get tracking history
    const trackingHistory = await Tracking.find({ orderId }).sort({
      timestamp: 1,
    });

    res.status(200).json(trackingHistory);
  } catch (error) {
    logger.error("Error fetching tracking history:", error);
    next(error);
  }
};

// Add tracking note (for restaurant admin or delivery agent)
exports.addTrackingNote = async (req, res, next) => {
  try {
    const { orderId, notes } = req.body;

    if (!orderId || !notes) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify the order exists
    const order = await Order.findById(orderId);
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
        .json({ error: "Unauthorized to add tracking notes" });
    }

    // Create new tracking record
    const tracking = new Tracking({
      orderId,
      status: order.orderStatus,
      notes,
    });
    await tracking.save();

    res.status(201).json(tracking);
  } catch (error) {
    logger.error("Error adding tracking note:", error);
    next(error);
  }
};

// Get current status of an order
exports.getCurrentStatus = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;

    // Verify the order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check authorization
    const isCustomer = order.userId.toString() === req.user.id;
    const isRestaurantAdmin =
      req.user.role === "restaurant" &&
      order.restaurantId.toString() === req.user.restaurantId;
    const isDeliveryAgent =
      req.user.role === "delivery" &&
      order.deliveryAgentId?.toString() === req.user.id;

    if (
      !isCustomer &&
      !isRestaurantAdmin &&
      !isDeliveryAgent &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Unauthorized to view this order status" });
    }

    // Get the most recent tracking record
    const latestTracking = await Tracking.findOne({ orderId }).sort({
      timestamp: -1,
    });

    res.status(200).json({
      orderId,
      status: order.orderStatus,
      lastUpdated: latestTracking?.timestamp || order.updatedAt,
      lastNote: latestTracking?.notes,
    });
  } catch (error) {
    logger.error("Error fetching current status:", error);
    next(error);
  }
};
