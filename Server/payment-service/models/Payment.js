const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    default: "LKR",
    enum: ["LKR"],
  },
  status: {
    type: String,
    enum: [
      "pending",
      "completed",
      "failed",
      "refunded",
      "cancelled",
      "chargedback",
    ],
    default: "pending",
  },
  paymentId: {
    type: String,
  },
  paymentMethod: {
    type: String,
  },
  statusCode: {
    type: String,
  },
  description: {
    type: String,
  },
  hash: {
    type: String,
  },
  md5sig: {
    type: String,
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

paymentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
