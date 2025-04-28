const amqp = require('amqplib/callback_api');
const DeliveryPerson = require('../models/deliveryPerson');  // DeliveryPerson model for saving the details

// Function to listen for delivery person registration events
const listenForDeliveryPersonRegistration = () => {
  amqp.connect('amqp://localhost', (error, connection) => {
    if (error) {
      throw error;
    }

    connection.createChannel((error, channel) => {
      if (error) {
        throw error;
      }

      const queue = 'delivery_person_registered_queue';  // Queue name for listening

      channel.assertQueue(queue, { durable: true });
      console.log('Waiting for delivery person registration events...');

      // Consume the message from the queue
      channel.consume(queue, async (msg) => {
        if (msg !== null) {
          const deliveryPersonData = JSON.parse(msg.content.toString());
          console.log(`Received delivery person event: ${deliveryPersonData.name}`);

          // Save the delivery person details in the DeliveryPerson model
          await saveDeliveryPerson(deliveryPersonData);

          // Acknowledge the message after processing
          channel.ack(msg);
        }
      });
    });
  });
};

// Function to save the delivery person in the DeliveryPerson model
const saveDeliveryPerson = async (data) => {
  try {
    const newDeliveryPerson = new DeliveryPerson({
      name: data.name,
      phone: data.phone,
      location: "",  // You can leave it empty or update later
      availability: true, // Default availability
      vehicleType: data.vehicleType,
      vehicleLicensePlate: data.vehicleLicensePlate,
    });

    // Save the delivery person in the database
    await newDeliveryPerson.save();
    console.log(`Saved delivery person: ${newDeliveryPerson.name}`);
  } catch (error) {
    console.error('Error saving delivery person:', error);
  }
};

// Start listening for the delivery person registration events
listenForDeliveryPersonRegistration();

module.exports = {
  listenForDeliveryPersonRegistration,
};
