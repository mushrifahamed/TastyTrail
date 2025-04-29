const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId }, // Link to original Order
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },

  items: [
    {
      menuItemId: { type: String },
      name: { type: String },
      price: { type: Number },
      quantity: { type: Number },
    }
  ],

  deliveryAddress: { type: String, required: true },
  deliveryLocation: {
    type: {
      lat: { type: Number },
      lng: { type: Number },
    },
    required: false,
  },

  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },

  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },

  estimatedDeliveryTime: { type: Date },
  deliveryTime: { type: Date }, // actual delivered time

  deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPerson', default: null },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DeliveryOrder', orderSchema);
