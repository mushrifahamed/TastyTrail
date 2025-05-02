const amqp = require('amqplib/callback_api');
const Order = require('../models/Order'); // Assuming you already have Order model

const rabbitmqURL = process.env.RABBITMQ_HOST ? `amqp://${process.env.RABBITMQ_HOST}` : 'amqp://localhost';

// Publish to RabbitMQ
const publishOrderCreatedEvent = (orderId, token) => {
    amqp.connect(rabbitmqURL, (error, connection) => {
      if (error) {
        console.error("RabbitMQ connection error:", error);
        return;
      }
  
      connection.createChannel((error, channel) => {
        if (error) {
          console.error("RabbitMQ channel error:", error);
          return;
        }
  
        const queue = "order_created_queue";
        const msg = JSON.stringify({ orderId, token }); // include token in message
  
        channel.assertQueue(queue, { durable: true });
        channel.sendToQueue(queue, Buffer.from(msg), { persistent: true });
  
        console.log(`Quick Order Event Sent: ${msg}`);
      });
  
      setTimeout(() => {
        connection.close();
      }, 500);
    });
  };
  

// Very Simple Order Creator
const quickCreateOrder = async (req, res, next) => {
  try {
    const { customerId, restaurantId, deliveryAddress, deliveryLocation, items } = req.body;

    if (!customerId || !restaurantId || !deliveryAddress || !items || items.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const order = new Order({
      customerId,
      customerInfo: { name: "Test Customer", phone: "0000000000" },
      items,
      deliveryAddress,
      deliveryLocation: deliveryLocation || { lat: 0, lng: 0 },
      totalAmount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      paymentStatus: "pending",
      trackingStatus: "placed",
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
      statusUpdates: [
        {
          status: "placed",
          timestamp: Date.now(),
          note: "Quick order placed successfully",
        },
      ],
      restaurantId,
    });

    const savedOrder = await order.save();

    // ✅ Pass the token from header
    const token = req.headers.authorization?.split(" ")[1];
    publishOrderCreatedEvent(savedOrder._id, token);

    res.status(201).json({
      message: "Order placed successfully (Quick Mode)",
      orderId: savedOrder._id,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = { quickCreateOrder };
