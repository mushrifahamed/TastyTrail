// Update ./server/payment-service/services/notificationService.js
const axios = require("axios");
require("dotenv").config();

const { ORDER_SERVICE_URL } = process.env;

module.exports = {
  notifyOrderService: async (orderId, paymentStatus, paymentId) => {
    try {
      // Add error handling for missing ORDER_SERVICE_URL
      if (!ORDER_SERVICE_URL) {
        console.error("ORDER_SERVICE_URL not defined in environment variables");
        return false;
      }

      // Use x-api-key instead of Bearer token for internal service communication
      await axios.post(
        `${ORDER_SERVICE_URL}/api/orders/${orderId}/payment-update`,
        {
          paymentStatus,
          paymentId,
        },
        {
          headers: {
            "x-api-key": process.env.INTERNAL_API_KEY,
          },
        }
      );
      console.log(
        `Order service notified about payment ${paymentStatus} for order ${orderId}`
      );
      return true;
    } catch (error) {
      console.error(
        `Error notifying order service about payment ${paymentStatus}:`,
        error.message
      );
      // Don't fail the whole process if notification fails
      return false;
    }
  },
};
