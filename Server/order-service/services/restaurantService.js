const axios = require("axios");
require("dotenv").config();

const { RESTAURANT_SERVICE_URL } = process.env;

module.exports = {
  getRestaurantAvailability: async (restaurantId) => {
    try {
      const response = await axios.get(
        `${RESTAURANT_SERVICE_URL}/api/restaurants/${restaurantId}/availability`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching restaurant availability:", error);
      throw error;
    }
  },

  notifyNewOrder: async (restaurantId, orderData) => {
    try {
      await axios.post(
        `${RESTAURANT_SERVICE_URL}/api/restaurants/${restaurantId}/orders`,
        orderData
      );
    } catch (error) {
      console.error("Error notifying restaurant about new order:", error);
      throw error;
    }
  },

  getRestaurantDetails: async (restaurantId) => {
    try {
      const response = await axios.get(
        `${RESTAURANT_SERVICE_URL}/api/restaurants/${restaurantId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching restaurant details:", error);
      throw error;
    }
  },
};
