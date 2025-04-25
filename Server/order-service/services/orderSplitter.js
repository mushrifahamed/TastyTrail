const _ = require("lodash");

module.exports = {
  // Group items by restaurant
  groupItemsByRestaurant: (items) => {
    return _.groupBy(items, "restaurantId");
  },

  // Calculate total amount for items
  calculateOrderTotal: (items) => {
    return items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  },
};
