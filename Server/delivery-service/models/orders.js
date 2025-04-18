const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPerson', default: null },
  deliveryLocation: String,
  deliveryTime: Date,
});

module.exports = mongoose.model('Order', orderSchema);
