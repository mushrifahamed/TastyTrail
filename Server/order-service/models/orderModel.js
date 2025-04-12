const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  specialInstructions: { type: String },
});

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    restaurantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Restaurant",
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["credit_card", "debit_card", "paypal", "cash_on_delivery"],
    },
    paymentStatus: {
      type: String,
      default: "pending",
      enum: ["pending", "completed", "failed", "refunded"],
    },
    orderStatus: {
      type: String,
      default: "pending",
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready_for_delivery",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
    },
    deliveryAgentId: { type: Schema.Types.ObjectId, ref: "DeliveryAgent" },
    estimatedDeliveryTime: { type: Date },
    actualDeliveryTime: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate tracking history
orderSchema.virtual("trackingHistory", {
  ref: "Tracking",
  localField: "_id",
  foreignField: "orderId",
});

// Update the updatedAt field before saving
orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
