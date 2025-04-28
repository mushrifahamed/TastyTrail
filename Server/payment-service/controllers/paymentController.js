const Payment = require("../models/Payment");
const paymentService = require("../services/paymentService");
const notificationService = require("../services/notificationService");
const axios = require("axios");
require("dotenv").config();

// // Create a new payment
// const createPayment = async (req, res, next) => {
//   try {
//     const { orderId, amount, customerId, description, paymentMethod } =
//       req.body;

//     // Validate required fields
//     if (!orderId || !amount || !customerId) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         required: ["orderId", "amount", "customerId"],
//       });
//     }

//     // Check if payment already exists for this order
//     const existingPayment = await Payment.findOne({ orderId });
//     if (existingPayment) {
//       return res.status(400).json({
//         message: "Payment already exists for this order",
//         paymentId: existingPayment._id,
//       });
//     }

//     // Fetch customer info from user service using the user's token
//     let customerInfo;
//     try {
//       // Extract the token part from the Authorization header
//       const authHeader = req.headers.authorization;
//       const token =
//         authHeader &&
//         typeof authHeader === "string" &&
//         authHeader.startsWith("Bearer ")
//           ? authHeader.split(" ")[1]
//           : null;

//       if (!token) {
//         throw new Error("No valid authorization token provided");
//       }

//       // Use the /me endpoint with the user's token
//       const response = await axios.get(
//         `${process.env.USER_SERVICE_URL}/api/users/me`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       customerInfo = response.data.data.user;
//     } catch (error) {
//       console.error("Error fetching customer info:", error);
//       // Use fallback data instead of failing
//       customerInfo = {
//         name: "Customer",
//         phone: "Unknown",
//       };
//     }

//     // Convert description to string if it's an object
//     const descriptionStr =
//       typeof description === "object"
//         ? JSON.stringify(description)
//         : description || `Payment for order #${orderId}`;

//     // Create payment record (without items field)
//     const payment = new Payment({
//       orderId,
//       customerId,
//       amount,
//       currency: req.body.currency || "LKR",
//       description: descriptionStr,
//       paymentMethod: paymentMethod,
//     });

//     // Handle payment methods differently
//     if (paymentMethod === "cash") {
//       // For cash payments, create payment record with pending status
//       payment.status = "pending";
//       const savedPayment = await payment.save();

//       res.status(201).json({
//         paymentId: savedPayment._id,
//         status: "pending",
//       });
//     } else if (paymentMethod === "card") {
//       // For card payments, generate PayHere parameters
//       const savedPayment = await payment.save();

//       // Generate payment parameters and URL for PayHere
//       const paymentParams = paymentService.generatePaymentParams(
//         orderId,
//         amount,
//         payment.currency,
//         descriptionStr,
//         customerId,
//         customerInfo,
//         "card"
//       );

//       // Generate payment URL
//       const paymentUrl = paymentService.getPaymentUrl(paymentParams);

//       res.status(201).json({
//         paymentId: savedPayment._id,
//         checkoutUrl: paymentUrl,
//         paymentParams: paymentParams,
//       });
//     }
//   } catch (error) {
//     next(error);
//   }
// };

const createPayment = async (req, res, next) => {
  try {
    const { orderId, amount, customerId, description, paymentMethod } =
      req.body;

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

    // Create payment record (without PayHere integration)
    const payment = new Payment({
      orderId,
      customerId,
      amount,
      currency: req.body.currency || "LKR",
      description: description || `Payment for order #${orderId}`,
      paymentMethod: paymentMethod || "cash",
      status: paymentMethod === "cash" ? "pending" : "pending",
    });

    const savedPayment = await payment.save();

    res.status(201).json({
      paymentId: savedPayment._id,
      status: savedPayment.status,
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

    // Verify the signature...
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

const storePaymentDetails = async (req, res, next) => {
  try {
    const { orderId, paymentId, amount, status } = req.body;

    // Validate required fields
    if (!orderId || !paymentId || !amount || !status) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["orderId", "paymentId", "amount", "status"],
      });
    }

    // Extract bearer token
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    if (!token) {
      return res
        .status(401)
        .json({ message: "No valid authorization token provided" });
    }

    // Get user info using token
    let userInfo;
    try {
      const response = await axios.get(
        `${process.env.USER_SERVICE_URL}/api/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      userInfo = response.data.data.user;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Create or update payment record
    let payment = await Payment.findOne({ orderId });

    if (payment) {
      // Update existing payment
      payment.paymentId = paymentId;
      payment.status = status;
      payment.amount = amount;
      payment.paymentMethod = "card";
      payment.updatedAt = Date.now();
    } else {
      // Create new payment record
      payment = new Payment({
        orderId,
        customerId: userInfo.id, // Use ID from validated token
        paymentId,
        amount,
        currency: "LKR",
        status,
        paymentMethod: "card",
      });
    }

    const savedPayment = await payment.save();

    // Notify order service about payment status using internal API key
    await notificationService.notifyOrderService(orderId, status, paymentId);

    // Get updated order details
    const orderServiceResponse = await axios.get(
      `${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}`,
      {
        headers: {
          "x-api-key": process.env.INTERNAL_API_KEY,
        },
      }
    );

    res.status(201).json({
      message: "Payment details stored successfully",
      payment: savedPayment,
      order: orderServiceResponse.data,
    });
  } catch (error) {
    console.error("Error storing payment details:", error);
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
  storePaymentDetails,
};
