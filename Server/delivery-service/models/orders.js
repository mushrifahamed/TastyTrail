const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId }, // Reference to original order
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerInfo: {
    name: { type: String },
    phone: { type: String },
  },

  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },

  items: [
    {
      restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
      menuItemId: { type: String },
      name: { type: String },
      price: { type: Number },
      quantity: { type: Number },
      status: { type: String }, // e.g., pending, preparing
    }
  ],

  deliveryAddress: { type: String, required: true },
  deliveryLocation: {
    type: {
      type: String, // Should always be "Point"
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },

  totalAmount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },

  status: {
    type: String,
    enum: ['Pending','Assigned','Accepted','Picked Up', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },

  estimatedDeliveryTime: {
    type: mongoose.Schema.Types.Mixed // supports either object or Date
  },

  deliveryTime: { type: Date }, // Actual delivered time
  deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPerson', default: null },

  createdAt: { type: Date, default: Date.now },
});

// Index for geospatial queries if needed
orderSchema.index({ deliveryLocation: '2dsphere' });

module.exports = mongoose.model('DeliveryOrder', orderSchema);
