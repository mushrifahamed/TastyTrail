const User = require("../models/User");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const authService = require("../services/authService");
const { sendEmail } = require("../services/emailService");
const passwordUtils = require("../utils/passwordUtils");
const axios = require("axios");
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;
const amqp = require("amqplib/callback_api");

// ==================== TOKEN VERIFICATION ====================
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user information
    res.status(200).json({
      status: "success",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        // Include any other relevant user info
      },
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    next(error);
  }
};

// ==================== ADMIN METHODS ====================
const createAdmin = async (req, res, next) => {
  try {
    // Only super admin can create other admins
    if (req.user.role !== "admin" || !req.user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to create admins" });
    }

    const { name, email, phone, password } = req.body;

    const admin = await User.create({
      name,
      email,
      phone,
      password: await passwordUtils.hashPassword(password),
      role: "admin",
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== RESTAURANT ADMIN METHODS ====================

// Create a new Restaurant Admin
const createRestaurantAdmin = async (req, res, next) => {
  try {
    console.log("Incoming request body:", req.body); // Log the entire request
    const { name, email, phone, password, restaurantId } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !restaurantId) {
      return res.status(400).json({
        status: "fail",
        message: "Name, email, phone and restaurantId are required",
      });
    }

    // Validate restaurant exists (call restaurant service)
    try {
      const restaurantResponse = await axios.get(
        `${process.env.RESTAURANT_SERVICE_URL}/api/restaurants/verify/${restaurantId}`,
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );

      if (
        !restaurantResponse.data ||
        restaurantResponse.data.status !== "success"
      ) {
        return res.status(404).json({
          status: "fail",
          message: "Restaurant not found",
        });
      }
    } catch (err) {
      console.error("Error verifying restaurant:", err);
      return res.status(404).json({
        status: "fail",
        message: "Restaurant verification failed",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "Email or phone already in use",
      });
    }

    // Generate password if not provided
    const adminPassword = password || passwordUtils.generateRandomPassword();

    // Create the restaurant admin
    const restaurantAdmin = await User.create({
      name,
      email,
      phone,
      password: await passwordUtils.hashPassword(adminPassword),
      role: "restaurant_admin",
      isActive: true,
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
      emailVerified: true,
      phoneVerified: true,
    });

    // Remove sensitive data before sending response
    restaurantAdmin.password = undefined;

    // Send welcome email
    try {
      await sendEmail(
        email,
        "Welcome as Restaurant Admin",
        `Hello ${name},\n\nYou have been assigned as the admin for restaurant ${restaurantId}.\n\nYour login credentials:\nEmail: ${email}\nPassword: ${adminPassword}`
      );
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    res.status(201).json({
      status: "success",
      data: {
        user: restaurantAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Admins by Restaurant
const getAdminsByRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid restaurant ID format",
      });
    }

    const admins = await User.find({
      role: "restaurant_admin",
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
    }).select("-password -__v");

    res.status(200).json({
      status: "success",
      results: admins.length,
      data: {
        admins,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove Restaurant Admin
const removeRestaurantAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid admin ID format",
      });
    }

    const admin = await User.findOneAndDelete({
      _id: adminId,
      role: "restaurant_admin",
    });

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Restaurant admin not found",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// const requestRestaurantAdminAccess = async (req, res, next) => {
//   try {
//     const { name, email, phone, restaurantName, licenseNumber, address } =
//       req.body;

//     const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
//     if (existingUser) {
//       return res.status(400).json({ message: "Email or phone already in use" });
//     }

//     const restaurantAdmin = await User.create({
//       name,
//       email,
//       phone,
//       role: "restaurant_admin",
//       isActive: false,
//       status: "pending",
//       phoneVerified: true, // Automatically verify phone without OTP
//       restaurantDetails: {
//         name: restaurantName,
//         licenseNumber,
//         address,
//       },
//     });

//     if (email) {
//       await sendEmail(
//         restaurantAdmin.email,
//         "New restaurant admin request",
//         `New restaurant admin request from ${restaurantName}`
//       );
//     }
//     // // Notify super admin about new request
//     // await notificationService.sendAdminNotification(
//     //   "New restaurant admin request",
//     //   `New restaurant admin request from ${restaurantName}`
//     // );

//     res.status(201).json({
//       status: "success",
//       message: "Request submitted for approval",
//       data: {
//         user: {
//           _id: restaurantAdmin._id,
//           name: restaurantAdmin.name,
//           email: restaurantAdmin.email,
//         },
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// Approve Restaurant Admin
const approveRestaurantAdmin = async (req, res, next) => {
  try {
    const { userId, restaurantId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: true,
        status: "approved",
        restaurantId,
        password: await passwordUtils.hashPassword(
          passwordUtils.generateRandomPassword()
        ),
      },
      { new: true }
    );

    if (email) {
      await sendEmail(
        user._id,
        user.email,
        "Your restaurant admin account has been approved"
      );
    }
    // Send welcome email with temporary password
    // await notificationService.sendWelcomeNotification(
    //   user._id,
    //   user.email,
    //   "Your restaurant admin account has been approved"
    // );

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CUSTOMER METHODS ====================
const registerCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, password, address } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email or phone already in use" });
    }

    const customer = await User.create({
      name,
      email,
      phone,
      password: await passwordUtils.hashPassword(password),
      role: "customer",
      address,
      isActive: true,
      phoneVerified: true,
    });

    // Generate JWT token
    const token = authService.generateToken(customer._id, customer.role);

    // Send welcome email (no OTP)
    if (email) {
      await sendEmail(
        customer.email,
        "Welcome to TastyTrail!",
        `Hello ${customer.name},\n\nThank you for registering at TastyTrail!`
      );
    }

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          role: customer.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELIVERY PERSONNEL METHODS ====================
// Function to register a new Delivery Person
const registerDeliveryPerson = async (req, res, next) => {
  try {
    const {
      name,
      password,
      phone,
      nicOrLicense,
      vehicleType,
      vehicleNumber,
      documents,
    } = req.body;

    // Check if the phone number is already in use
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    // Create the new delivery person in the User model
    const deliveryPerson = await User.create({
      name,
      password: await passwordUtils.hashPassword(password),
      phone,
      role: "delivery_personnel",
      nicOrLicense,
      vehicleInfo: {
        type: vehicleType,
        number: vehicleNumber,
      },
      documents, // URL paths to the uploaded documents
      status: "pending", // Default status for delivery person (needs approval)
      isActive: false, // Default is inactive until approved
      phoneVerified: true, // Assuming phone is verified automatically
    });

    // Publish the event to RabbitMQ after the delivery person is created
    publishDeliveryPersonEvent(deliveryPerson);

    res.status(201).json({
      status: "success",
      message: "Delivery person registration submitted for approval",
      data: {
        user: {
          _id: deliveryPerson._id,
          password: deliveryPerson.password,
          name: deliveryPerson.name,
          phone: deliveryPerson.phone,
          status: deliveryPerson.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Function to publish a message to RabbitMQ when a delivery person registers
const publishDeliveryPersonEvent = (deliveryPerson) => {
  amqp.connect("amqp://localhost", (error, connection) => {
    if (error) {
      throw error;
    }

    connection.createChannel((error, channel) => {
      if (error) {
        throw error;
      }

      const queue = "delivery_person_registered_queue"; // Queue for delivery person registration
      const message = JSON.stringify({
        deliveryPersonId: deliveryPerson._id,
        name: deliveryPerson.name,
        phone: deliveryPerson.phone,
        vehicleType: deliveryPerson.vehicleInfo.type,
        vehicleLicensePlate: deliveryPerson.vehicleInfo.number,
      });

      // Make sure the queue exists and then publish the message
      channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(message), { persistent: true });

      console.log(`Published delivery person registration event: ${message}`);
    });

    setTimeout(() => {
      connection.close();
    }, 500);
  });
};

// ==================== DELIVERY PERSONNEL LOGIN ====================
const loginDeliveryPerson = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password are required" });
    }

    // Find user by phone
    const user = await User.findOne({ phone }).select("+password");

    if (!user) {
      return res.status(404).json({ message: "Delivery personnel not found" });
    }

    // Check role
    if (user.role !== "delivery_personnel") {
      return res.status(403).json({ message: "Access denied. Only delivery personnel can login." });
    }

    // Validate password
    const isPasswordValid = await passwordUtils.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid phone or password" });
    }

    // Check if active
    // if (!user.isActive) {
    //   return res.status(403).json({ message: "Account not active. Please wait for admin approval." });
    // }

    // Generate JWT
    const token = authService.generateToken(user._id, user.role);

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  registerDeliveryPerson,
  // other methods...
};

const approveDeliveryPerson = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const tempPassword = passwordUtils.generateRandomPassword();
    const deliveryPerson = await User.findByIdAndUpdate(
      userId,
      {
        isActive: true,
        status: "approved",
        password: await passwordUtils.hashPassword(tempPassword),
      },
      { new: true }
    );

    // // Send approval notification with temporary password
    // await notificationService.sendSMSNotification(
    //   deliveryPerson.phone,
    //   `Your delivery account has been approved. Temporary password: ${tempPassword}`
    // );

    res.status(200).json({
      status: "success",
      data: {
        user: deliveryPerson,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== COMMON METHODS ====================
const login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    // Find user by email or phone
    let user;
    if (email) {
      user = await User.findOne({ email }).select("+password");
    } else if (phone) {
      user = await User.findOne({ phone }).select("+password");
    } else {
      return res.status(400).json({ message: "Email or phone required" });
    }

    if (
      !user ||
      !(await passwordUtils.comparePassword(password, user.password))
    ) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        message: "Account not active",
        details:
          user.role === "delivery_personnel"
            ? "Pending admin approval"
            : "Account deactivated",
      });
    }

    // Role-specific checks
    if (user.role === "restaurant_admin" && !user.restaurantId) {
      return res
        .status(403)
        .json({ message: "Restaurant admin not assigned to a restaurant" });
    }

    // Generate JWT token
    const token = authService.generateToken(user._id, user.role);

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateMe = async (req, res, next) => {
  try {
    // Filter out unwanted fields
    const filteredBody = {};
    const allowedFields = ["name", "email", "phone", "address"];
    allowedFields.forEach((field) => {
      if (req.body[field]) filteredBody[field] = req.body[field];
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID (admin only)
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getMe = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ status: "success", data: { user } });
  } catch (error) {
    next(error);
  }
};

// Update user (admin only)
const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyToken,
  // Admin methods
  createAdmin,

  // Restaurant admin methods
  // requestRestaurantAdminAccess,
  approveRestaurantAdmin,
  createRestaurantAdmin,
  getAdminsByRestaurant,
  removeRestaurantAdmin,
  loginDeliveryPerson,
  // Customer methods
  registerCustomer,

  // Delivery methods
  registerDeliveryPerson,
  approveDeliveryPerson,

  // Common methods
  login,
  getMe,
  updateMe,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
};
