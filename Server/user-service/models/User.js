const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide your name"],
    trim: true,
  },
  email: {
    type: String,
    required: function () {
      return this.role !== "delivery_personnel"; // Delivery can register with phone only
    },
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  phone: {
    type: String,
    required: [true, "Please provide your phone number"],
    unique: true,
    validate: {
      validator: function (v) {
        return /^\+?[\d\s-]{10,}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  password: {
    type: String,
    required: function () {
      return this.role !== "delivery_personnel"; // Temporary for delivery until approved
    },
    minlength: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ["customer", "restaurant_admin", "delivery_personnel", "admin"],
    default: "customer",
  },
  address: {
    type: String,
    required: function () {
      return this.role === "customer";
    },
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: function () {
      return this.role === "restaurant_admin";
    },
  },
  isActive: {
    type: Boolean,
    default: false, // Default false for delivery and restaurant admins (needs approval)
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "active"],
    default: function () {
      if (this.role === "delivery_personnel") return "pending";
      if (this.role === "restaurant_admin") return "pending";
      return "active";
    },
  },
  // Delivery personnel specific fields
  nicOrLicense: {
    type: String,
    required: function () {
      return this.role === "delivery_personnel";
    },
  },
  vehicleInfo: {
    type: {
      type: String,
      enum: ["bike", "car", "scooter", "bicycle"],
      required: function () {
        return this.role === "delivery_personnel";
      },
    },
    number: {
      type: String,
      required: function () {
        return this.role === "delivery_personnel";
      },
    },
  },
  documents: [
    {
      type: String, // URLs to uploaded documents
      required: function () {
        return this.role === "delivery_personnel";
      },
    },
  ],
  // Verification fields
  emailVerified: {
    type: Boolean,
    default: false,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("User", userSchema);
