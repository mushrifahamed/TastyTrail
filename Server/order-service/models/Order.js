const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Restaurant",
  },
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "picked_up",
      "delivered",
      "cancelled",
    ],
    default: "pending",
  },
});

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Restaurant",
  },
  customerInfo: {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  items: [orderItemSchema],
  deliveryAddress: {
    type: String,
    required: true,
  },
  deliveryLocation: {
    type: {
      type: String,
      default: "Point",
    },
    coordinates: [Number], // [longitude, latitude]
  },
  deliveryPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  paymentId: {
    type: String,
  },
  trackingStatus: {
    type: String,
    enum: [
      "placed",
      "confirmed",
      "preparing",
      "ready_for_pickup",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ],
    default: "placed",
  },
  statusUpdates: [
    {
      status: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      note: String,
    },
  ],
  estimatedDeliveryTime: {
    preparationTime: Number,
    travelTime: Number,
    totalEstimatedTime: Number,
    estimatedDeliveryAt: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Order", orderSchema);
