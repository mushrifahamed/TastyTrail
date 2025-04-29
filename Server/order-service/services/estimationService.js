const axios = require("axios");
const { RESTAURANT_SERVICE_URL } = process.env;

const calculateEstimatedTime = async (
  items,
  deliveryLocation,
  restaurantId
) => {
  try {
    console.log("Fetching restaurant details for ID:", restaurantId);

    // Fetch restaurant data from restaurant service
    const response = await axios.get(
      `${RESTAURANT_SERVICE_URL}/api/restaurants/${restaurantId}`
    );

    if (!response.data || !response.data.restaurant) {
      throw new Error("Restaurant data not found");
    }

    const restaurant = response.data.restaurant;
    console.log("Restaurant data received:", restaurant);

    // Validate restaurant has location data
    if (!restaurant.address?.geoCoordinates?.coordinates) {
      throw new Error("Restaurant coordinates not found");
    }

    // Validate delivery location
    if (!deliveryLocation?.coordinates) {
      throw new Error("Delivery coordinates not provided");
    }

    const restaurantCoords = restaurant.address.geoCoordinates.coordinates;
    const deliveryCoords = deliveryLocation.coordinates;

    console.log("Restaurant coordinates:", restaurantCoords);
    console.log("Delivery coordinates:", deliveryCoords);

    // Calculate base preparation time (5 mins per item)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const preparationTime = totalItems * 5;

    // Calculate distance and delivery time
    const distance = calculateDistance(
      restaurantCoords[1], // latitude
      restaurantCoords[0], // longitude
      deliveryCoords[1], // latitude
      deliveryCoords[0] // longitude
    );

    // Assume average speed of 30 km/h
    const deliveryTime = Math.ceil((distance / 30) * 60);

    // Total estimated time in minutes
    const totalEstimatedTime = preparationTime + deliveryTime;

    console.log("Estimated delivery time:", {
      preparationTime,
      deliveryTime,
      totalEstimatedTime,
    });

    return totalEstimatedTime;
  } catch (error) {
    console.error("Error in calculateEstimatedTime:", error);
    throw error;
  }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = {
  calculateEstimatedTime,
};
