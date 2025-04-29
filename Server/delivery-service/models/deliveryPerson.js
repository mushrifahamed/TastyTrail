const mongoose = require('mongoose');

const deliveryPersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, default: 'delivery_personnel' }, // default to delivery personnel
  isActive: { type: Boolean, default: false },
  status: { type: String, default: 'pending' },
  nicOrLicense: { type: String, required: true },
  vehicleInfo: {
    type: {
      type: String, // vehicleInfo.type
      required: true
    },
    number: {
      type: String, // vehicleInfo.number
      required: true
    }
  },
  documents: {
    type: [String], // array of URLs
    default: []
  },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeliveryPerson', deliveryPersonSchema);
