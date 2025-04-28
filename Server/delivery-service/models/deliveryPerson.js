const mongoose = require('mongoose');

const deliveryPersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  location: { type: String, default: "Not Provided" }, // Default value for location
  availability: { type: Boolean, default: true },
  vehicleType: { type: String, required: true }, 
  vehicleLicensePlate: { type: String, required: true },
});

module.exports = mongoose.model('DeliveryPerson', deliveryPersonSchema);
