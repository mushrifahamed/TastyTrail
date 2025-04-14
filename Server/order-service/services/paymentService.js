const axios = require("axios");
require("dotenv").config();

const { PAYMENT_SERVICE_URL } = process.env;

module.exports = {
  createPayment: async (orderId, amount, customerId, description) => {
    try {
      const response = await axios.post(`${PAYMENT_SERVICE_URL}/api/payments`, {
        orderId,
        amount,
        customerId,
        description,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  },

  verifyPayment: async (paymentId) => {
    try {
      const response = await axios.get(
        `${PAYMENT_SERVICE_URL}/api/payments/${paymentId}/status`
      );
      return response.data;
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  },
};
