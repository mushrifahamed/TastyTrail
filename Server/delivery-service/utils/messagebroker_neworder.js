const amqp = require('amqplib/callback_api');
const DeliveryPerson = require('../models/deliveryPerson');
const Order = require('../models/orders');

const listenForNewOrders = () => {
    amqp.connect('amqp://localhost', (error, connection) => {
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
                    const order = JSON.parse(msg.content.toString());
                    console.log(`Received order ID: ${order.orderId}`);

                    // Process the order in the Delivery Service (assign delivery to driver)
                    await assignDelivery(order.orderId);

                    // Acknowledge the message after processing
                    channel.ack(msg);
                }
            });
        });
    });
};

const assignDelivery = async (orderId) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            console.log(`Order not found: ${orderId}`);
            return;
        }

        const availableDriver = await DeliveryPerson.findOne({ availability: true });
        if (!availableDriver) {
            console.log(`No available drivers for order ${orderId}`);
            return;
        }

        // Assign the delivery to the available driver
        order.deliveryPersonId = availableDriver._id;
        order.status = 'Assigned';
        await order.save();

        // Update the delivery person's availability
        availableDriver.availability = false;
        await availableDriver.save();

        console.log(`Assigned driver ${availableDriver._id} to order ${orderId}`);
    } catch (error) {
        console.error('Error assigning delivery:', error);
    }
};

module.exports = { listenForNewOrders };
