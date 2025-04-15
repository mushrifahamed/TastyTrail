const User = require("../models/User");
const jwt = require("jsonwebtoken");
const authService = require("../services/authService");
const notificationService = require("../services/notificationService");
const passwordUtils = require("../utils/passwordUtils");
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

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
const requestRestaurantAdminAccess = async (req, res, next) => {
  try {
    const { name, email, phone, restaurantName, licenseNumber, address } =
      req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email or phone already in use" });
    }

    const restaurantAdmin = await User.create({
      name,
      email,
      phone,
      role: "restaurant_admin",
      isActive: false,
      status: "pending",
      restaurantDetails: {
        name: restaurantName,
        licenseNumber,
        address,
      },
    });

    // Notify super admin about new request
    await notificationService.sendAdminNotification(
      "New restaurant admin request",
      `New restaurant admin request from ${restaurantName}`
    );

    res.status(201).json({
      status: "success",
      message: "Request submitted for approval",
      data: {
        user: {
          _id: restaurantAdmin._id,
          name: restaurantAdmin.name,
          email: restaurantAdmin.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

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

    // Send welcome email with temporary password
    await notificationService.sendWelcomeNotification(
      user._id,
      user.email,
      "Your restaurant admin account has been approved"
    );

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
    });

    // Generate verification token
    const token = authService.generateToken(customer._id, customer.role);

    // Send verification email
    await notificationService.sendVerificationEmail(customer.email, token);

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
const registerDeliveryPerson = async (req, res, next) => {
  try {
    const { name, phone, nicOrLicense, vehicleType, vehicleNumber } = req.body;
    const documents = req.files?.map((file) => file.path); // Assuming you're using multer

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    const deliveryPerson = await User.create({
      name,
      phone,
      role: "delivery_personnel",
      nicOrLicense,
      vehicleInfo: {
        type: vehicleType,
        number: vehicleNumber,
      },
      documents,
      status: "pending",
      isActive: false,
    });

    // Notify admin about new delivery person registration
    await notificationService.sendAdminNotification(
      "New delivery person registration",
      `New delivery person ${name} registered and pending approval`
    );

    res.status(201).json({
      status: "success",
      message: "Registration submitted for approval",
      data: {
        user: {
          _id: deliveryPerson._id,
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

    // Send approval notification with temporary password
    await notificationService.sendSMSNotification(
      deliveryPerson.phone,
      `Your delivery account has been approved. Temporary password: ${tempPassword}`
    );

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
    const user = await User.findById(req.user.id);
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
  // Admin methods
  createAdmin,

  // Restaurant admin methods
  requestRestaurantAdminAccess,
  approveRestaurantAdmin,

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
