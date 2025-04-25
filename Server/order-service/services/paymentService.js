// order-service/services/paymentService.js
const axios = require("axios");

const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:3001";

// Create a payment for an order
const createPayment = async (
  orderId,
  amount,
  customerId,
  description,
  token
) => {
  try {
    console.log("Creating payment with token:", token); // Debug log
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments`,
      {
        orderId,
        amount,
        customerId,
        description,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

// Update order with payment status
const updateOrderPaymentStatus = async (orderId, paymentStatus) => {
  try {
    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Update payment status
    order.paymentStatus = paymentStatus;

    // If payment is successful, update order status accordingly
    if (paymentStatus === "SUCCESSFUL") {
      order.status = "CONFIRMED";

      // Notify restaurants about confirmed order
      for (const subOrder of order.subOrders) {
        await restaurantService.notifyOrderConfirmation(
          subOrder.restaurantId,
          orderId,
          subOrder._id
        );
      }

      // Notify customer about confirmed order
      await notificationService.sendNotification(
        order.customerId,
        "order_confirmed",
        `Your order #${order._id} has been confirmed and is being prepared`,
        { orderId: order._id }
      );
    } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELED") {
      order.status = "CANCELLED";

      // Notify customer about cancelled order
      await notificationService.sendNotification(
        order.customerId,
        "order_cancelled",
        `Your order #${order._id} has been cancelled due to payment issues`,
        { orderId: order._id }
      );
    }

    await order.save();

    return order;
  } catch (error) {
    console.error("Error updating order payment status:", error);
    throw error;
  }
};

module.exports = {
  createPayment,
  updateOrderPaymentStatus,
};
