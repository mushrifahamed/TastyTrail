const axios = require("axios");
const { RESTAURANT_SERVICE_URL } = process.env;

module.exports = {
  calculateEstimatedTime: async (items, deliveryLocation, restaurantIds) => {
    // 1. Calculate preparation time (10 mins per item)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const preparationTime = totalItems * 10; // in minutes

    // 2. Get restaurant locations from restaurant service
    const restaurantLocations = await Promise.all(
      restaurantIds.map((id) =>
        axios
          .get(`${RESTAURANT_SERVICE_URL}/api/restaurants/${id}`)
          .then((res) => res.data.address.geoCoordinates)
      )
    );

    // 3. Calculate average distance (simple straight-line calculation)
    const distances = restaurantLocations.map((coords) => {
      const [restaurantLong, restaurantLat] = coords.coordinates;
      const [deliveryLong, deliveryLat] = deliveryLocation.coordinates;

      // Haversine formula for distance calculation
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
      return R * c; // Distance in km
    });

    const avgDistance =
      distances.reduce((sum, dist) => sum + dist, 0) / distances.length;

    // 4. Estimate delivery time (assuming 30 km/h average speed)
    const travelTimeMinutes = (avgDistance / 30) * 60;

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
