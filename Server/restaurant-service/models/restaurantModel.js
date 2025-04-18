const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
});

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  address: {
    street: String,
    city: String,
    country: String,
    geoCoordinates: {
      type: { type: String, default: 'Point' },
      coordinates: [Number], // [longitude, latitude]
    },
  },
  menu: [menuItemSchema],
  availability: { type: Boolean, default: true },
  operatingHours: {
    from: { type: String },
    to: { type: String },
  },
  rating: { type: Number, default: 0 },
});

restaurantSchema.index({ 'address.geoCoordinates': '2dsphere' });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;