const amqp = require('amqplib/callback_api');
const axios = require('axios');
const DeliveryPerson = require('../models/deliveryPerson');
const DeliveryOrder = require('../models/orders'); // Your updated delivery service order model

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';  // Smart dynamic
const rabbitmqURL = `amqp://${rabbitmqHost}`;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002'; // Set your order-service API base

const listenForNewOrders = () => {
    amqp.connect(rabbitmqURL, (error, connection) => {
        if (error) {
            throw error;
        }

        connection.createChannel((error, channel) => {
            if (error) {
                throw error;
            }

            const queue = 'order_created_queue'; // Queue name used by Order Service

            channel.assertQueue(queue, { durable: true });
            console.log('Waiting for new orders...');

            channel.consume(queue, async (msg) => {
                if (msg !== null) {
                    const { orderId, token } = JSON.parse(msg.content.toString()); // ⬅️ Include token
                    console.log(`Received order ID: ${orderId}`);
            
                    try {
                        const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/${orderId}`, {
                            headers: {
                                Authorization: `Bearer ${token}`, // ⬅️ Send token in header
                            },
                        });
            
                        const orderData = response.data;
            
                        await saveOrderToDeliveryService(orderData);
            
                        // Acknowledge message
                        channel.ack(msg);
                    } catch (error) {
                        console.error('Error fetching order from Order Service:', error.message);
                        channel.ack(msg); // ✅ ACK even if fail (to avoid infinite retry)
                    }
                }
            });
            
        });
    });
};
 // your notification service base URL

const saveOrderToDeliveryService = async (orderData) => {
    try {
        const newDeliveryOrder = new DeliveryOrder({
            orderId: orderData._id,
            customerId: orderData.customerId,
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
        console.log(`Saved new order ${orderData._id} into Delivery DB.`);

        // 📣 Broadcast notification to all drivers
        await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/broadcast`, {
            role: 'driver',  // make sure your Token model stores drivers as role 'driver'
            title: 'New Order Available',
            body: 'A new delivery order is available. Accept it quickly!',
            data: {
                orderId: orderData._id,
                deliveryAddress: orderData.deliveryAddress,
            }
        });
        
    } catch (error) {
        console.error('Error saving order to Delivery Service:', error.message);
    }
};


const assignDelivery = async (deliveryOrderId) => {
    try {
        const order = await DeliveryOrder.findById(deliveryOrderId);
        if (!order) {
            console.log(`Delivery Order not found: ${deliveryOrderId}`);
            return;
        }

        const availableDriver = await DeliveryPerson.findOne({ isActive: true });
        if (!availableDriver) {
            console.log(`No available drivers for order ${deliveryOrderId}`);
            return;
        }

        // Assign the delivery to the available driver
        order.deliveryPersonId = availableDriver._id;
        order.status = 'Assigned';
        await order.save();

        // Update the delivery person's availability
        availableDriver.availability = false;
        await availableDriver.save();

        console.log(`Assigned driver ${availableDriver._id} to delivery order ${deliveryOrderId}`);
    } catch (error) {
        console.error('Error assigning delivery:', error.message);
    }
};

module.exports = { listenForNewOrders };
