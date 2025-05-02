const mongoose = require('mongoose');

const deliveryPersonSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, default: 'delivery_personnel' },
  isActive: { type: Boolean, default: false },
  status: { type: String, default: 'pending' },
  nicOrLicense: { type: String, required: true },
  vehicleInfo: {
    type: {
      type: String,
      required: true
    },
    number: {
      type: String,
      required: true
    }
  },
  documents: {
    type: [String],
    default: []
  },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeliveryPerson', deliveryPersonSchema);
