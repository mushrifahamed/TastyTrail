const axios = require("axios");
const { RESTAURANT_SERVICE_URL } = process.env;

module.exports = {
  calculateEstimatedTime: async (items, deliveryLocation, restaurantId) => {
    if (!items || !Array.isArray(items)) {
      console.log("Warning: items is undefined or not an array");
      return { estimatedTime: 30 }; // Default value
    }
    if (!restaurantId) {
      throw new Error("restaurantId is required for estimation");
    }

    console.log("Calculating estimated time for items:", items);
    console.log("restaurantId:", restaurantId);

    // 1. Calculate preparation time (10 mins per item)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const preparationTime = totalItems * 10; // in minutes

    // 2. Get restaurant location from restaurant service
    const restaurantLocation = await axios
      .get(`${RESTAURANT_SERVICE_URL}/api/restaurants/${restaurantId}`)
      .then((res) => res.data.address.geoCoordinates);

    // 3. Calculate distance (simple straight-line calculation)
    const [restaurantLong, restaurantLat] = restaurantLocation.coordinates;
    const [deliveryLong, deliveryLat] = deliveryLocation.coordinates;

    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = ((deliveryLat - restaurantLat) * Math.PI) / 180;
    const dLon = ((deliveryLong - restaurantLong) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((restaurantLat * Math.PI) / 180) *
        Math.cos((deliveryLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    // 4. Estimate delivery time (assuming 30 km/h average speed)
    const travelTimeMinutes = (distance / 30) * 60;

    // 5. Total estimated time
    return {
      preparationTime,
      travelTime: Math.round(travelTimeMinutes),
      totalEstimatedTime: Math.round(preparationTime + travelTimeMinutes),
      estimatedDeliveryAt: new Date(
        Date.now() + (preparationTime + travelTimeMinutes) * 60 * 1000
      ),
    };
  },
};
