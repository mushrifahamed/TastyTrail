const admin = require("firebase-admin");

const sendOrderStatusNotification = async (fcmToken, order) => {
  try {
    console.log("Attempting to send notification:", {
      fcmToken: fcmToken?.substring(0, 10) + "...", // Log partial token for security
      orderId: order._id,
      status: order.status,
    });

    const message = {
      notification: {
        title: "Order Status Update",
        body: `Your order #${order._id} is now ${order.status}`,
      },
      data: {
        orderId: order._id.toString(),
        status: order.status,
        type: "order_update",
      },
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log("✅ FCM Response:", {
      messageId: response,
      success: true,
      timestamp: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    console.error("❌ Notification Error:", {
      error: error.message,
      code: error.code,
      fcmToken: fcmToken?.substring(0, 10) + "...",
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};
