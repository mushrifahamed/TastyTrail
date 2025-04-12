const mongoose = require('mongoose');
const { Schema } = mongoose;

const trackingSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, required: true, ref: 'Order' },
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled']
  },
  timestamp: { type: Date, default: Date.now },
  notes: { type: String },
});

const Tracking = mongoose.model('Tracking', trackingSchema);

module.exports = Tracking;