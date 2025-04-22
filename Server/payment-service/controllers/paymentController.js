const Payment = require("../models/Payment");
const paymentService = require("../services/paymentService");
const notificationService = require("../services/notificationService");
const axios = require("axios");
require("dotenv").config();

// Create a new payment
const createPayment = async (req, res, next) => {
  try {
    const { orderId, amount, customerId, description } = req.body;

    // Validate required fields
    if (!orderId || !amount || !customerId) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["orderId", "amount", "customerId"],
      });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment) {
      return res.status(400).json({
        message: "Payment already exists for this order",
        paymentId: existingPayment._id,
      });
    }

    // Fetch customer info from user service using the user's token
    let customerInfo;
    try {
      // Extract the token part from the Authorization header
      const authHeader = req.headers.authorization;
      const token =
        authHeader &&
        typeof authHeader === "string" &&
        authHeader.startsWith("Bearer ")
          ? authHeader.split(" ")[1]
          : null;

      if (!token) {
        throw new Error("No valid authorization token provided");
      }

      // Use the /me endpoint with the user's token
      const response = await axios.get(
        `${process.env.USER_SERVICE_URL}/api/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      customerInfo = response.data.data.user;
    } catch (error) {
      console.error("Error fetching customer info:", error);
      // Use fallback data instead of failing
      customerInfo = {
        name: "Customer",
        phone: "Unknown",
      };
    }

    // Convert description to string if it's an object
    const descriptionStr =
      typeof description === "object"
        ? JSON.stringify(description)
        : description || `Payment for order #${orderId}`;

    // Create payment record (without items field)
    const payment = new Payment({
      orderId,
      customerId,
      amount,
      currency: req.body.currency || "LKR",
      description: descriptionStr,
    });

    const savedPayment = await payment.save();

    // Generate payment parameters
    const paymentParams = paymentService.generatePaymentParams(
      orderId,
      amount,
      payment.currency,
      `Order #${orderId}`, // Simple description instead of items array
      customerId,
      customerInfo
    );

    // Generate payment URL
    const paymentUrl = paymentService.getPaymentUrl(paymentParams);

    res.status(201).json({
      paymentId: savedPayment._id,
      checkoutUrl: paymentUrl,
      paymentParams: paymentParams,
    });
  } catch (error) {
    next(error);
  }
};

// Process payment notification from PayHere
const processNotification = async (req, res, next) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      method,
    } = req.body;

    console.log("Payment notification received:", {
      order_id,
      payment_id,
      status_code,
    });

    // Verify the signature
    const isValidSignature = paymentService.verifyPaymentSignature(
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig
    );

    if (!isValidSignature) {
      console.error("Invalid payment signature for order:", order_id);
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Find the payment
    const payment = await Payment.findOne({ orderId: order_id });
    if (!payment) {
      console.error("Payment not found for order:", order_id);
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment status based on status code
    let paymentStatus;
    switch (status_code) {
      case "2":
        paymentStatus = "completed";
        break;
      case "0":
        paymentStatus = "pending";
        break;
      case "-1":
        paymentStatus = "cancelled";
        break;
      case "-2":
        paymentStatus = "failed";
        break;
      case "-3":
        paymentStatus = "chargedback";
        break;
      default:
        paymentStatus = "pending";
    }

    // Update payment record
    payment.status = paymentStatus;
    payment.paymentId = payment_id;
    payment.paymentMethod = method;
    payment.statusCode = status_code;
    payment.md5sig = md5sig;
    await payment.save();

    // Notify order service about payment status
    await notificationService.notifyOrderService(
      order_id,
      paymentStatus,
      payment_id
    );

    // Respond to PayHere
    res.status(200).send("Payment notification received");
  } catch (error) {
    console.error("Error processing payment notification:", error);
    next(error);
  }
};

// Get payment by ID
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
};

// Get payment by order ID
const getPaymentByOrderId = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
};

// Get payments by customer ID
const getPaymentsByCustomerId = async (req, res, next) => {
  try {
    const payments = await Payment.find({ customerId: req.params.customerId });
    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
};

// Process refund
const processRefund = async (req, res, next) => {
  try {
    const { paymentId, amount, reason } = req.body;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Only completed payments can be refunded" });
    }

    // In a real implementation, you would call PayHere's refund API here
    // For sandbox, we'll just update the status
    payment.status = "refunded";
    await payment.save();

    // Notify order service about refund
    await notificationService.notifyOrderService(
      payment.orderId,
      "refunded",
      payment.paymentId
    );

    res.status(200).json({ message: "Refund processed successfully", payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  processNotification,
  getPaymentById,
  getPaymentByOrderId,
  getPaymentsByCustomerId,
  processRefund,
};
