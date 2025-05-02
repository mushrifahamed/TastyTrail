const amqp = require('amqplib/callback_api');
const axios = require('axios');
const DeliveryPerson = require('../models/deliveryPerson');
const DeliveryOrder = require('../models/orders');

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqURL = `amqp://${rabbitmqHost}`;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';

// ✅ Helper: Convert all values to strings for FCM compliance
const stringifyData = (data) =>
  Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
  );

const listenForNewOrders = () => {
  amqp.connect(rabbitmqURL, (error, connection) => {
    if (error) throw error;

    connection.createChannel((error, channel) => {
      if (error) throw error;

      const queue = 'order_ready_queue';

      channel.assertQueue(queue, { durable: true });
      console.log('📦 Waiting for new orders...');

      channel.consume(queue, async (msg) => {
        if (msg !== null) {
          const orderData = JSON.parse(msg.content.toString());

          try {
            await saveOrderToDeliveryService(orderData);
            channel.ack(msg); // ✅ Acknowledge message
          } catch (error) {
            console.error('❌ Error saving order to Delivery Service:', error.message);
            channel.ack(msg); // Acknowledge to avoid infinite retries
          }
        }
      });
    });
  });
};

const saveOrderToDeliveryService = async (orderData) => {
  try {
    // 🔍 Check if the order already exists
    const existingOrder = await DeliveryOrder.findOne({ orderId: orderData.orderId });
    if (existingOrder) {
      console.log(`⚠️ Order ${orderData.orderId} already exists. Skipping insert.`);
      return; // Exit early — don't save or send notification again
    }

    // 🆕 Create new delivery order
    const newDeliveryOrder = new DeliveryOrder({
      orderId: orderData.orderId,
      customerId: orderData.customerId,
      customerInfo: orderData.customerInfo || {},
      restaurantId: orderData.restaurantId,
      items: orderData.items,
      deliveryAddress: orderData.deliveryAddress,
      deliveryLocation: orderData.deliveryLocation,
      totalAmount: orderData.totalAmount,
      paymentStatus: orderData.paymentStatus || "pending",
      status: "Pending",
      estimatedDeliveryTime: orderData.estimatedDeliveryTime,
    });

    await newDeliveryOrder.save();
    console.log(`✅ Saved new order ${orderData.orderId} into Delivery DB.`);

    // 🔄 Prepare FCM-safe payload
    const dataPayload = stringifyData({
      orderId: orderData.orderId,
      deliveryAddress: orderData.deliveryAddress,
      deliveryLocation: orderData.deliveryLocation,
      totalAmount: orderData.totalAmount,
      estimatedDeliveryTime: orderData.estimatedDeliveryTime,
      customerInfo: orderData.customerInfo,
      items: orderData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
      })),
    });

    // 📣 Send to notification service
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/broadcast`, {
      role: 'delivery_personnel',
      title: 'New Order Available',
      body: 'A new delivery order is available. Accept it quickly!',
      data: dataPayload,
    });

    console.log(`📨 Notification broadcast for order ${orderData.orderId}`);
  } catch (error) {
    console.error('❌ Error in saveOrderToDeliveryService:', error.message);
  }
};


const assignDelivery = async (deliveryOrderId) => {
  try {
    const order = await DeliveryOrder.findById(deliveryOrderId);
    if (!order) {
      console.log(`❌ Delivery Order not found: ${deliveryOrderId}`);
      return;
    }

    const availableDriver = await DeliveryPerson.findOne({ isActive: true });
    if (!availableDriver) {
      console.log(`⚠️ No available drivers for order ${deliveryOrderId}`);
      return;
    }

    order.deliveryPersonId = availableDriver._id;
    order.status = 'Assigned';
    await order.save();

    availableDriver.availability = false;
    await availableDriver.save();

    console.log(`✅ Assigned driver ${availableDriver._id} to order ${deliveryOrderId}`);
  } catch (error) {
    console.error('❌ Error assigning delivery:', error.message);
  }
};

module.exports = { listenForNewOrders };
