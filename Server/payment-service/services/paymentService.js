const crypto = require("crypto");
require("dotenv").config();

const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID;
const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET;
const PAYHERE_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.payhere.lk/pay/checkout"
    : "https://sandbox.payhere.lk/pay/checkout";

const generateHash = (orderId, amount, currency) => {
  // Convert amount to string with 2 decimal places
  const amountStr = parseFloat(amount).toFixed(2);

  // Generate hash as per PayHere documentation
  return crypto
    .createHash("md5")
    .update(
      MERCHANT_ID +
        orderId +
        amountStr +
        currency +
        crypto
          .createHash("md5")
          .update(MERCHANT_SECRET)
          .digest("hex")
          .toUpperCase()
    )
    .digest("hex")
    .toUpperCase();
};

const verifyPaymentSignature = (
  merchantId,
  orderId,
  amount,
  currency,
  statusCode,
  receivedMd5sig
) => {
  try {
    // Convert amount to string with 2 decimal places
    const amountStr = parseFloat(amount).toFixed(2);

    // Generate local md5sig for verification
    const localMd5sig = crypto
      .createHash("md5")
      .update(
        merchantId +
          orderId +
          amountStr +
          currency +
          statusCode +
          crypto
            .createHash("md5")
            .update(MERCHANT_SECRET)
            .digest("hex")
            .toUpperCase()
      )
      .digest("hex")
      .toUpperCase();

    // Compare local signature with received signature
    return localMd5sig === receivedMd5sig;
  } catch (error) {
    console.error("Error verifying payment signature:", error);
    return false;
  }
};

const generatePaymentParams = (
  orderId,
  amount,
  currency,
  description,
  customerId,
  customerInfo,
  paymentMethod
) => {
  // Generate hash
  const hash = generateHash(orderId, amount, currency);

  // Prepare payment parameters
  return {
    merchant_id: MERCHANT_ID,
    return_url: process.env.PAYHERE_RETURN_URL,
    cancel_url: process.env.PAYHERE_CANCEL_URL,
    notify_url: process.env.PAYHERE_NOTIFY_URL,
    order_id: orderId,
    currency: currency,
    amount: parseFloat(amount).toFixed(2),
    first_name:
      customerInfo?.firstName ||
      customerInfo?.name?.split(" ")[0] ||
      "Customer",
    last_name:
      customerInfo?.lastName ||
      customerInfo?.name?.split(" ").slice(1).join(" ") ||
      "",
    email: customerInfo?.email || "customer@example.com",
    phone: customerInfo?.phone || "0000000000",
    address: customerInfo?.address || "N/A",
    city: customerInfo?.city || "Colombo",
    country: customerInfo?.country || "Sri Lanka",
    hash: hash,
    payment_method: paymentMethod,
  };
};

const getPaymentUrl = (params) => {
  // Convert params to URL query string
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return `${PAYHERE_URL}?${queryString}`;
};

module.exports = {
  generateHash,
  verifyPaymentSignature,
  generatePaymentParams,
  getPaymentUrl,
  MERCHANT_ID,
  PAYHERE_URL,
};
