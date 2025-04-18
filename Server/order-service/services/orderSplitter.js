const _ = require("lodash");

module.exports = {
  splitOrderByRestaurant: (items) => {
    // Group items by restaurant
    const groupedItems = _.groupBy(items, "restaurantId");

    // Create sub-orders for each restaurant
    const subOrders = Object.keys(groupedItems).map((restaurantId) => {
      return {
        restaurantId,
        items: groupedItems[restaurantId],
        status: "pending",
      };
    });

    return subOrders;
  },

  calculateOrderTotal: (items) => {
    return items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  },
};
