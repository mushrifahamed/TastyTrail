const axios = require("axios");
require("dotenv").config();

const { USER_SERVICE_URL } = process.env;

module.exports = {
  getUserInfo: async (userId, token) => {
    try {
      // Use the correct endpoint
      const response = await axios.get(`${USER_SERVICE_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data.user;
    } catch (error) {
      console.error("Error fetching user info:", error);
      // Implement fallback mechanism
      try {
        // Try to get user by ID as fallback
        const fallbackResponse = await axios.get(
          `${USER_SERVICE_URL}/api/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        return fallbackResponse.data.data.user;
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        throw error; // Throw the original error
      }
    }
  },
  verifyDeliveryPerson: async (userId, token) => {
    try {
      const response = await axios.get(`${USER_SERVICE_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if the user has the delivery_personnel role
      return response.data.data.user.role === "delivery_personnel";
    } catch (error) {
      console.error("Error verifying delivery person:", error);
      return false;
    }
  },
};
